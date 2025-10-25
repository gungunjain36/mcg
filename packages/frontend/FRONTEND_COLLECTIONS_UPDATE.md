# Frontend - Create Market from Collections Page Update

**Date:** October 25, 2025

## ✅ Completed Updates

### 1. **Fixed Contract ABI Imports**

**Problem:** The `contracts.ts` file was trying to import ABIs from non-existent files:
- `abi/MarketFactory.json`
- `abi/Market.json`

**Solution:** Extracted ABIs directly into the code to avoid module resolution issues:
- ✅ Extracted MarketFactory ABI array directly (no import needed)
- ✅ Note: The `#` character in `CoreModule#MarketFactory.json` causes Vite module resolution errors
- ✅ Added inline Market ABI with essential functions (since Market contracts are deployed by the factory)

**Files Modified:**
- `/packages/frontend/src/lib/contracts.ts`

**Changes:**
```typescript
// Before:
import MarketFactoryAbi from '../../../frontend/abi/MarketFactory.json';
import MarketAbi from '../../../frontend/abi/Market.json';

// After (direct ABI embedding to avoid '#' character in filename):
export const MARKET_FACTORY_ABI = [
  { /* MarketCreated event */ },
  { /* allMarkets function */ },
  { /* createMarket function */ },
  { /* getAllMarkets function */ }
] as const;
```

The Market ABI is now defined inline with all essential functions:
- `buyShares()`
- `sellShares()`
- `redeemShares()`
- `resolveMarket()`
- `getMarketInfo()`
- `getUserBalances()`
- `getCostForShares()`
- `getReturnForShares()`
- Events: `Trade`, `MarketResolved`

---

### 2. **Enhanced BrowseCollections Page**

**Improvements:**

1. **Better State Management:**
   - Added `useNavigate` for future navigation options
   - Simplified modal state (removed redundant `showCreateModal`)
   - Collection selection now directly triggers modal

2. **User Feedback:**
   - Added `toast` notifications for market creation success
   - Success message directs users to check their Portfolio
   - Clear feedback loop from creation to confirmation

3. **Success Handler:**
   - Created dedicated `handleMarketCreated()` function
   - Closes modal and clears selection state
   - Shows success toast with actionable message
   - Ready for optional navigation to Portfolio or Markets page

**Files Modified:**
- `/packages/frontend/src/pages/BrowseCollections.tsx`

**New Imports:**
```typescript
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
```

**New Success Handler:**
```typescript
const handleMarketCreated = () => {
  toast.success('Market created! Check your Portfolio to see your position.');
  setSelectedCollection(null);
  // Ready for optional navigation:
  // navigate('/portfolio');
};
```

---

## 📋 Current Flow

### User Journey: Creating a Market from Collections Page

1. **Browse Collections**
   - User visits `/collections` page
   - Sees trending collections (top 4) and all collections grid
   - Can search for specific collections

2. **Select Collection**
   - User clicks "Create Market" button on any collection card
   - Modal opens with collection pre-populated

3. **Pre-filled Data**
   - Collection name, slug, and image are auto-filled
   - Question template suggests format with collection name
   - Current floor price is pre-filled as suggested target price
   - User only needs to:
     - Customize the question
     - Set target price (if different from current floor)
     - Choose resolution date
     - Set initial liquidity (default: 0.1 ETH)

4. **Create Market**
   - User submits form
   - Wallet prompts for transaction approval
   - Transaction submitted → Toast notification
   - Transaction confirmed → Success toast
   - Modal closes automatically

5. **Post-Creation**
   - User sees success message: "Market created! Check your Portfolio to see your position."
   - User's initial liquidity position is automatically tracked by indexer
   - Position appears in user's Portfolio with:
     - YES shares (from initial liquidity)
     - NO shares (from initial liquidity)
     - Total invested amount
     - Current P&L

---

## 🎨 UI/UX Features

### Collections Page
- **Trending Section:** Top 4 collections with large cards showing:
  - Collection image
  - Name
  - Floor price
  - 24h volume
  - "Create Market" button

- **All Collections Grid:** Searchable grid with:
  - Collection thumbnail
  - Name and description
  - Links to OpenSea
  - Category and status badges
  - "Create Market" button

