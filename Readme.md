# mcg.fun - NFT Prediction Markets

A decentralized prediction market platform for trading on NFT floor price outcomes. Built with smart contracts, a real-time indexer, and a modern React frontend.

## 🎯 Overview

mcg.fun allows users to:
- Create prediction markets for NFT floor prices
- Trade YES/NO outcome shares using LMSR (Logarithmic Market Scoring Rule)
- Track real-time NFT floor prices from OpenSea
- Resolve markets based on actual floor prices
- Claim winnings from correct predictions

## 🏗️ Architecture

The project consists of three main packages:

```
mcg-fun/
├── packages/
│   ├── blockend/      # Smart contracts (Hardhat)
│   ├── indexer/       # Envio HyperIndex for blockchain data
│   └── frontend/      # React + TypeScript UI
```

### Tech Stack

- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Indexer**: Envio HyperIndex, GraphQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Wagmi v2, RainbowKit
- **External APIs**: OpenSea API for NFT floor prices

## 🚀 Quick Start

### Prerequisites

- Node.js v20 (required)
- pnpm (package manager)
- Docker (for indexer)
- Ethereum wallet with testnet ETH

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### 2. Deploy Smart Contracts

```bash
cd packages/blockend

# Start local Hardhat node
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.ts --network localhost

# Note the deployed MarketFactory address
```

### 3. Configure Indexer

```bash
cd packages/indexer

# Update config.yaml with deployed contract address
# Edit config.yaml and add the MarketFactory address

# Generate indexer code
pnpm codegen

# Start indexing
TUI_OFF=true pnpm dev
```

### 4. Configure Frontend

```bash
cd packages/frontend

# Create .env.local file
cat > .env.local << EOF
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_OPENSEA_API_KEY=your_api_key_here
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
EOF

# Update src/lib/wagmi.ts with deployed MarketFactory address

# Start dev server
pnpm dev
```

Visit `http://localhost:5173` to use the app!

## 📦 Package Details

### packages/blockend - Smart Contracts

Ethereum smart contracts for the prediction market:

- **MarketFactory.sol** - Factory for creating new markets
- **Market.sol** - Individual market with ERC-1155 shares and LMSR pricing

**Features:**
- LMSR automated market maker
- ERC-1155 for fungible YES/NO shares
- Time-locked resolution
- Permissioned resolver
- Share redemption after resolution

See [packages/blockend/README.md](packages/blockend/README.md) for details.

### packages/indexer - Envio HyperIndex

Real-time blockchain indexer using Envio:

- Indexes MarketCreated events
- Tracks all trades
- Calculates user positions
- Aggregates global statistics
- Exposes GraphQL API

**Schema Entities:**
- Market
- User
- Position
- Trade
- GlobalStats

See [packages/indexer/README.md](packages/indexer/README.md) for details.

### packages/frontend - React App

Modern web interface for the prediction markets:

- Wallet connection (RainbowKit)
- Market creation with OpenSea search
- Buy/sell shares with real-time pricing
- Portfolio tracking
- Real-time NFT floor prices
- Market discovery and filtering

See [packages/frontend/README.md](packages/frontend/README.md) for details.

## 🎮 How It Works

### Creating a Market

1. User selects an NFT collection (via OpenSea search)
2. Sets a target floor price (e.g., "Will BAYC floor be > 30 ETH?")
3. Sets resolution date
4. Provides initial liquidity in ETH
5. Market is created on-chain with YES and NO shares

### Trading Shares

1. Users buy YES shares if they think the outcome will be YES
2. Or buy NO shares if they think the outcome will be NO
3. Prices adjust dynamically based on the ratio of shares using LMSR
4. Users can sell shares back to the market at any time
5. Each share represents a claim on 1 ETH if that outcome wins

### Market Resolution

1. After the resolution date, the resolver checks the NFT floor price
2. Resolver calls `resolveMarket()` with the actual floor price
3. Market determines if floor price met the target (YES) or not (NO)
4. Winning share holders can redeem their shares for ETH
5. Each winning share = 1 ETH payout

