import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CoreModule = buildModule("CoreModuleV4", (m) => {
  // Chainlink Functions config for Sepolia (can be overridden via parameters)
  const router = m.getParameter(
    "functionsRouter",
    "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"
  );
  const donId = m.getParameter(
    "functionsDonId",
    "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000"
  );

  const nftFloorOracle = m.contract("NftFloorOracle");

  const functionsConsumer = m.contract("FunctionsNftPriceConsumer", [
    router,
    donId,
    nftFloorOracle,
  ]);

  const marketResolver = m.contract("MarketResolver", [nftFloorOracle]);

  const marketFactory = m.contract("MarketFactory");

  // Grant reporter role to the Functions consumer so it can write prices
  m.call(nftFloorOracle, "grantReporter", [functionsConsumer]);

  return { nftFloorOracle, functionsConsumer, marketResolver, marketFactory };
});

export default CoreModule;