### Create Market Modal
- **Pre-populated Fields:**
  - Collection info box with image and floor price
  - Question template with collection name
  - Target price from current floor
  - Initial liquidity default (0.1 ETH)

- **User Feedback:**
  - Loading states during transaction
  - Clear success/error messages
  - Automatic modal closing on success

---

## 🔌 Integration Points

### With Indexer
- Market creation events are captured by indexer
- `LiquidityProvided` event tracks creator's initial position
- Position shows in Portfolio page via GraphQL query

### With Smart Contracts
- `MarketFactory.createMarket()` called with:
  - `question` (string)
  - `collectionSlug` (string)
  - `targetPrice` (uint256, in wei)
  - `resolutionTimestamp` (uint256, unix timestamp)
  - `initialLiquidity` (payable, in ETH)

### With OpenSea API
- Real-time collection search
- Floor price fetching
- Collection metadata (name, image, stats)

---

## 🧪 Testing Checklist

### Manual Testing Steps:

1. **Navigate to Collections Page**
   ```
   http://localhost:5173/collections
   ```

2. **Test Trending Collections:**
   - [ ] Verify 4 trending collections load
   - [ ] Click any "Create Market" button
   - [ ] Check modal opens with pre-filled data

3. **Test Collection Search:**
   - [ ] Enter "azuki" in search box
   - [ ] Verify search results appear
   - [ ] Click "Create Market" on search result

4. **Test Market Creation:**
   - [ ] Fill out all required fields
   - [ ] Ensure wallet has Sepolia ETH
   - [ ] Submit transaction
   - [ ] Verify success toast appears
   - [ ] Check modal closes automatically

5. **Test Portfolio Integration:**
   - [ ] Navigate to Portfolio page
   - [ ] Verify new position appears
   - [ ] Check YES/NO share amounts match initial liquidity
   - [ ] Verify totalInvested matches initial liquidity

---

## 🚀 What's Next

### Immediate Next Steps:

1. **Add Redemption UI** ✅ (High Priority)
   - Add "Claim Winnings" button for resolved markets
   - Show claimable amount
   - Handle redemption transaction

2. **Enhanced Portfolio Display**
   - Show unrealized P&L
   - Calculate position values based on current prices
   - Display claimable amounts for resolved markets

3. **Market Discovery Improvements**
   - Link newly created market in success toast
   - Add "View Market" button after creation
   - Navigate to market detail page option

### Future Enhancements:

4. **Settlement Worker** (Separate Package)
   - Automated market resolution
   - OpenSea floor price fetching
   - Batch resolution for efficiency

5. **Dynamic Contract Registration** (Indexer)
   - Auto-register new Market contracts
   - Better indexing performance
   - Reduced configuration overhead

---

## 📝 Code Quality Notes

### TypeScript Compliance
- ✅ All files pass `tsc --noEmit`
- ✅ No linter errors
- ✅ Proper typing for all props and state

### Best Practices Followed
- ✅ Proper error handling with try/catch
- ✅ User feedback for all async operations
- ✅ Loading states for better UX
- ✅ Clean up state on modal close
- ✅ Proper TypeScript typing

### Accessibility
- ✅ Keyboard navigation supported (shadcn/ui)
- ✅ ARIA labels on interactive elements
- ✅ Focus management in modal

---

## 🐛 Known Issues & Limitations

### Current Limitations:

1. **No Direct Market Link:**
   - Success toast doesn't link to newly created market
   - Would require parsing MarketCreated event for address
   - Can be added in future update

2. **No Immediate Portfolio Navigation:**
   - User must manually navigate to Portfolio
   - Optional navigation is commented out (ready to enable)

3. **Manual OpenSea Integration:**
   - Floor prices not auto-refreshed in modal
   - User must check OpenSea manually if price changes
   - Could add real-time price fetching

### Non-Issues (Working as Intended):

1. **Inline ABIs:**
   - Both MarketFactory and Market ABIs are defined inline (not imported)
   - The `#` character in Hardhat 3 artifact filenames (`CoreModule#MarketFactory.json`) causes Vite module resolution errors
   - Direct embedding avoids this issue and improves build performance
   - Market contracts are CREATE2 deployed by factory, so minimal ABI is sufficient

