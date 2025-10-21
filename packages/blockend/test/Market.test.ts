import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPublicClient, deployContract, getContractAt, getWalletClients } from "@nomicfoundation/hardhat-viem";
import { parseEther, formatEther } from "viem";
import  time from "@nomicfoundation/hardhat-network-helpers";
import { network } from "hardhat";

describe("MarketFactory and Market Contracts", async function () {
  const publicClient = await getPublicClient();
  const [owner, trader1, trader2] = await getWalletClients();

  describe("Market Creation", function () {
    it("Should create a new market and emit the MarketCreated event", async function () {
      const marketFactory = await deployContract("MarketFactory", []);
      const initialLiquidity = parseEther("1.0");

      const marketArgs = [
        "Will BAYC floor price be > 30 ETH by Nov 1st?",
        "boredapeyachtclub",
        parseEther("30"),
        BigInt(new Date("2025-11-01T23:59:59Z").getTime() / 1000), // Nov 1, 2025 end of day
      ] as const;

      // Perform the transaction
      const txHash = await marketFactory.write.createMarket(marketArgs, { value: initialLiquidity });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      
      const abi = marketFactory.abi;
      let marketAddress;
      for (const log of receipt.logs) {
        try {
          const parsed = abi.parseLog({ ...log });
          if (parsed.eventName === "MarketCreated") {
            assert.equal(parsed.args[0], owner.account.address, "Creator should match owner");
            assert.ok(typeof parsed.args[1] === "string", "Market address should be a string");
            marketAddress = parsed.args[1];
            break;
          }
        } catch (e) {
 
        }
      }
      assert.ok(marketAddress, "MarketCreated event should be emitted");

      const markets = await marketFactory.read.getAllMarkets();
      assert.equal(markets.length, 1, "A market should be created");
    });
  });

  describe("Full Market Lifecycle", function () {

    async function deployAndCreateMarket() {
      const marketFactory = await deployContract("MarketFactory", []);
      const initialLiquidity = parseEther("2.0");

      // Create the market
      const marketArgs = [
        "Will Punks floor be > 50 ETH?",
        "cryptopunks",
        parseEther("50"),
        BigInt(new Date("2025-11-01T23:59:59Z").getTime() / 1000), 
      ] as const;
      const txHash = await marketFactory.write.createMarket(marketArgs, { value: initialLiquidity });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      
      const abi = marketFactory.abi;
      let marketAddress;
      for (const log of receipt.logs) {
        try {
          const parsed = abi.parseLog({ ...log });
          if (parsed.eventName === "MarketCreated") {
            marketAddress = parsed.args[1];
            break;
          }
        } catch (e) {

        }
      }
      assert.ok(marketAddress, "Market address should be valid");

      const market = getContractAt("Market", marketAddress);

      return { marketFactory, market };
    }

    it("Should allow a user to buy YES shares and update state", async function () {
      const { market } = await deployAndCreateMarket();

      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);

      console.log(`\nCost to buy 10 YES shares: ${formatEther(cost)} ETH`);

      await market.write.buyShares([true, sharesToBuy], { value: cost, account: trader1.account });

      const traderYesBalance = await market.read.balanceOf([trader1.account.address, 1n]); 
      assert.equal(traderYesBalance, sharesToBuy, "Trader 1 should own 10 YES shares");
    });

    it("Should allow a user to sell YES shares", async function () {
      const { market } = await deployAndCreateMarket();

      // First, trader1 buys shares
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], { value: cost, account: trader1.account });

      // Now, trader1 sells them back
      const sharesToSell = parseEther("5");
      const ethToReceive = await market.read.getReturnForShares([true, sharesToSell]);
      console.log(`Return for selling 5 YES shares: ${formatEther(ethToReceive)} ETH`);

      await market.write.sellShares([true, sharesToSell], { account: trader1.account });

      const remainingBalance = await market.read.balanceOf([trader1.account.address, 1n]);
      assert.equal(remainingBalance, sharesToBuy - sharesToSell, "Trader 1 should have 5 YES shares remaining");
    });

    it("Should allow the resolver to resolve the market and emit event", async function () {
      const { market } = await deployAndCreateMarket();

     
      await time.increaseTo(BigInt(new Date("2025-11-02T00:00:00Z").getTime() / 1000));

      const finalPrice = parseEther("60");

      const txHash = await market.write.resolveMarket([finalPrice], { account: owner.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

 
      const abi = market.abi;
      let winningOutcome;
      let reportedPrice;
      for (const log of receipt.logs) {
        try {
          const parsed = abi.parseLog({ ...log });
          if (parsed.eventName === "MarketResolved") {
            winningOutcome = parsed.args[0]; 
            reportedPrice = parsed.args[1];
            break;
          }
        } catch (e) {
         
        }
      }
      assert.equal(winningOutcome, true, "Winning outcome should be true");
      assert.equal(reportedPrice, finalPrice, "Final reported price should match");

      const marketStatus = await market.read.status();
      assert.equal(marketStatus, 1, "Market status should be Resolved");
    });

    it("Should allow a winner to redeem their shares after resolution", async function () {
      const { market } = await deployAndCreateMarket();

 
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], { value: cost, account: trader1.account });

    
      await time.increaseTo(BigInt(new Date("2025-11-02T00:00:00Z").getTime() / 1000));
      await time.mine();
      const finalPrice = parseEther("60");
      await market.write.resolveMarket([finalPrice], { account: owner.account });

   
      const preRedeemBalance = await publicClient.getBalance({ address: trader1.account.address });

     
      await market.write.redeemShares({ account: trader1.account });

      const postRedeemBalance = await publicClient.getBalance({ address: trader1.account.address });
      assert.ok(postRedeemBalance > preRedeemBalance, "Trader 1 should receive ETH payout");

      const finalBalance = await market.read.balanceOf([trader1.account.address, 1n]);
      assert.equal(finalBalance, 0n, "Trader 1 should have no YES shares after redeeming");
    });
  });
});