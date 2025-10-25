import hre from "hardhat";

async function main() {
  const [, , consumerAddr, subIdArg, slugArg, apiKeyArg] = process.argv;

  if (!consumerAddr || !subIdArg || !slugArg) {
    console.error("Usage: pnpm hardhat run scripts/requestPrice.ts --network <network> <CONSUMER_ADDRESS> <SUB_ID> <SLUG> [OPENSEA_API_KEY]");
    process.exit(1);
  }

  const subscriptionId = BigInt(subIdArg);
  const slug = slugArg;
  const openSeaApiKey = apiKeyArg ?? "";

  console.log("Requesting price via Chainlink Functions:\n", {
    network: hre.network.name,
    consumer: consumerAddr,
    subscriptionId: subscriptionId.toString(),
    slug,
    apiKeyProvided: openSeaApiKey.length > 0,
  });

  const consumer = await hre.viem.getContractAt("FunctionsNftPriceConsumer", consumerAddr);
  const [deployer] = await hre.viem.getWalletClients();

  const txHash = await consumer.write.requestPrice([
    subscriptionId,
    slug,
    openSeaApiKey,
  ], { account: deployer.account });

  const receipt = await hre.viem.getPublicClient().waitForTransactionReceipt({ hash: txHash });
  console.log("Request sent. Tx:", txHash);
  console.log("Mined in block:", receipt.blockNumber);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


