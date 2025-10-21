import viem from "hardhat";


async function main() {
  console.log("Deploying MarketFactory contract...");
  
  const marketFactory = await viem.deployContract("MarketFactory");

  const factoryAddress = marketFactory.address;
  console.log(`MarketFactory deployed to: ${factoryAddress}`);
  console.log("\n Waiting for 6 block confirmations...");
  const deploymentTx = marketFactory.deploymentTransaction();

  if (deploymentTx?.hash) {
    await viem.getPublicClient().waitForTransactionReceipt({ 
      hash: deploymentTx.hash, 
      confirmations: 6 
    });
  } else {
    console.warn("Could not find deployment transaction hash to wait for confirmations.");
  }

  console.log("\n Verifying contract on Etherscan...");
  try {
    await run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [], 
    });
    console.log("Contract verified successfully!");
  } catch (e: any) {
    
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Verification failed:", e);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

