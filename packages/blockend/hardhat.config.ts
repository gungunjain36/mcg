import { HardhatUserConfig } from "hardhat/config"; // <-- Make sure this line is uncommented
import "@nomicfoundation/hardhat-toolbox-viem"; // Use the correct toolbox for Hardhat 3 + Viem
import "dotenv/config";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
// Ensure PRIVATE_KEY starts with 0x for consistency and provide a default empty key
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith('0x') 
  ? process.env.PRIVATE_KEY 
  : (process.env.PRIVATE_KEY ? `0x${process.env.PRIVATE_KEY}` : "0x0000000000000000000000000000000000000000000000000000000000000000"); 

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Apply the HardhatUserConfig type to ensure correctness
const config: HardhatUserConfig = { 
  solidity: "0.8.24", // Match the version used in your contracts (e.g., Market.sol)
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111, // <-- Explicitly add the Sepolia chain ID
    },
    hardhat: {}, // Keep the local network config for testing
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts", // Your contracts are here
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;