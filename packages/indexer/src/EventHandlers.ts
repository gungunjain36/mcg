import { MarketFactory, Market as MarketContract } from "generated";
import type { market as MarketEntity, User, Position, Trade, GlobalStats } from "generated";

// Initialize or get GlobalStats
async function getOrCreateGlobalStats(
  context: any
): Promise<GlobalStats> {
  const STATS_ID = "global";
  let stats = await context.GlobalStats.get(STATS_ID);

  if (!stats) {
    stats = {
      id: STATS_ID,
      totalMarkets: 0,
      totalTrades: 0,
      totalVolume: BigInt(0),
      totalUsers: 0,
      updatedAt: BigInt(0),
    };
  }

  return stats;
}

// Initialize or get User
async function getOrCreateUser(
  context: any,
  address: string,
  timestamp: bigint
): Promise<User> {
  let user = await context.User.get(address);

  if (!user) {
    user = {
      id: address,
      address: address,
      totalTrades: 0,
      totalVolume: BigInt(0),
      marketsCreated: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  return user;
}

// Initialize or get Position
async function getOrCreatePosition(
  context: any,
  marketAddress: string,
  userAddress: string,
  timestamp: bigint
): Promise<Position> {
  const positionId = `${marketAddress}-${userAddress}`;
  let position = await context.Position.get(positionId);

  if (!position) {
    position = {
      id: positionId,
      market_id: marketAddress,
      user_id: userAddress,
      yesShares: BigInt(0),
      noShares: BigInt(0),
      totalInvested: BigInt(0),
      realizedPnL: BigInt(0),
      updatedAt: timestamp,
    };
  }

  return position;
}

// Handler for MarketCreated event from MarketFactory
MarketFactory.MarketCreated.handler(async ({ event, context }) => {
  const marketAddress = event.params.marketAddress.toLowerCase();
  const creatorAddress = event.params.creator.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // TODO: Add dynamic contract registration for Market contracts
  // This will allow us to automatically track events from newly created markets
  // See: https://docs.envio.dev/docs/HyperIndex/contract-import

  // Create Market entity
  const marketEntity: MarketEntity = {
    id: marketAddress,
    marketAddress: marketAddress,
    creator: creatorAddress,
    resolver: creatorAddress, // Creator is resolver in the contract
    question: event.params.question,
    collectionSlug: event.params.collectionSlug,
    targetPrice: event.params.targetPrice,
    resolutionTimestamp: event.params.resolutionTimestamp,
    status: "Open",
    winningOutcome: undefined,
    finalPrice: undefined,
    yesSharesTotal: BigInt(0),
    noSharesTotal: BigInt(0),
    totalVolume: BigInt(0),
    totalTrades: 0,
    createdAt: timestamp,
    resolvedAt: undefined,
  };

  context.Market.set(marketEntity);

  // Update or create user
  const user = await getOrCreateUser(context, creatorAddress, timestamp);
  const updatedUser: User = {
    ...user,
    marketsCreated: user.marketsCreated + 1,
    updatedAt: timestamp,
  };
  context.User.set(updatedUser);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  const updatedStats: GlobalStats = {
    ...stats,
    totalMarkets: stats.totalMarkets + 1,
    totalUsers: user.totalTrades === 0 && user.marketsCreated === 0 ? stats.totalUsers + 1 : stats.totalUsers,
    updatedAt: timestamp,
  };
  context.GlobalStats.set(updatedStats);

  // Dynamic market tracking can be configured via contract registration API if needed
});

// Handler for Trade event from Market contract
MarketContract.Trade.handler(async ({ event, context }) => {
  const marketAddress = event.srcAddress.toLowerCase();
  const userAddress = event.params.user.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);
  const transactionHash = event.transaction.hash;

  // Get market entity
  const market = await context.Market.get(marketAddress);
  if (!market) {
    console.error(`Market not found: ${marketAddress}`);
    return;
  }

  const outcome = event.params.outcome;
  const shareAmount = event.params.shareAmount;
  const ethAmount = event.params.ethAmount;
  const isBuyTrade = event.params.isBuy; // Now directly from event params

  // Update totals by adding on buy and subtracting on sell
  const signedDelta = isBuyTrade ? shareAmount : -shareAmount;
  let newYesTotal = market.yesSharesTotal;
  let newNoTotal = market.noSharesTotal;

  if (outcome) {
    newYesTotal = market.yesSharesTotal + signedDelta;
  } else {
    newNoTotal = market.noSharesTotal + signedDelta;
  }
  
  // Create trade record
  const tradeId = `${transactionHash}-${event.logIndex}`;
  const trade: Trade = {
    id: tradeId,
    market_id: marketAddress,
    user_id: userAddress,
    outcome: outcome,
    isBuy: isBuyTrade,
    shareAmount: shareAmount,
    ethAmount: ethAmount,
    yesSharesTotal: newYesTotal,
    noSharesTotal: newNoTotal,
    timestamp: timestamp,
    blockNumber: BigInt(event.block.number),
    transactionHash: transactionHash,
  };
  context.Trade.set(trade);

  // Update market
  const updatedMarket: MarketEntity = {
    ...market,
    yesSharesTotal: newYesTotal,
    noSharesTotal: newNoTotal,
    totalVolume: market.totalVolume + ethAmount,
    totalTrades: market.totalTrades + 1,
  };
  context.Market.set(updatedMarket);

  // Update user
  const user = await getOrCreateUser(context, userAddress, timestamp);
  const updatedUser: User = {
    ...user,
    totalTrades: user.totalTrades + 1,
    totalVolume: user.totalVolume + ethAmount,
    updatedAt: timestamp,
  };
  context.User.set(updatedUser);

  // Update position
  const position = await getOrCreatePosition(context, marketAddress, userAddress, timestamp);
  const updatedPosition: Position = {
    ...position,
    yesShares: outcome ? position.yesShares + signedDelta : position.yesShares,
    noShares: !outcome ? position.noShares + signedDelta : position.noShares,
    totalInvested: isBuyTrade ? position.totalInvested + ethAmount : position.totalInvested,
    realizedPnL: isBuyTrade ? position.realizedPnL : position.realizedPnL + ethAmount,
    updatedAt: timestamp,
  };
  context.Position.set(updatedPosition);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  const isNewUser = user.totalTrades === 0;
  const updatedStats: GlobalStats = {
    ...stats,
    totalTrades: stats.totalTrades + 1,
    totalVolume: stats.totalVolume + ethAmount,
    totalUsers: isNewUser ? stats.totalUsers + 1 : stats.totalUsers,
    updatedAt: timestamp,
  };
  context.GlobalStats.set(updatedStats);
});

// Handler for MarketResolved event
MarketContract.MarketResolved.handler(async ({ event, context }) => {
  const marketAddress = event.srcAddress.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // Get market entity
  const market = await context.Market.get(marketAddress);
  if (!market) {
    console.error(`Market not found: ${marketAddress}`);
    return;
  }

  // Update market with resolution data
  const updatedMarket: MarketEntity = {
    ...market,
    status: "Resolved",
    winningOutcome: event.params.winningOutcome,
    finalPrice: event.params.finalReportedPrice,
    resolvedAt: timestamp,
  };
  context.Market.set(updatedMarket);
});

// Handler for SharesRedeemed event
MarketContract.SharesRedeemed.handler(async ({ event, context }) => {
  const marketAddress = event.srcAddress.toLowerCase();
  const userAddress = event.params.user.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // Get position
  const position = await getOrCreatePosition(context, marketAddress, userAddress, timestamp);
  
  // Update position with redeemed shares
  // The user has redeemed their winning shares, so we clear their shares and update realized P&L
  const updatedPosition: Position = {
    ...position,
    yesShares: BigInt(0),
    noShares: BigInt(0),
    realizedPnL: position.realizedPnL + event.params.ethReceived,
    updatedAt: timestamp,
  };
  context.Position.set(updatedPosition);

  // Update user
  const user = await getOrCreateUser(context, userAddress, timestamp);
  const updatedUser: User = {
    ...user,
    updatedAt: timestamp,
  };
  context.User.set(updatedUser);
});

// Handler for LiquidityProvided event (when market is created with initial liquidity)
MarketContract.LiquidityProvided.handler(async ({ event, context }) => {
  const marketAddress = event.srcAddress.toLowerCase();
  const providerAddress = event.params.provider.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);

  // Get or create position for the liquidity provider
  const position = await getOrCreatePosition(context, marketAddress, providerAddress, timestamp);

  // Update position with initial liquidity shares
  const updatedPosition: Position = {
    ...position,
    yesShares: position.yesShares + event.params.initialYesShares,
    noShares: position.noShares + event.params.initialNoShares,
    totalInvested: position.totalInvested + event.params.ethAmount,
    updatedAt: timestamp,
  };
  context.Position.set(updatedPosition);

  // Update user
  const user = await getOrCreateUser(context, providerAddress, timestamp);
  const updatedUser: User = {
    ...user,
    totalVolume: user.totalVolume + event.params.ethAmount,
    updatedAt: timestamp,
  };
  context.User.set(updatedUser);

  // Update market with initial liquidity
  const market = await context.Market.get(marketAddress);
  if (market) {
    const updatedMarket: MarketEntity = {
      ...market,
      yesSharesTotal: market.yesSharesTotal + event.params.initialYesShares,
      noSharesTotal: market.noSharesTotal + event.params.initialNoShares,
      totalVolume: market.totalVolume + event.params.ethAmount,
    };
    context.Market.set(updatedMarket);
  }

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  const updatedStats: GlobalStats = {
    ...stats,
    totalVolume: stats.totalVolume + event.params.ethAmount,
    updatedAt: timestamp,
  };
  context.GlobalStats.set(updatedStats);
});
