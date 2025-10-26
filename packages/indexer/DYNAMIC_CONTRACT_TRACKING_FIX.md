# 🔧 Fix for Portfolio Not Showing Trades

## 🚨 The Problem

**Your trades ARE happening on-chain, but the indexer isn't capturing them!**

### Root Cause:
When you create a market, the `MarketFactory` deploys a new `Market` contract at a unique address. Your trades (buying YES/NO shares) emit `Trade` events from these Market contracts.

**The indexer is listening for these Trade events, BUT**:
- It only listens to Market contracts that are registered in `config.yaml`
- New Market contracts created dynamically are **NOT** automatically registered
- Therefore, trades from new markets are **NEVER** indexed
- Portfolio page has no data to show

## ✅ The Solution

You have 3 options to fix this:

---

### Option 1: Manual Market Registration (Quick Fix)

**Add market addresses to `config.yaml` as you create them:**

1. **Find your Market contract address** from the transaction when you created the market
2. **Add it to `config.yaml`** under the Base Sepolia network:

```yaml
networks:
  - id: 84532  # Base Sepolia
    start_block: 0
    hypersync_config:
      url: https://base-sepolia.hypersync.xyz
    contracts:
      - name: MarketFactory
        address:
          - 0x25A57013bc5139E3FCb06189592652Cd146aecA5
      - name: Market
        address:
          # Add your market contract addresses here:
          - 0xYourMarketAddress1  # Replace with actual address
          - 0xYourMarketAddress2  # Add more as needed
```

3. **Restart the indexer:**
```bash
cd packages/indexer
pnpm dev
```

4. **Wait for re-indexing** - it will scan from start_block and pick up all past trades

---

### Option 2: Script to Auto-Add Markets (Recommended)

Create a script that queries the MarketFactory for all created markets and updates config.yaml:

```typescript
// scripts/update-markets.ts
import { ethers } from 'ethers';
import fs from 'fs';
import yaml from 'yaml';

const FACTORY_ADDRESS = '0x25A57013bc5139E3FCb06189592652Cd146aecA5';
const RPC_URL = 'https://sepolia.base.org';  // Base Sepolia RPC

async function getAllMarkets() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(
    FACTORY_ADDRESS,
    ['function getAllMarkets() view returns (address[])'],
    provider
  );
  
  const markets = await factory.getAllMarkets();
  return markets;
}

async function updateConfig() {
  const markets = await getAllMarkets();
  const configPath = './packages/indexer/config.yaml';
  const config = yaml.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Find Base Sepolia network
  const baseSepoliaNetwork = config.networks.find((n: any) => n.id === 84532);
  const marketContract = baseSepoliaNetwork.contracts.find((c: any) => c.name === 'Market');
  
  // Update market addresses
  marketContract.address = markets.map((addr: string) => addr.toLowerCase());
  
  // Write back to config
  fs.writeFileSync(configPath, yaml.stringify(config));
  console.log(`✅ Updated config with ${markets.length} market addresses`);
}

updateConfig().catch(console.error);
```

**Run before starting indexer:**
```bash
pnpm tsx scripts/update-markets.ts
cd packages/indexer && pnpm dev
```

---

### Option 3: Query MarketCreated Events (Alternative)

Instead of calling `getAllMarkets()`, scan for `MarketCreated` events:

```typescript
// Get all MarketCreated events
const filter = factory.filters.MarketCreated();
const events = await factory.queryFilter(filter, 0, 'latest');
const marketAddresses = events.map(e => e.args.marketAddress.toLowerCase());

// Update config with these addresses
```

---

## 🔍 How to Find Your Market Addresses

### Method 1: From Transaction
1. Go to your market creation transaction on Base Sepolia Etherscan
2. Look for the `MarketCreated` event
3. Copy the `marketAddress` parameter

### Method 2: From MarketFactory Contract
1. Go to Base Sepolia Etherscan
2. Navigate to MarketFactory: `0x25A57013bc5139E3FCb06189592652Cd146aecA5`
3. Read Contract → `getAllMarkets()` 
4. Copy all addresses

### Method 3: From GraphQL (if any markets were indexed)
```graphql
query {
  Market {
    marketAddress
  }
}
```

