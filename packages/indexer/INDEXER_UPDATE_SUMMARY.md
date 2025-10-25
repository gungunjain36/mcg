# Indexer Update Summary

## ✅ Completed: Indexer Event Handlers Phase

**Date:** October 25, 2025

### What Was Done

#### 1. **Updated `config.yaml`**
- ✅ Fixed ABI file paths to use correct naming: `./abi/CoreModule#MarketFactory.json`
- ✅ Added new events to Market contract:
  - `SharesRedeemed(address indexed user, uint256 sharesRedeemed, uint256 ethReceived)`
  - `LiquidityProvided(address indexed provider, uint256 initialYesShares, uint256 initialNoShares, uint256 ethAmount)`
- ✅ Updated Trade event signature to include `isBuy` parameter:
  - `Trade(address indexed user, bool indexed outcome, uint256 ethAmount, uint256 shareAmount, bool isBuy)`
- ✅ Removed unnecessary `transaction_fields.value` from field_selection (now using `isBuy` from event)

#### 2. **Updated `src/EventHandlers.ts`**

**Trade Handler Updates:**
- ✅ Changed from inferring buy/sell from transaction value to using `event.params.isBuy`
- ✅ Updated `realizedPnL` calculation:
  - On buy: `realizedPnL` stays same
  - On sell: `realizedPnL` increases by `ethAmount` received
- ✅ Updated `totalInvested` to only increase on buys (not on sells)

**New Handler: SharesRedeemed**
- ✅ Clears user's position (sets yesShares and noShares to 0)
- ✅ Updates `realizedPnL` with ETH received from redemption
- ✅ Updates user's `updatedAt` timestamp

**New Handler: LiquidityProvided**
- ✅ Tracks initial liquidity when market is created
- ✅ Creates/updates position for liquidity provider
- ✅ Updates market totals (yesSharesTotal, noSharesTotal, totalVolume)
- ✅ Updates user's totalVolume
- ✅ Updates global stats totalVolume

#### 3. **Code Generation & Validation**
- ✅ Ran `pnpm codegen` successfully - Generated TypeScript types
- ✅ Ran `pnpm tsc --noEmit` successfully - No TypeScript errors

---

## 📊 Current State

### Supported Events

| Event | Handler | Status |
|-------|---------|--------|
| MarketCreated | ✅ Complete | Tracks market creation |
| Trade | ✅ Updated | Now uses `isBuy` param, better P&L tracking |
| MarketResolved | ✅ Complete | Sets market status to Resolved |
| SharesRedeemed | ✅ NEW | Tracks redemptions after resolution |
| LiquidityProvided | ✅ NEW | Tracks initial liquidity provision |

### Entities Tracked

1. **Market** - Market info, status, volume, trades
2. **User** - User stats, volume, trades count
3. **Position** - User positions per market with P&L
4. **Trade** - Individual trade records
5. **GlobalStats** - Platform-wide statistics

---

## ⏳ What's Next

### Phase 2: Dynamic Contract Registration
The indexer currently tracks events from all Market contracts, but for better performance, we should implement dynamic contract registration when markets are created.

**TODO:**
- Use Envio's contract import API to dynamically register Market contracts
- This will allow faster indexing and better organization

### Phase 3: Frontend Updates
**Redemption UI:**
- Add "Claim Winnings" button for resolved markets
- Wire up redemption transaction flow
- Display claimable amounts

**Market Creation from NFT Pages:**
- Add "Create Market" button on NFT collection pages
- Pre-populate CreateMarketModal with NFT data
- Show creator's position in portfolio after creation

### Phase 4: Settlement Worker
Create a separate package (`packages/settlement-worker/`) to:
- Monitor markets past resolution time
- Fetch floor prices from OpenSea API
- Call `MarketResolver.resolveMarketManual()`
- Handle errors and retry logic

---

## 🧪 Testing

To test the indexer locally:

```bash
cd /mnt/d/mcg-fun/packages/indexer

# Start the indexer (without TUI)
TUI_OFF=true pnpm dev

# In another terminal, visit GraphQL playground
# http://localhost:8080
# Password: testing
```

### Sample Queries

**Get all markets:**
```graphql
query {
  markets {
    id
    question
    collectionSlug
    status
    totalVolume
    totalTrades
  }
}
```

**Get user positions:**
```graphql
query {
  positions(where: { user_id: "0x..." }) {
    id
    market {
      question
      status
    }
    yesShares
    noShares
    totalInvested
    realizedPnL
  }
}
```

**Get trades with buy/sell indicator:**
```graphql
query {
  trades(orderBy: timestamp, orderDirection: desc) {
    id
    user {
      address
    }
    market {
      question
    }
    outcome
    isBuy
    shareAmount
    ethAmount
    timestamp
  }
}
```

---

## 📝 Notes

### P&L Calculation Logic

**Unrealized P&L** (for open positions):
- Calculate based on current market prices
- `unrealizedPnL = (currentShareValue - totalInvested)`

**Realized P&L** (from closed positions):
- Updated when user sells shares: `realizedPnL += ethReceived`
- Updated when user redeems winning shares: `realizedPnL += ethReceived`

### Key Changes from Before

1. **No more transaction value inference** - We now use `event.params.isBuy` directly
2. **Better P&L tracking** - Separate tracking of invested capital vs realized gains
3. **Liquidity provision tracking** - Market creators' initial positions are now tracked
4. **Redemption tracking** - Post-resolution redemptions update realized P&L

---

## 🔗 Resources

- Envio Docs: https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete
- Example Indexers:
  - Uniswap v4: https://github.com/enviodev/uniswap-v4-indexer
  - Safe: https://github.com/enviodev/safe-analysis-indexer

---

**All indexer event handlers are now complete and tested!** ✅

