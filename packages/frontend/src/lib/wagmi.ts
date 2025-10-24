import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia, mainnet } from 'wagmi/chains';

// IMPORTANT: Get your WalletConnect Project ID from https://cloud.walletconnect.com/
// Replace 'YOUR_PROJECT_ID' with your actual project ID
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Configure chains based on environment
export const config = getDefaultConfig({
  appName: 'NFT Prediction Markets',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [
    hardhat,
    sepolia,
    ...(import.meta.env.MODE === 'production' ? [mainnet] : []),
  ],
  ssr: false,
});

// Contract addresses - update these with your deployed addresses
export const CONTRACTS = {
  // Default to hardhat local network
  31337: {
    MarketFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  // Sepolia testnet
  11155111: {
    MarketFactory: '0x84ace9de871cdca72aed2df45ef03f92ed643083', // Deployed on Sepolia
  },
  // Mainnet
  1: {
    MarketFactory: '', // Add mainnet address when deployed
  },
} as const;

export const getMarketFactoryAddress = (chainId: number): string | undefined => {
  return CONTRACTS[chainId as keyof typeof CONTRACTS]?.MarketFactory;
};

