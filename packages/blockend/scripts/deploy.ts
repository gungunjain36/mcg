import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting deployment...\n");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${(await hre.viem.getPublicClient()).chain.id}\n`);

  // Deploy MockOracle (for development/testing)
  console.log("📡 Deploying MockOracle...");
  const mockOracle = await hre.viem.deployContract("MockOracle");
  console.log(`✅ MockOracle deployed to: ${mockOracle.address}\n`);

  // Deploy MarketResolver
  console.log("🔧 Deploying MarketResolver...");
  const marketResolver = await hre.viem.deployContract("MarketResolver", [
    mockOracle.address,
  ]);
  console.log(`✅ MarketResolver deployed to: ${marketResolver.address}\n`);

  // Deploy MarketFactory
  console.log("🏭 Deploying MarketFactory...");
  const marketFactory = await hre.viem.deployContract("MarketFactory");
  console.log(`✅ MarketFactory deployed to: ${marketFactory.address}\n`);

  // Wait for confirmations (only on live networks)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Waiting for 6 block confirmations...");
    
    const factoryTx = marketFactory.deploymentTransaction();
    const resolverTx = marketResolver.deploymentTransaction();
    const oracleTx = mockOracle.deploymentTransaction();

    if (factoryTx?.hash) {
      await hre.viem.getPublicClient().waitForTransactionReceipt({ 
        hash: factoryTx.hash, 
        confirmations: 6 
      });
    }
    
    console.log("✅ Confirmations received\n");

    // Verify contracts on Etherscan
    console.log("🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: mockOracle.address,
        constructorArguments: [], 
      });
      console.log("✅ MockOracle verified");
    } catch (e: any) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("ℹ️  MockOracle already verified");
      } else {
        console.error("❌ MockOracle verification failed:", e.message);
      }
    }

    try {
      await hre.run("verify:verify", {
        address: marketResolver.address,
        constructorArguments: [mockOracle.address], 
      });
      console.log("✅ MarketResolver verified");
    } catch (e: any) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("ℹ️  MarketResolver already verified");
      } else {
        console.error("❌ MarketResolver verification failed:", e.message);
      }
    }

    try {
      await hre.run("verify:verify", {
        address: marketFactory.address,
        constructorArguments: [], 
      });
      console.log("✅ MarketFactory verified");
    } catch (e: any) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("ℹ️  MarketFactory already verified");
      } else {
        console.error("❌ MarketFactory verification failed:", e.message);
      }
    }
  }

  // Export deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.viem.getPublicClient()).chain.id,
    contracts: {
      MockOracle: mockOracle.address,
      MarketResolver: marketResolver.address,
      MarketFactory: marketFactory.address,
    },
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📝 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Network:        ${hre.network.name}`);
  console.log(`MockOracle:     ${mockOracle.address}`);
  console.log(`MarketResolver: ${marketResolver.address}`);
  console.log(`MarketFactory:  ${marketFactory.address}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}\n`);

  // Copy ABIs for indexer and frontend
  await copyABIs();

  console.log("✨ Deployment complete!\n");
}

async function copyABIs() {
  console.log("📋 Copying ABIs...");
  
  const artifactsDir = path.join(process.cwd(), "artifacts", "contracts");
  const indexerAbiDir = path.join(process.cwd(), "..", "indexer", "abi");
  const frontendAbiDir = path.join(process.cwd(), "..", "frontend", "abi");

  // Create directories if they don't exist
  [indexerAbiDir, frontendAbiDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const contractsToCopy = [
    { name: "MarketFactory", path: "MarketFactory.sol" },
    { name: "Market", path: "Market.sol" },
    { name: "MarketResolver", path: "MarketResolver.sol" },
  ];

  for (const contract of contractsToCopy) {
    const artifactPath = path.join(artifactsDir, contract.path, `${contract.name}.json`);
    
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      const abi = artifact.abi;

      // Write to indexer
      fs.writeFileSync(
        path.join(indexerAbiDir, `${contract.name}.json`),
        JSON.stringify(abi, null, 2)
      );

      // Write to frontend
      fs.writeFileSync(
        path.join(frontendAbiDir, `${contract.name}.json`),
        JSON.stringify(abi, null, 2)
      );

      console.log(`  ✅ Copied ${contract.name} ABI`);
    } else {
      console.log(`  ⚠️  Could not find artifact for ${contract.name}`);
    }
  }

  console.log("");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});

