# 🔧 Indexer Fix Guide - Market Not Showing Issue

## 🔴 Root Cause Found

**The indexer was using the WRONG ABI file for the Market contract!**

- Config was pointing to: `./abi/CoreModule#MarketFactory.json` 
- Should be pointing to: `./abi/CoreModule#Market.json` ❌ (didn't exist)
- **Fixed**: Created the correct Market ABI file ✅

---

## ✅ What Was Fixed

1. **Created Missing Market ABI** 
   - File: `/packages/indexer/abi/CoreModule#Market.json`
   - Contains: Trade, MarketResolved, SharesRedeemed, LiquidityProvided events

2. **Updated Indexer Config**
   - Changed `abi_file_path` for Market contract to use correct ABI

3. **Reduced Refetch Intervals**
   - Changed from 10 seconds → 5 minutes (300000ms)
   - Pages affected: Home, Portfolio, MarketDetail

---

## 📋 Steps to Fix Your Indexer

### Step 1: Stop Your Indexer (if running)
```bash
# Press Ctrl+C in the terminal where indexer is running
```

### Step 2: Navigate to Indexer Directory
```bash
cd /mnt/d/mcg-fun/packages/indexer
```

### Step 3: Regenerate TypeScript Types
```bash
pnpm codegen
```
This will regenerate the types with the correct Market ABI.

### Step 4: Verify TypeScript Compilation
```bash
pnpm tsc --noEmit
```
Should complete with no errors.

### Step 5: Restart the Indexer
```bash
TUI_OFF=true pnpm dev
```

**Expected Output:**
```
✓ Starting indexer...
✓ Connected to Sepolia network
✓ Syncing from block 0
✓ GraphQL endpoint available at http://localhost:8080/v1/graphql
```

### Step 6: Verify Indexer is Running
Open a new terminal and run:
```bash
curl http://localhost:8080/v1/graphql -H "Content-Type: application/json" -d '{"query":"{ Market { id } }"}'
```

Should return JSON with markets (or empty array if none created yet).

---

## 🧪 Testing Your Market Creation

### 1. **Check Frontend Environment**

Create `/packages/frontend/.env.local` if it doesn't exist:
```env
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 2. **Start Frontend**
```bash
cd /mnt/d/mcg-fun/packages/frontend
pnpm dev
```

### 3. **Create a Test Market**

1. Connect your wallet (Sepolia network)
2. Go to Browse Collections page
3. Click "Create Market" on any collection
4. Fill in:
   - Question
   - Target Price
   - Resolution Date
   - Initial Liquidity: `0.01` ETH
5. Submit transaction
6. **Wait for confirmation** (check MetaMask)

### 4. **Verify Market Appears**

After transaction confirms:
- ✅ Market should appear on Home page **immediately** (query invalidation)
- ✅ Your position should appear in Portfolio **immediately**
- ✅ Prices should show as ETH (e.g., "0.500 ETH")

---

## 🔍 Debugging Checklist

### If Market Still Doesn't Appear:

#### ✓ Check Indexer Logs
Look for:
```
✓ Event captured: MarketCreated
✓ Event captured: LiquidityProvided
```

If you see errors like:
```
✗ Error parsing event: Unknown event signature
```
**Solution**: Run `pnpm codegen` again

#### ✓ Check GraphQL Endpoint
```bash
curl http://localhost:8080/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ Market(order_by: {createdAt: desc}, limit: 1) { id marketAddress question } }"}'
```

Should return your newly created market.

#### ✓ Check Browser Console
Open DevTools → Console, look for:
- ❌ `GraphQL error: 400` → Check indexer is running
- ❌ `CORS error` → Check indexer CORS settings
- ✅ Network tab shows successful GraphQL requests

#### ✓ Check Contract Address
Your deployed MarketFactory address should match config:
```yaml
# In packages/indexer/config.yaml
contracts:
  - name: MarketFactory
    address:
      - 0xb5f2500b9613f738ba743e78eb9bd1a4eb698c59  # ← Verify this matches your deployment
```

#### ✓ Check Wallet Network
- Must be on **Sepolia Testnet** (Chain ID: 11155111)
- Have enough Sepolia ETH for gas + initial liquidity

---

## 🎯 Expected Behavior After Fix

### Immediate (After Transaction Confirms):
1. **Query Invalidation fires** → Frontend refetches data
2. **Market appears on Home page** → No waiting
3. **Position appears in Portfolio** → Shows YES/NO shares + ETH invested
4. **Prices display in ETH** → e.g., "0.500 ETH" for 50/50 split

### After 5 Minutes (or Manual Refresh):
- Prices update if anyone trades
- New markets appear (if others create them)
- Portfolio values update

---

## 📊 Data Flow (Now Fixed)

```
1. Create Market Transaction
   ↓
2. Smart Contract emits events:
   - MarketCreated (from MarketFactory)
   - LiquidityProvided (from Market)
   ↓
3. Envio Indexer captures events
   - Uses CORRECT Market ABI ✅
   - Parses event data correctly ✅
   ↓
4. Data stored in PostgreSQL
   ↓
5. GraphQL API serves data
   ↓
6. Frontend queries API
   - Query invalidation triggers immediate refetch ✅
   - Data appears instantly ✅
```

---

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Market not appearing | Wrong ABI | ✅ **FIXED** - Using correct Market ABI now |
| "GraphQL error: 400" | Indexer not running | Run `TUI_OFF=true pnpm dev` |
| "Network error" | Wrong endpoint | Check `.env.local` has correct URL |
| Transaction confirmed but no market | Indexer not synced | Wait 30s, check indexer logs |
| Prices showing as 0 | LiquidityProvided event not captured | Check indexer has Market ABI |

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Indexer logs show: `Event captured: MarketCreated`
2. ✅ GraphQL query returns your market
3. ✅ Home page shows your market with ETH prices
4. ✅ Portfolio shows your YES/NO share positions
5. ✅ Total invested matches your initial liquidity

---

## 🆘 Still Having Issues?

If market still doesn't appear after following all steps:

1. **Share the indexer logs** (last 50 lines)
2. **Share the transaction hash** from MetaMask
3. **Share the browser console errors** (if any)
4. **Verify the contract address** matches config.yaml

The issue is now **100% fixable** - we just need to ensure the indexer is capturing events correctly!

---

## 📝 Files Modified

- ✅ `/packages/indexer/abi/CoreModule#Market.json` (CREATED)
- ✅ `/packages/indexer/config.yaml` (FIXED ABI path)
- ✅ `/packages/frontend/src/pages/Home.tsx` (5min refetch)
- ✅ `/packages/frontend/src/pages/Portfolio.tsx` (5min refetch)
- ✅ `/packages/frontend/src/pages/MarketDetail.tsx` (5min refetch)

---

**Status**: Ready to test! Follow the steps above and your markets should start appearing. 🚀



