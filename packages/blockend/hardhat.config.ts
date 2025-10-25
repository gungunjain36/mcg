import { HardhatUserConfig } from "hardhat/config";
import hardhatIgnition from "@nomicfoundation/hardhat-ignition";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
// Ensure PRIVATE_KEY starts with 0x for consistency and provide a default empty key
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith('0x') 
  ? process.env.PRIVATE_KEY 
  : (process.env.PRIVATE_KEY ? `0x${process.env.PRIVATE_KEY}` : "0x0000000000000000000000000000000000000000000000000000000000000000"); 

// Apply the HardhatUserConfig type to ensure correctness
const config: HardhatUserConfig = { 
  solidity: "0.8.24", // Match the version used in your contracts (e.g., Market.sol)
  plugins: [hardhatIgnition, hardhatVerify, hardhatNetworkHelpers],
  networks: {
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    hardhat: {
      type: "edr-simulated",
    },
  },
  paths: {
    sources: "./contracts", // Your contracts are here
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;