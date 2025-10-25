import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CoreModule = buildModule("CoreModule", (m) => {
  const mockOracle = m.contract("MockOracle");

  const marketResolver = m.contract("MarketResolver", [mockOracle]);

  const marketFactory = m.contract("MarketFactory");

  return { mockOracle, marketResolver, marketFactory };
});

export default CoreModule;


