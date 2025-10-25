// Contract ABIs and utilities
// Note: ABIs are extracted directly to avoid module resolution issues with '#' in filenames

// MarketFactory ABI (extracted from CoreModule#MarketFactory.json)
export const MARKET_FACTORY_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "marketAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "question",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "collectionSlug",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "targetPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "resolutionTimestamp",
        "type": "uint256"
      }
    ],
    "name": "MarketCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allMarkets",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_question",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_collectionSlug",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_targetPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_resolutionTimestamp",
        "type": "uint256"
      }
    ],
    "name": "createMarket",
    "outputs": [
      {
        "internalType": "address",
        "name": "marketAddress",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMarkets",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Market ABI is embedded in the factory's bytecode since it deploys Market contracts
// For now, we'll define the essential functions we need to interact with Market contracts
export const MARKET_ABI = [
  {
    "inputs": [{"internalType": "bool", "name": "outcome", "type": "bool"}, {"internalType": "uint256", "name": "shares", "type": "uint256"}],
    "name": "buyShares",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "balanceOf",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bool", "name": "outcome", "type": "bool"}, {"internalType": "uint256", "name": "shares", "type": "uint256"}],
    "name": "sellShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "redeemShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_finalPrice", "type": "uint256"}],
    "name": "resolveMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bool", "name": "outcome", "type": "bool" }],
    "name": "getSpotPrice",
    "outputs": [{ "internalType": "uint256", "name": "price", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketInfo",
    "outputs": [
      {"internalType": "string", "name": "question", "type": "string"},
      {"internalType": "string", "name": "collectionSlug", "type": "string"},
      {"internalType": "uint256", "name": "targetPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "resolutionTimestamp", "type": "uint256"},
      {"internalType": "enum Market.MarketStatus", "name": "status", "type": "uint8"},
      {"internalType": "bool", "name": "winningOutcome", "type": "bool"},
      {"internalType": "uint256", "name": "yesSharesTotal", "type": "uint256"},
      {"internalType": "uint256", "name": "noSharesTotal", "type": "uint256"},
      {"internalType": "uint256", "name": "spotPriceYes", "type": "uint256"},
      {"internalType": "uint256", "name": "spotPriceNo", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserBalances",
    "outputs": [
      {"internalType": "uint256", "name": "yesShares", "type": "uint256"},
      {"internalType": "uint256", "name": "noShares", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bool", "name": "outcome", "type": "bool"}, {"internalType": "uint256", "name": "shares", "type": "uint256"}],
    "name": "getCostForShares",
    "outputs": [{"internalType": "uint256", "name": "cost", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bool", "name": "outcome", "type": "bool"}, {"internalType": "uint256", "name": "shares", "type": "uint256"}],
    "name": "getReturnForShares",
    "outputs": [{"internalType": "uint256", "name": "returnAmount", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "bool", "name": "outcome", "type": "bool"},
      {"indexed": false, "internalType": "uint256", "name": "ethAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "shareAmount", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "isBuy", "type": "bool"}
    ],
    "name": "Trade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "bool", "name": "winningOutcome", "type": "bool"},
      {"indexed": false, "internalType": "uint256", "name": "finalReportedPrice", "type": "uint256"}
    ],
    "name": "MarketResolved",
    "type": "event"
  }
] as const;

export { MARKET_FACTORY_ABI as marketFactoryABI, MARKET_ABI as marketABI };