---

## 📋 Step-by-Step Fix Process

1. **Stop the indexer** (if running)
```bash
# Stop with Ctrl+C or:
pkill -f "pnpm.*dev"
```

2. **Get all market addresses** (choose one method above)

3. **Update `config.yaml`**
```bash
cd packages/indexer
# Edit config.yaml manually or use script
```

4. **Run codegen** (if config changed)
```bash
pnpm codegen
```

5. **Restart indexer**
```bash
TUI_OFF=true pnpm dev
```

6. **Wait for indexing to complete**
- Watch the logs for "Syncing..." messages
- Once it says "Up to date", your data is ready

7. **Refresh Portfolio page**
- Clear browser cache if needed
- Your trades and positions should now appear!

---

## 🧪 Verify It's Working

### Check Indexer Logs:
```bash
cd packages/indexer
pnpm dev
```

Look for:
```
✓ Registered Market contract at 0x...
✓ Processing Trade event from 0x...
✓ Updated Position for user 0x...
```

### Check GraphQL:
```bash
curl -X POST http://localhost:8080/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Trade(limit: 10) { id user_id market_id outcome shareAmount } }"}'
```

You should see your trades!

### Check Frontend:
1. Open Portfolio page
2. Check browser console for "Portfolio Debug:" logs
3. You should see:
   - `positionsCount: N` (where N > 0)
   - `tradesCount: M` (where M > 0)

---

## 🔮 Future: Automatic Dynamic Tracking

The ideal solution is to use Envio's dynamic contract registration API, which would automatically track new Market contracts as they're created.

**This requires:**
1. Upgrading to Envio v2.30+ (or checking if API is available)
2. Implementing in `MarketCreated` handler:
```typescript
MarketFactory.MarketCreated.handler(async ({ event, context }) => {
  const marketAddress = event.params.marketAddress.toLowerCase();
  
  // Dynamically register new Market contract
  if (!context.isPreload) {
    context.contractRegistration.addContracts("Market", event.chainId, [marketAddress]);
  }
  
  // ... rest of handler
});
```

**Current Status:** API not available in current Envio version or requires different syntax

---

## 📝 Quick Reference

### Current Issue:
- ✅ Trades execute on-chain
- ❌ Indexer doesn't listen to new Market contracts
- ❌ No trades/positions indexed
- ❌ Portfolio shows empty

### After Fix:
- ✅ Market addresses added to config
- ✅ Indexer listens to all markets
- ✅ Trades are indexed in real-time
- ✅ Portfolio displays correctly

---

## 🆘 Still Not Working?

### Check:
1. **Indexer is running:** `ps aux | grep pnpm`
2. **GraphQL endpoint:** `curl http://localhost:8080/v1/graphql`
3. **Market addresses in config:** Check `config.yaml`
4. **Indexer logs:** Look for errors
5. **Frontend GraphQL URL:** Check `.env.local` has correct endpoint

### Debug Commands:
```bash
# Check if indexer is synced
curl http://localhost:8080/v1/graphql -d '{"query": "{ GlobalStats { totalTrades } }"}'

# Check your positions
curl http://localhost:8080/v1/graphql -d '{"query": "{ Position(where: {user_id: {_eq: \"YOUR_ADDRESS\"}}) { yesShares noShares } }"}'

# Check your trades
curl http://localhost:8080/v1/graphql -d '{"query": "{ Trade(where: {user_id: {_eq: \"YOUR_ADDRESS\"}}) { id outcome shareAmount } }"}'
```

---

## 💡 Pro Tip

Create a simple script that runs before starting your dev environment:

```json
// package.json in root
{
  "scripts": {
    "dev:indexer": "cd packages/indexer && pnpm tsx scripts/update-markets.ts && pnpm dev",
    "dev:frontend": "cd packages/frontend && pnpm dev",
    "dev": "concurrently \"pnpm:dev:indexer\" \"pnpm:dev:frontend\""
  }
}
```

This ensures market addresses are always up-to-date!

---

**Status:** ⚠️ **Manual configuration required** until dynamic contract tracking is implemented

**Priority:** 🔴 **CRITICAL** - Without this, portfolio and trade history will never work