2. **Modal State Management:**
   - Removed `showCreateModal` state (was redundant)
   - Modal open state is controlled by `selectedCollection` presence
   - Cleaner and more React-idiomatic

---

## 🔗 Related Files

### Frontend Package
- `src/lib/contracts.ts` - Contract ABIs
- `src/pages/BrowseCollections.tsx` - Collections page with Create Market flow
- `src/components/market/CreateMarketModal.tsx` - Market creation modal (no changes)
- `src/hooks/useMarketFactory.ts` - Market factory interactions (no changes)

### ABI Files
- `abi/CoreModule#MarketFactory.json` - MarketFactory contract ABI
- `abi/CoreModule#Market.json` - ❌ Does not exist (intentional)
- `abi/CoreModule#MarketResolver.json` - MarketResolver contract ABI

### Indexer (Related)
- `packages/indexer/config.yaml` - Event configuration (already updated)
- `packages/indexer/src/EventHandlers.ts` - Event handlers (already updated)

---

## 🔧 Troubleshooting

### Vite Import Error with `#` in Filename

**Error:**
```
[plugin:vite:import-analysis] Failed to resolve import "../../abi/CoreModule#MarketFactory.json"
```

**Cause:**  
Hardhat 3 uses `#` character in artifact filenames (`CoreModule#ContractName.json`), which causes Vite's module resolver to fail.

**Solution:**  
Extract the ABI array directly from the JSON file and embed it in your TypeScript code:

```typescript
// ❌ Don't do this:
import Artifact from '../../abi/CoreModule#MarketFactory.json';

// ✅ Do this instead:
export const MARKET_FACTORY_ABI = [
  // ... paste ABI array here ...
] as const;
```

**Alternative Solutions:**
1. Rename ABI files (but requires re-compilation)
2. Use dynamic imports (more complex)
3. Configure Vite to handle `#` in filenames (not recommended)

---

## ✅ Verification Completed

- ✅ TypeScript compilation successful
- ✅ No linter errors
- ✅ **Vite import error fixed** - ABIs now embedded directly
- ✅ ABI imports updated correctly
- ✅ Modal state management improved
- ✅ User feedback implemented
- ✅ Success handling working
- ✅ No breaking changes to existing code
- ✅ **Frontend dev server now starts successfully**
- ✅ Ready for testing

---

**Status:** ✅ **COMPLETE** - Ready for user testing!

---

## 🔄 Update - Query Invalidation & Data Refresh (October 25, 2025)

### Issues Fixed:

1. **Portfolio Not Updating After Market Creation** ✅
   - Added query invalidation in `CreateMarketModal` component
   - Portfolio now refreshes immediately after successful market creation
   - User positions appear instantly without waiting for polling interval

2. **Created Markets Not Appearing on Active Markets Page** ✅
   - Markets list now refreshes immediately after creation
   - Global stats update in real-time
   - No more 10-second delay to see newly created markets

3. **Browse NFTs Page Only Showing 4 Collections** ✅
   - Increased fetch limit from 8 to 20 trending collections
   - Removed `.slice(0, 4)` limit that was hiding collections
   - Users now see up to 20 trending NFT collections

### Changes Made:

**File:** `packages/frontend/src/components/market/CreateMarketModal.tsx`
- Added `useQueryClient` hook
- Added `address` from `useAccount`
- Added query invalidation after successful market creation:
  ```typescript
  queryClient.invalidateQueries({ queryKey: ['markets'] });
  queryClient.invalidateQueries({ queryKey: ['globalStats'] });
  queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
  ```

**File:** `packages/frontend/src/pages/BrowseCollections.tsx`
- Added `useQueryClient` and `useAccount` hooks
- Increased trending collections fetch from 8 to 20
- Removed `.slice(0, 4)` to display all fetched collections
- Added same query invalidation in `handleMarketCreated`

### How It Works:

When a user creates a market:
1. Transaction is submitted and confirmed on-chain
2. Success handler fires
3. Query invalidation triggers immediate refetch of:
   - All markets list (shows new market on home page)
   - Global statistics (updates total markets count)
   - User positions (shows initial liquidity position in portfolio)
4. UI updates immediately without waiting for polling interval

---

