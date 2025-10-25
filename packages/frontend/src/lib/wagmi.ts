import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia, mainnet } from 'wagmi/chains';
import { defineChain } from 'viem';

// IMPORTANT: Get your WalletConnect Project ID from https://cloud.walletconnect.com/
// Replace 'YOUR_PROJECT_ID' with your actual project ID
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Configure chains based on environment
export const config = getDefaultConfig({
  appName: 'NFT Prediction Markets',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [
    sepolia,
    defineChain({
      id: 84532,
      name: 'Base Sepolia',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://sepolia.base.org'] }, // @Web
      },
      blockExplorers: {
        default: { name: 'Base Sepolia Explorer', url: 'https://sepolia-explorer.base.org' },
      },
      testnet: true,
    }),
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
    MarketFactory: '0xb5f2500b9613F738bA743e78eb9bD1a4eb698C59', // Updated Sepolia address
  },
  // Base Sepolia testnet
  84532: {
    MarketFactory: '0x25A57013bc5139E3FCb06189592652Cd146aecA5', // fill after deploying to Base Sepolia
  },
  // Mainnet
  1: {
    MarketFactory: '', // Add mainnet address when deployed
  },
} as const;

export const getMarketFactoryAddress = (chainId: number): string | undefined => {
  return CONTRACTS[chainId as keyof typeof CONTRACTS]?.MarketFactory;
};

