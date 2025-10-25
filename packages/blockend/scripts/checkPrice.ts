import hre from "hardhat";

async function main() {
  const [, , oracleAddr, slug] = process.argv;
  if (!oracleAddr || !slug) {
    console.error("Usage: pnpm hardhat run scripts/checkPrice.ts --network <network> <ORACLE_ADDRESS> <SLUG>");
    process.exit(1);
  }

  const oracle = await hre.viem.getContractAt("NftFloorOracle", oracleAddr);
  const [priceWei, timestamp, isValid] = await oracle.read.getFloorPrice([slug]);
  console.log(JSON.stringify({ priceWei: priceWei.toString(), timestamp: Number(timestamp), isValid }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


