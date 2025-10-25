# Blockend (Hardhat 3 + Ignition + Chainlink Functions)

This package contains the smart contracts and deployment scripts for the NFT prediction markets backend. It uses Hardhat 3, Ignition for deployments, and Chainlink Functions to fetch OpenSea floor prices on-demand (no cron).

References:
- Hardhat 3 Getting Started: https://hardhat.org/docs/getting-started
- Chainlink Functions (Sepolia router/DON): https://docs.chain.link/chainlink-functions/getting-started

## Prerequisites

- Node.js v20, pnpm
- Funded Sepolia wallet (ETH + LINK)
- Optional: OpenSea API key (recommended to avoid rate limits)

Environment variables (examples):
- `SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<KEY>`
- `PRIVATE_KEY=0x...` (deployer EOA, 0x-prefixed)
- Frontend: `VITE_WALLETCONNECT_PROJECT_ID=...`

## Deployed Contracts (Sepolia)

Current deployment addresses:
- `MarketFactory`: `0xb5f2500b9613F738bA743e78eb9bD1a4eb698C59`
- `NftFloorOracle`: `0x76f1AC8e32cF473E568Cb0Cc36eB410C3713ABeB`
- `FunctionsNftPriceConsumer`: `0x1cFFE81F359A30679FfF3FaDEB778a98b3355F3f`
- `MarketResolver`: `0x538119Fa5940cDE268f1cF33238f98FfaA62e67A`


## Contracts

- `NftFloorOracle.sol`: On-chain store for collection floor prices with freshness and `REPORTER_ROLE`.
- `FunctionsNftPriceConsumer.sol`: Chainlink Functions consumer that calls OpenSea v2 collections stats API and writes to `NftFloorOracle`.
- `MarketResolver.sol`: Supports `resolveMarketWithOracle(market)` using the oracle's latest price.
- `MarketFactory.sol` / `Market.sol`: Market creation and lifecycle.

## Deploy (Ignition)

Ignition module: `ignition/modules/DeployCore.ts` (module id: `CoreModuleV2`). It deploys and wires:
- `NftFloorOracle`
- `FunctionsNftPriceConsumer(router, donId, oracle)` and grants it `REPORTER_ROLE`
- `MarketResolver(oracle)`
- `MarketFactory`

Sepolia defaults are embedded; you can override with a params file.

Deploy using defaults:
