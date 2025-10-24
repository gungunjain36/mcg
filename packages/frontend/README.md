# NFT Prediction Markets Frontend

A modern prediction market platform for trading on NFT floor price outcomes, built with React, TypeScript, Vite, and Web3.

## Features

- 🎨 **Modern UI/UX** - Built with Tailwind CSS and shadcn/ui components
- 💼 **Wallet Integration** - Connect with any wallet via RainbowKit
- 🔗 **Smart Contract Integration** - Direct interaction with prediction market contracts
- 📊 **Real-time NFT Data** - Live floor prices from OpenSea API
- 📈 **Trading Interface** - Buy and sell YES/NO shares with LMSR pricing
- 🎯 **Market Creation** - Create new prediction markets for any NFT collection
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔍 **Market Discovery** - Search and filter active markets
- 📊 **Portfolio Tracking** - Track your positions across markets
- 🤖 **AI Chat Assistant** - Get insights about markets (placeholder)

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Wagmi v2** - Ethereum interactions
- **Viem** - Ethereum library
- **RainbowKit** - Wallet connection
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Sonner** - Toast notifications

## Getting Started

### Prerequisites

- Node.js v20 (required)
- pnpm (package manager)
- A WalletConnect Project ID (get from https://cloud.walletconnect.com/)

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Setup

1. Create a `.env.local` file in the frontend directory:

```env
# WalletConnect Project ID (REQUIRED)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# OpenSea API Key (optional)
VITE_OPENSEA_API_KEY=your_api_key_here

# GraphQL Endpoint (for indexer)
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
```

2. **Get WalletConnect Project ID** (Required):
   - Visit https://cloud.walletconnect.com/
   - Create a new project
   - Copy the Project ID
   - Add it to your `.env.local` file

3. **Get OpenSea API Key** (Optional):
   - Visit https://docs.opensea.io/reference/api-keys
   - Sign up for an API key
   - Add it to your `.env.local` file

### Running the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ai/             # AI chat widget
│   ├── dashboard/      # Dashboard stats
│   ├── layout/         # Layout components (Header, etc.)
│   ├── market/         # Market-related components
│   ├── trade/          # Trading widgets
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
│   ├── useMarket.ts    # Market contract interactions
│   ├── useMarketFactory.ts  # Factory contract interactions
│   └── use-toast.ts    # Toast notifications
├── lib/                # Utility libraries
│   ├── contracts.ts    # Contract ABIs
│   ├── graphql.ts      # GraphQL queries
│   ├── opensea.ts      # OpenSea API integration
│   ├── utils.ts        # Utility functions
│   └── wagmi.ts        # Web3 configuration
├── pages/              # Page components
│   ├── Home.tsx        # Market listing page
│   ├── MarketDetail.tsx # Individual market page
│   ├── Portfolio.tsx   # User portfolio
│   └── NotFound.tsx    # 404 page
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Smart Contract Integration

The frontend interacts with two main contracts:

1. **MarketFactory** - Creates new prediction markets
2. **Market** - Individual market contract (ERC-1155 for shares)

### Contract Functions

- `createMarket()` - Create a new prediction market
- `buyShares()` - Buy YES or NO shares
- `sellShares()` - Sell YES or NO shares
- `resolveMarket()` - Resolve market (resolver only)
- `redeemShares()` - Claim winnings after resolution

### Contract Configuration

Update contract addresses in `src/lib/wagmi.ts`:

```typescript
export const CONTRACTS = {
  31337: { // Hardhat local
    MarketFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  11155111: { // Sepolia testnet
    MarketFactory: 'YOUR_SEPOLIA_ADDRESS',
  },
  1: { // Mainnet
    MarketFactory: 'YOUR_MAINNET_ADDRESS',
  },
};
```

## OpenSea Integration

The app fetches real-time NFT floor prices from OpenSea:

- Collection search
- Floor price tracking
- Collection metadata

If OpenSea API key is not configured, the app falls back to static data.

## Features in Detail

### Market Creation

Users can create new prediction markets:
1. Search for NFT collection
2. Set target price
3. Set resolution date
4. Provide initial liquidity
5. Market is created on-chain

### Trading

Users can buy/sell YES or NO shares:
- Real-time price calculation using LMSR
- Estimated cost/return before trade
- Maximum profit display
- Transaction confirmation
- Balance tracking

### Market Discovery

Browse and filter markets:
- Active/Resolved/All markets
- Search by question or collection
- Real-time floor price updates
- Market statistics

### Portfolio

Track your positions:
- View all your positions
- See unrealized P&L
- Redeem winning shares
- Transaction history

## Development Workflow

1. **Smart Contracts** - Deploy contracts from `packages/blockend`
2. **Indexer** - Configure and run indexer from `packages/indexer`
3. **Frontend** - Update contract addresses and start dev server

### Working Without Deployed Contracts

The frontend includes mock data for development:
- Mock markets
- Mock trades
- Mock positions

This allows UI development without deployed contracts.

### Integration Checklist

- [ ] Deploy MarketFactory contract
- [ ] Update contract address in `src/lib/wagmi.ts`
- [ ] Get WalletConnect Project ID
- [ ] Get OpenSea API key (optional)
- [ ] Configure and start indexer
- [ ] Update GraphQL endpoint

## Common Issues

### Wallet Won't Connect

- Make sure you have a valid WalletConnect Project ID
- Check that you're on the correct network
- Try clearing browser cache

### Contract Interactions Fail

- Verify contract addresses are correct
- Check you're on the right network (Hardhat local = Chain ID 31337)
- Ensure you have enough ETH for gas

### OpenSea Data Not Loading

- Verify API key is correct
- Check API rate limits
- Falls back to static data if API fails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions:
- Check ENV.md for environment setup
- Review smart contract ABIs in `abi/`
- Check console for error messages