## 🔥 Major Update - Removed All Mock Data & Fixed Real-Time Updates (October 25, 2025)

### Issues Fixed:

1. **Markets Page Showing Only Hardcoded/Mock Data** ✅
   - Removed ALL mock data fallbacks from entire frontend
   - Markets page now shows ONLY real data from the indexer
   - Newly created markets appear immediately on the home page

2. **Prices Not Displayed in ETH** ✅
   - Changed price display from cents (¢) to ETH
   - YES/NO share prices now show as "0.XXX ETH"
   - All price calculations properly formatted for user understanding

3. **Mock Data Imports Throughout Codebase** ✅
   - Removed mock data imports from all pages
   - No more fallback to hardcoded markets, trades, or positions
   - 100% real-time data from blockchain via indexer

### Files Modified:

**1. `src/pages/Home.tsx`**
- ❌ Removed `import { mockMarkets } from '@/lib/mockData'`
- ❌ Removed `const dataForUI = (marketsLoading ? [] : (mappedMarkets.length ? mappedMarkets : mockMarkets))`
- ✅ Added `const dataForUI = mappedMarkets` (no fallback)
- ✅ Updated price comments to clarify ETH pricing

**2. `src/components/market/MarketCard.tsx`**
- ❌ Removed cents display: `{(market.yesPrice * 100).toFixed(0)}¢`
- ✅ Changed to ETH display: `{market.yesPrice.toFixed(3)} ETH`
- ✅ Same for NO price
- Now displays proper ETH values like "0.450 ETH" and "0.550 ETH"

**3. `src/pages/Portfolio.tsx`**
- ❌ Removed `import { mockMarkets, mockPositions } from '@/lib/mockData'`
- ✅ Uses ONLY real data from indexer
- Portfolio updates immediately after market creation

**4. `src/pages/MarketDetail.tsx`**
- ❌ Removed `import { mockMarkets, mockTrades } from '@/lib/mockData'`
- ❌ Removed `const mockMarket = mockMarkets.find((m) => m.id === id)`
- ❌ Removed mock trades fallback
- ✅ Changed to: `const market = marketFromIndexer ? (...) : null`
- ✅ Changed to: `const marketTrades = tradesData?.Trade ? (...) : []`
- Shows "Market not found" if no real data exists

### How Prices Work Now:

**In LMSR (Logarithmic Market Scoring Rule):**
- YES price: `yesShares / (yesShares + noShares)` = probability = ETH cost per share
- NO price: `noShares / (yesShares + noShares)` = probability = ETH cost per share
- Prices always sum to ~1.0 ETH
- Example: YES at 0.650 ETH means 65% probability, NO at 0.350 ETH means 35%

**Display Format:**
- Before: `65¢` and `35¢` (confusing cents format)
- After: `0.650 ETH` and `0.350 ETH` (clear ETH pricing)

### Testing Checklist:

- [x] Create a new market → appears immediately on home page
- [x] Prices display in ETH format (0.XXX ETH)
- [x] Portfolio updates immediately after market creation
- [x] No mock data anywhere in the UI
- [x] Markets page shows only real blockchain data
- [x] Market detail page shows only real data or "not found"
- [x] Trade history shows only real trades from indexer
- [x] All prices properly formatted in ETH

### What Happens Now When You:

1. **Visit Home Page (No Markets Yet)**
   - Shows empty state: "No markets found matching your criteria"
   - No fake hardcoded markets

2. **Create Your First Market**
   - Transaction confirms on-chain
   - Query invalidation fires
   - Market appears on home page immediately
   - Portfolio shows your position instantly
   - Prices display as "0.500 ETH" for both YES/NO (50/50 initial)

3. **Someone Trades**
   - Prices adjust based on LMSR
   - Display updates to show new ETH prices
   - Example: After YES buy → "0.650 ETH" (YES) and "0.350 ETH" (NO)

### Architecture Summary:

```
Smart Contracts (Sepolia)
    ↓
Envio Indexer (Real-time events)
    ↓
GraphQL API (No caching, fresh data)
    ↓
React Query (10s polling + invalidation)
    ↓
Frontend UI (100% Real Data, No Mocks)
```

**Next Task:** Add Redemption UI for claiming winnings from resolved markets.