## 🔑 Key Features

### Smart Contract Features
- ✅ LMSR automated market maker
- ✅ ERC-1155 fungible shares
- ✅ Time-locked resolution
- ✅ Slippage protection
- ✅ Efficient liquidity provision

### Indexer Features
- ✅ Real-time event indexing
- ✅ GraphQL API
- ✅ Position tracking
- ✅ Trade history
- ✅ Global statistics

### Frontend Features
- ✅ Wallet connection (any EVM wallet)
- ✅ Market creation UI
- ✅ Trading interface
- ✅ OpenSea integration
- ✅ Portfolio tracking
- ✅ Responsive design
- ✅ Real-time updates

## 🛠️ Development

### Smart Contract Development

```bash
cd packages/blockend

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to network
npx hardhat run scripts/deploy.ts --network <network>
```

### Indexer Development

```bash
cd packages/indexer

# After modifying schema.graphql or config.yaml
pnpm codegen

# Check TypeScript compilation
pnpm tsc --noEmit

# Start development mode
TUI_OFF=true pnpm dev
```

### Frontend Development

```bash
cd packages/frontend

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

## 🧪 Testing

### Smart Contract Tests

```bash
cd packages/blockend
npx hardhat test
```

### Indexer Tests

```bash
cd packages/indexer
pnpm test
```

### Frontend Tests

```bash
cd packages/frontend
pnpm test
```

## 📝 Environment Variables

### Frontend (.env.local)

```env
VITE_WALLETCONNECT_PROJECT_ID=     # Required from cloud.walletconnect.com
VITE_OPENSEA_API_KEY=              # Optional from docs.opensea.io
VITE_GRAPHQL_ENDPOINT=             # Indexer GraphQL endpoint
```

### Indexer (config.yaml)

```yaml
networks:
  - id: 31337
    contracts:
      - name: MarketFactory
        address: [YOUR_DEPLOYED_ADDRESS]
```

## 🚢 Deployment

### 1. Deploy Smart Contracts

```bash
cd packages/blockend
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2. Configure Indexer

Update `packages/indexer/config.yaml` with:
- Network ID
- Contract addresses
- RPC URL

```bash
cd packages/indexer
pnpm codegen
# Deploy to cloud or run locally
```

### 3. Deploy Frontend

```bash
cd packages/frontend
pnpm build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Any static hosting
```

## 🔐 Security Considerations

- Smart contracts use OpenZeppelin libraries
- Time-locked resolution prevents premature resolution
- Slippage protection on trades
- No admin keys or upgradeability (immutable contracts)
- Resolver role for market resolution

**Note**: These contracts are for educational/hackathon purposes. Audit before mainnet deployment.

## 📊 Contract Addresses

### Hardhat Local (Chain ID: 31337)
- MarketFactory: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (default)

### Sepolia Testnet (Chain ID: 11155111)
- MarketFactory: `TBD`

### Mainnet (Chain ID: 1)
- MarketFactory: `TBD`

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Envio for the HyperIndex indexer
- RainbowKit for wallet connection
- OpenSea for NFT data
- shadcn/ui for beautiful components

## 📚 Resources

- [Envio Documentation](https://docs.envio.dev/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [OpenSea API Documentation](https://docs.opensea.io/)
- [Hardhat Documentation](https://hardhat.org/)

## 🐛 Known Issues

- OpenSea API has rate limits (use API key for higher limits)
- Indexer requires Docker to run
- Local Hardhat network resets on restart

## 🗺️ Roadmap

- [ ] Support for more chains (Polygon, Arbitrum, etc.)
- [ ] Additional market types (binary outcomes beyond price)
- [ ] Liquidity provider rewards
- [ ] Market analytics dashboard
- [ ] Mobile app
- [ ] Social features (comments, follows)
- [ ] Advanced charting
- [ ] Automated market resolution (Chainlink oracles)

## 💬 Support

For questions or issues:
- Open a GitHub issue
- Check package-specific READMEs
- Review documentation links above

---

Built with ❤️ for the NFT and prediction market communities

