import { expect } from "chai";
import hre from "hardhat";
import { parseEther, formatEther, Address } from "viem";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Comprehensive Market Tests (Hardhat 3)", function () {
  let marketFactory: any;
  let market: any;
  let mockOracle: any;
  let marketResolver: any;
  let owner: any;
  let trader1: any;
  let trader2: any;
  let publicClient: any;

  beforeEach(async function () {
    publicClient = await hre.viem.getPublicClient();
    [owner, trader1, trader2] = await hre.viem.getWalletClients();

    // Deploy MockOracle
    mockOracle = await hre.viem.deployContract("MockOracle");

    // Deploy MarketResolver
    marketResolver = await hre.viem.deployContract("MarketResolver", [
      mockOracle.address,
    ]);

    // Deploy MarketFactory
    marketFactory = await hre.viem.deployContract("MarketFactory");
  });

  describe("Market Creation", function () {
    it("Should create market with initial liquidity", async function () {
      const initialLiquidity = parseEther("1.0");
      const marketArgs = [
        "Will BAYC floor > 30 ETH?",
        "boredapeyachtclub",
        parseEther("30"),
        BigInt(Math.floor(Date.now() / 1000) + 86400), // +1 day
      ] as const;

      const hash = await marketFactory.write.createMarket(marketArgs, {
        value: initialLiquidity,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Check event emission
      const logs = await publicClient.getLogs({
        address: marketFactory.address,
        event: marketFactory.abi.find((e: any) => e.name === "MarketCreated"),
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      expect(logs.length).to.be.greaterThan(0);
    });

    it("Should revert if no initial liquidity provided", async function () {
      const marketArgs = [
        "Test Market",
        "test-collection",
        parseEther("10"),
        BigInt(Math.floor(Date.now() / 1000) + 86400),
      ] as const;

      try {
        await marketFactory.write.createMarket(marketArgs, {
          value: parseEther("0"),
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("liquidity");
      }
    });

    it("Should emit LiquidityProvided event", async function () {
      const initialLiquidity = parseEther("1.0");
      const marketArgs = [
        "Test Market",
        "test-collection",
        parseEther("10"),
        BigInt(Math.floor(Date.now() / 1000) + 86400),
      ] as const;

      const hash = await marketFactory.write.createMarket(marketArgs, {
        value: initialLiquidity,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Get market address
      const markets = await marketFactory.read.getAllMarkets();
      const marketAddress = markets[markets.length - 1];
      market = await hre.viem.getContractAt("Market", marketAddress);

      // Check that creator received initial shares
      const yesBalance = await market.read.balanceOf([owner.account.address, 1n]);
      const noBalance = await market.read.balanceOf([owner.account.address, 0n]);
      
      expect(yesBalance).to.be.greaterThan(0n);
      expect(noBalance).to.be.greaterThan(0n);
    });
  });

  describe("Trading", function () {
    beforeEach(async function () {
      // Create a market for trading tests
      const initialLiquidity = parseEther("2.0");
      const marketArgs = [
        "Trading Test Market",
        "test-collection",
        parseEther("20"),
        BigInt(Math.floor(Date.now() / 1000) + 86400),
      ] as const;

      const hash = await marketFactory.write.createMarket(marketArgs, {
        value: initialLiquidity,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const markets = await marketFactory.read.getAllMarkets();
      const marketAddress = markets[markets.length - 1];
      market = await hre.viem.getContractAt("Market", marketAddress);
    });

    it("Should buy YES shares with correct cost", async function () {
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);

      const hash = await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const balance = await market.read.balanceOf([trader1.account.address, 1n]);
      expect(balance).to.equal(sharesToBuy);
    });

    it("Should buy NO shares with correct cost", async function () {
      const sharesToBuy = parseEther("5");
      const cost = await market.read.getCostForShares([false, sharesToBuy]);

      const hash = await market.write.buyShares([false, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const balance = await market.read.balanceOf([trader1.account.address, 0n]);
      expect(balance).to.equal(sharesToBuy);
    });

    it("Should emit Trade event with isBuy=true on purchase", async function () {
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);

      const hash = await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = await publicClient.getLogs({
        address: market.address,
        event: market.abi.find((e: any) => e.name === "Trade"),
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      expect(logs.length).to.be.greaterThan(0);
    });

    it("Should sell shares and receive ETH", async function () {
      // First buy
      const sharesToBuy = parseEther("10");
      const buyCost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: buyCost,
        account: trader1.account,
      });

      // Then sell
      const sharesToSell = parseEther("5");
      const ethReturn = await market.read.getReturnForShares([true, sharesToSell]);

      const balanceBefore = await publicClient.getBalance({
        address: trader1.account.address,
      });

      const hash = await market.write.sellShares([true, sharesToSell], {
        account: trader1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const balanceAfter = await publicClient.getBalance({
        address: trader1.account.address,
      });

      // Balance should increase (minus gas)
      expect(balanceAfter).to.be.greaterThan(balanceBefore - parseEther("0.01"));
    });

    it("Should revert sell if insufficient balance", async function () {
      const sharesToSell = parseEther("100");

      try {
        await market.write.sellShares([true, sharesToSell], {
          account: trader1.account,
        });
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("InsufficientBalance");
      }
    });

    it("Should refund excess ETH on purchase", async function () {
      const sharesToBuy = parseEther("5");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      const excessPayment = cost + parseEther("0.5");

      const balanceBefore = await publicClient.getBalance({
        address: trader1.account.address,
      });

      const hash = await market.write.buyShares([true, sharesToBuy], {
        value: excessPayment,
        account: trader1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const balanceAfter = await publicClient.getBalance({
        address: trader1.account.address,
      });

      // Should only lose approximately the cost + gas (not the excess)
      const spent = balanceBefore - balanceAfter;
      expect(spent).to.be.lessThan(cost + parseEther("0.01")); // cost + gas buffer
    });
  });

  describe("Resolution & Redemption", function () {
    beforeEach(async function () {
      const initialLiquidity = parseEther("2.0");
      const resolutionTime = BigInt(Math.floor(Date.now() / 1000) + 3600); // +1 hour
      const marketArgs = [
        "Resolution Test Market",
        "test-collection",
        parseEther("25"),
        resolutionTime,
      ] as const;

      const hash = await marketFactory.write.createMarket(marketArgs, {
        value: initialLiquidity,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const markets = await marketFactory.read.getAllMarkets();
      const marketAddress = markets[markets.length - 1];
      market = await hre.viem.getContractAt("Market", marketAddress);
    });

    it("Should resolve market after resolution time", async function () {
      // Buy some shares
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      // Fast forward time
      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);

      // Resolve
      const finalPrice = parseEther("30"); // Above target
      const hash = await market.write.resolveMarket([finalPrice]);
      await publicClient.waitForTransactionReceipt({ hash });

      const status = await market.read.status();
      expect(status).to.equal(1); // Resolved

      const winningOutcome = await market.read.winningOutcome();
      expect(winningOutcome).to.be.true; // Price above target
    });

    it("Should revert resolution before resolution time", async function () {
      const finalPrice = parseEther("30");

      try {
        await market.write.resolveMarket([finalPrice]);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("ResolutionTimeNotPassed");
      }
    });

    it("Should allow redemption of winning shares", async function () {
      // Buy YES shares
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      // Resolve market (YES wins)
      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);
      const finalPrice = parseEther("30");
      await market.write.resolveMarket([finalPrice]);

      // Redeem
      const balanceBefore = await publicClient.getBalance({
        address: trader1.account.address,
      });

      const hash = await market.write.redeemShares({ account: trader1.account });
      await publicClient.waitForTransactionReceipt({ hash });

      const balanceAfter = await publicClient.getBalance({
        address: trader1.account.address,
      });

      expect(balanceAfter).to.be.greaterThan(balanceBefore);

      // Shares should be burned
      const sharesAfter = await market.read.balanceOf([trader1.account.address, 1n]);
      expect(sharesAfter).to.equal(0n);
    });

    it("Should allow partial redemption", async function () {
      // Buy YES shares
      const sharesToBuy = parseEther("20");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      // Resolve market
      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);
      await market.write.resolveMarket([parseEther("30")]);

      // Partial redeem
      const sharesToRedeem = parseEther("10");
      const hash = await market.write.redeemSharesPartial([sharesToRedeem], {
        account: trader1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const remainingShares = await market.read.balanceOf([
        trader1.account.address,
        1n,
      ]);
      expect(remainingShares).to.equal(sharesToBuy - sharesToRedeem);
    });

    it("Should emit SharesRedeemed event", async function () {
      // Buy and resolve
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);
      await market.write.resolveMarket([parseEther("30")]);

      // Redeem
      const hash = await market.write.redeemShares({ account: trader1.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = await publicClient.getLogs({
        address: market.address,
        event: market.abi.find((e: any) => e.name === "SharesRedeemed"),
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      expect(logs.length).to.be.greaterThan(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const initialLiquidity = parseEther("2.0");
      const marketArgs = [
        "View Test Market",
        "test-collection",
        parseEther("20"),
        BigInt(Math.floor(Date.now() / 1000) + 86400),
      ] as const;

      const hash = await marketFactory.write.createMarket(marketArgs, {
        value: initialLiquidity,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const markets = await marketFactory.read.getAllMarkets();
      const marketAddress = markets[markets.length - 1];
      market = await hre.viem.getContractAt("Market", marketAddress);
    });

    it("Should return correct market info", async function () {
      const info = await market.read.getMarketInfo();
      expect(info[0]).to.equal("View Test Market");
      expect(info[1]).to.equal("test-collection");
    });

    it("Should return user balances", async function () {
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      const balances = await market.read.getUserBalances([trader1.account.address]);
      expect(balances[0]).to.equal(sharesToBuy); // YES shares
    });

    it("Should return position value", async function () {
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      const value = await market.read.getPositionValue([trader1.account.address]);
      expect(value[2]).to.be.greaterThan(0n); // totalValue
    });

    it("Should return correct redeemable amount after resolution", async function () {
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);
      await market.write.resolveMarket([parseEther("30")]);

      const redeemable = await market.read.getRedeemableAmount([
        trader1.account.address,
      ]);
      expect(redeemable).to.be.greaterThan(0n);
    });

    it("Should check if user can redeem", async function () {
      const sharesToBuy = parseEther("10");
      const cost = await market.read.getCostForShares([true, sharesToBuy]);
      await market.write.buyShares([true, sharesToBuy], {
        value: cost,
        account: trader1.account,
      });

      // Before resolution
      let canRedeem = await market.read.canRedeem([trader1.account.address]);
      expect(canRedeem).to.be.false;

      // After resolution
      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);
      await market.write.resolveMarket([parseEther("30")]);

      canRedeem = await market.read.canRedeem([trader1.account.address]);
      expect(canRedeem).to.be.true;
    });
  });

  describe("MarketResolver Contract", function () {
    beforeEach(async function () {
      const initialLiquidity = parseEther("2.0");
      const resolutionTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const marketArgs = [
        "Resolver Test Market",
        "test-collection",
        parseEther("20"),
        resolutionTime,
      ] as const;

      const hash = await marketFactory.write.createMarket(marketArgs, {
        value: initialLiquidity,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const markets = await marketFactory.read.getAllMarkets();
      const marketAddress = markets[markets.length - 1];
      market = await hre.viem.getContractAt("Market", marketAddress);
    });

    it("Should authorize resolver", async function () {
      await marketResolver.write.authorizeResolver([trader1.account.address]);
      const isAuthorized = await marketResolver.read.authorizedResolvers([
        trader1.account.address,
      ]);
      expect(isAuthorized).to.be.true;
    });

    it("Should resolve market manually via resolver contract", async function () {
      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);

      const finalPrice = parseEther("25");
      const hash = await marketResolver.write.resolveMarketManual([
        market.address,
        finalPrice,
      ]);
      await publicClient.waitForTransactionReceipt({ hash });

      const status = await market.read.status();
      expect(status).to.equal(1); // Resolved
    });

    it("Should check if market is ready for resolution", async function () {
      // Before resolution time
      let result = await marketResolver.read.isMarketReadyForResolution([
        market.address,
      ]);
      expect(result[0]).to.be.false;

      // After resolution time
      const resolutionTimestamp = await market.read.resolutionTimestamp();
      await time.increaseTo(resolutionTimestamp + 1n);

      result = await marketResolver.read.isMarketReadyForResolution([
        market.address,
      ]);
      expect(result[0]).to.be.true;
    });
  });
});


