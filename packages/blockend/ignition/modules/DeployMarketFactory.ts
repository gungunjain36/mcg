import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MarketFactoryModule = buildModule("MarketFactoryModule", (m) => {

  const marketFactory = m.contract("MarketFactory");
  return { marketFactory };
});

export default MarketFactoryModule;
