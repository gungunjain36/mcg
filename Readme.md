<p align="center">
  <img src="https://github.com/user-attachments/assets/6be08ea1-3491-4034-870e-9307490c5020" alt="mcg logo" width="160" />
</p>
<h2 align="center">mcg.fun</h2>

mcg.fun is a full‑stack, decentralized prediction market where anyone can create and trade markets on NFT collection floor price outcomes. Under the hood, the protocol mints ERC‑1155 YES/NO shares, prices trades via a battle‑tested LMSR automated market maker, and enforces a time‑locked resolution flow. A real‑time indexer powers rich analytics, while a modern React application provides a smooth, wallet‑first experience.

Autonomous AI agents enhance the product with always‑on market analysis, automated resolution, and personalized portfolio guidance—without requiring a bespoke backend. Together, these components deliver a practical and opinionated blueprint for price‑based prediction markets on NFTs.

## 🔗 Links

- App (preview): https://mcgdotfun.vercel.app/

## 📸 Screenshots
![WhatsApp Image 2025-10-26 at 8 48 15 PM](https://github.com/user-attachments/assets/9b1000a6-5aa0-427c-b72b-929f0abc43fc)
![WhatsApp Image 2025-10-26 at 8 48 16 PM](https://github.com/user-attachments/assets/8fa9ee1c-51c2-4033-99a0-fc102f5037dc)
![WhatsApp Image 2025-10-26 at 8 48 16 PM (1)](https://github.com/user-attachments/assets/94cc1752-6bff-4e56-bce2-ac9fe408bf6f)
![WhatsApp Image 2025-10-26 at 8 48 38 PM](https://github.com/user-attachments/assets/751af4d2-ed9c-4f52-99dd-f58c605fac96)
![WhatsApp Image 2025-10-26 at 8 48 39 PM](https://github.com/user-attachments/assets/76fde155-1bcc-46ae-abdb-190d453e75c0)
![WhatsApp Image 2025-10-26 at 8 48 39 PM (1)](https://github.com/user-attachments/assets/9c7cfe6d-14b7-4c71-8a9f-c7c15f17fae2)



## 🧭 Architecture Diagram

<!-- Intentionally left blank (add diagram as needed) -->

## 🔑 Key Features

- Smart contracts
  - Deterministic LMSR AMM for continuous pricing and instant liquidity
  - ERC‑1155 YES/NO shares for gas‑efficient, fungible positions
  - Time‑locked, trust‑minimized resolution and ETH redemption for winners

- Indexer
  - Real‑time event ingestion and entity updates using Envio HyperIndex
  - Derived views for user positions, trade history, and global stats
  - GraphQL API for low‑latency, strongly‑typed queries from the frontend

- Frontend
  - Wallet connection with RainbowKit and type‑safe EVM calls via Wagmi/Viem
  - Market creation with OpenSea search and floor price context
  - Intuitive trading UI with slippage protection and instant feedback
  - Portfolio insights, responsive layout, and polished UI via shadcn/ui + Tailwind

- AI agents
  - Market analysis with knowledge‑driven MeTTa reasoning
  - Automated, scheduled market resolution with on‑chain settlement
  - Personalized portfolio advice and risk‑aware recommendations
  - Oracle aggregation with outlier resistance and confidence scoring

## 🧱 Application Architecture

Monorepo with four primary packages under `packages/`:

- Smart Contracts — `packages/blockend`
  - Built with Hardhat + Solidity and OpenZeppelin. Chosen for familiar DX, rich plugin ecosystem, and fast local node.
  - Why: Deterministic LMSR pricing, ERC-1155 share fungibility, explicit time-locked resolution.

- Indexer — `packages/indexer`
  - Runs Envio HyperIndex with TypeScript handlers and GraphQL output. Chosen for low-latency indexing and ergonomic dev loop.
  - Why: Live market data, user positions, trade history, and global analytics exposed via GraphQL.

- Frontend — `packages/frontend`
  - React + TypeScript + Vite with Tailwind and shadcn/ui; wallet via RainbowKit, web3 via Wagmi/Viem.
  - Why: Modern UI, fast HMR, strong type safety, first-class wallet UX.

- ASI Agents — `packages/asi-agents`
  - uAgents (Fetch.ai), MeTTa (SingularityNET), Agentverse hosting, ASI:One chat protocol.
  - Why: Autonomous analysis, trustless resolution flows, and advisory features without a custom backend.

Referenced tools and where they live:

- Envio HyperIndex → `packages/indexer`
- Hardhat + Solidity → `packages/blockend`
- React, Wagmi, RainbowKit, shadcn/ui → `packages/frontend`
- uAgents, Agentverse, MeTTa, ASI:One → `packages/asi-agents`

Sponsors, services, and libs we use (and why):

- ASI Alliance (agents track) — autonomous integrations and hosting options
- Fetch.ai (uAgents, Agentverse) — lightweight agent framework + free agent hosting
- SingularityNET (MeTTa) — explainable knowledge representation and reasoning
- Envio — real-time, ergonomic EVM indexing with GraphQL
- RainbowKit/Wagmi/Viem — wallet UX and type-safe EVM interactions
- OpenSea API — reliable NFT collection floor prices
- shadcn/ui + Tailwind — modern, accessible, composable UI components

## 🧰 Development

### Smart contracts

```bash
cd packages/blockend
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network <network>
```

### Indexer

```bash
cd packages/indexer
pnpm codegen
pnpm tsc --noEmit
TUI_OFF=true pnpm dev
```

### Frontend

```bash
cd packages/frontend
pnpm dev
pnpm build
pnpm preview
pnpm lint
```

## 🚀 Installation

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for indexer)
- Ethereum wallet (for local/testnet)
- Python 3.10+ (only if using agents)

### 1) Install deps

```bash
pnpm install
```

### 2) Contracts (local)

```bash
cd packages/blockend
npx hardhat node
# new terminal
npx hardhat run scripts/deploy.ts --network localhost
```

### 3) Indexer

```bash
cd packages/indexer
# update config.yaml with MarketFactory address
pnpm codegen
TUI_OFF=true pnpm dev
```

### 4) Frontend

```bash
cd packages/frontend
cat > .env.local << EOF
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_OPENSEA_API_KEY=your_api_key
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
EOF
pnpm dev
```

### 5) Agents (optional)

```bash
cd packages/asi-agents
pip install -r requirements.txt
cp .env.example .env
python run_all_agents.py
# or deploy:
bash scripts/deploy_to_agentverse.sh
```

## 📝 Environment Variables

### Frontend (.env.local)

```env
VITE_WALLETCONNECT_PROJECT_ID=     # Required from cloud.walletconnect.com
VITE_OPENSEA_API_KEY=              # Optional from docs.opensea.io
VITE_GRAPHQL_ENDPOINT=             # Indexer GraphQL endpoint
```

### Indexer (config.yaml snippet)

```yaml
networks:
  - id: 31337
    contracts:
      - name: MarketFactory
        address: [YOUR_DEPLOYED_ADDRESS]
```

## 🚢 Deployment

### 1) Deploy smart contracts

```bash
cd packages/blockend
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2) Configure and run indexer

Update `packages/indexer/config.yaml` with the network, contract address, and RPC URL, then:

```bash
cd packages/indexer
pnpm codegen
TUI_OFF=true pnpm dev
```

### 3) Deploy frontend

```bash
cd packages/frontend
pnpm build
# Deploy dist/ to your host (e.g. Vercel, Netlify, S3+CloudFront)
```

## 🧪 Testing

```bash
# contracts
cd packages/blockend && npx hardhat test

# indexer
cd packages/indexer && pnpm test

# frontend
cd packages/frontend && pnpm lint
```

## 🔐 Security Considerations

- Uses OpenZeppelin libraries and standard patterns
- Time‑locked resolution prevents premature settlement
- Slippage protection guards against adverse pricing
- Immutable contracts by default; review before production upgrades
- Always audit before mainnet deployment

## 🐛 Known Issues

- OpenSea API rate‑limits apply; provide an API key for higher throughput
- Indexer requires Docker or a compatible runtime
- Local Hardhat network resets on restart; redeploy contracts if needed

## 🗺️ Roadmap

### Completed ✅
- Core prediction market contracts
- Real‑time blockchain indexer
- Modern React frontend
- AI‑powered market analysis (ASI Alliance)
- Automated market resolution (ASI agents)
- Portfolio management AI
- Multi‑source price oracles

### In Progress 🚧
- Deploy to mainnet
- Additional NFT marketplace integrations (Blur, LooksRare)
- Advanced MeTTa reasoning rules
- Social sentiment analysis agent

### Planned 📋
- Multi‑chain support (Polygon, Arbitrum, Solana)
- Additional market types (beyond binary price outcomes)
- Liquidity provider rewards
- Market analytics dashboard
- Mobile app
- Social features (comments, follows)
- Advanced charting
- Cross‑chain agent coordination

## 📚 Resources

### Project documentation
- `packages/asi-agents/README.md`
- `packages/asi-agents/QUICKSTART.md`
- `packages/indexer/README.md`
- `packages/frontend/README.md`
- `packages/blockend/README.md`

### External documentation
- Fetch.ai Innovation Lab: https://innovationlab.fetch.ai/resources/docs/intro
- MeTTa Language: https://metta-lang.dev/
- Agentverse: https://agentverse.ai/
- ASI:One: https://asi1.ai/
- Envio: https://docs.envio.dev/
- RainbowKit: https://www.rainbowkit.com/
- Wagmi: https://wagmi.sh/
- OpenSea API: https://docs.opensea.io/
- Hardhat: https://hardhat.org/

## 🤝 Contributing

Pull requests welcome. Please include tests and follow the package-specific READMEs.

## 📄 License

ISC

---

Built with ❤️ for the NFT and prediction market communities


