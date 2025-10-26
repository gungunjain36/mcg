export const INDEXER_URL = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';

async function gqlReq<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(INDEXER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    console.error(`GraphQL error: ${res.status}`, await res.text());
    throw new Error(`GraphQL error: ${res.status}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

export type MarketEntity = {
  id: string;
  marketAddress: string;
  creator: string;
  question: string;
  collectionSlug: string;
  targetPrice: string;
  resolutionTimestamp: string;
  status: "Open" | "Resolved";
  winningOutcome?: boolean;
  finalPrice?: string;
  yesSharesTotal: string;
  noSharesTotal: string;
  totalVolume: string;
  totalTrades: number;
  createdAt: string;
  resolvedAt?: string;
};

export type GlobalStatsEntity = {
  id: string;
  totalMarkets: number;
  totalTrades: number;
  totalVolume: string;
  totalUsers: number;
  updatedAt: string;
};

export type TradeEntity = {
  id: string;
  market_id: string;
  user_id: string;
  outcome: boolean;
  isBuy: boolean;
  shareAmount: string;
  ethAmount: string;
  yesSharesTotal: string;
  noSharesTotal: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
};

export type PositionEntity = {
  id: string;
  market_id: string;
  user_id: string;
  yesShares: string;
  noShares: string;
  totalInvested: string;
  realizedPnL: string;
  updatedAt: string;
};

const queries = {
  globalStats: `
    query {
      GlobalStats(where: {id: {_eq: "global"}}) {
        id totalMarkets totalTrades totalVolume totalUsers updatedAt
      }
    }
  `,
  markets: `
    query ($limit: Int!, $offset: Int!, $orderBy: [Market_order_by!]) {
      Market(limit: $limit, offset: $offset, order_by: $orderBy) {
        id marketAddress creator question collectionSlug targetPrice resolutionTimestamp 
        status winningOutcome finalPrice yesSharesTotal noSharesTotal totalVolume 
        totalTrades createdAt resolvedAt
      }
    }
  `,
  marketById: `
    query ($id: String!) {
      Market(where: {id: {_eq: $id}}) {
        id marketAddress creator question collectionSlug targetPrice resolutionTimestamp 
        status winningOutcome finalPrice yesSharesTotal noSharesTotal totalVolume 
        totalTrades createdAt resolvedAt
      }
    }
  `,
  marketTrades: `
    query ($marketId: String!, $limit: Int!, $offset: Int!) {
      Trade(where: {market_id: {_eq: $marketId}}, limit: $limit, offset: $offset, order_by: {timestamp: desc}) {
        id market_id user_id outcome isBuy shareAmount ethAmount 
        yesSharesTotal noSharesTotal timestamp blockNumber transactionHash
      }
    }
  `,
  userPositions: `
    query ($userAddress: String!) {
      Position(where: {user_id: {_eq: $userAddress}}) {
        id market_id user_id yesShares noShares totalInvested realizedPnL updatedAt
      }
    }
  `,
  userTrades: `
    query ($userAddress: String!, $limit: Int!, $offset: Int!) {
      Trade(where: {user_id: {_eq: $userAddress}}, limit: $limit, offset: $offset, order_by: {timestamp: desc}) {
        id market_id user_id outcome isBuy shareAmount ethAmount 
        yesSharesTotal noSharesTotal timestamp blockNumber transactionHash
      }
    }
  `,
};

export const graph = {
  getGlobalStats: async () => {
    const result = await gqlReq<{ GlobalStats: GlobalStatsEntity[] }>(queries.globalStats);
    return { globalStats: result.GlobalStats[0] || null };
  },
  getMarkets: (limit = 30, offset = 0, orderBy = [{ createdAt: 'desc' }]) => 
    gqlReq<{ Market: MarketEntity[] }>(queries.markets, { limit, offset, orderBy }),
  getMarketById: async (id: string) => {
    const result = await gqlReq<{ Market: MarketEntity[] }>(queries.marketById, { id });
    return { market: result.Market[0] || null };
  },
  getMarketTrades: (marketId: string, limit = 50, offset = 0) =>
    gqlReq<{ Trade: TradeEntity[] }>(queries.marketTrades, { marketId, limit, offset }),
  getUserPositions: (userAddress: string) =>
    gqlReq<{ Position: PositionEntity[] }>(queries.userPositions, { userAddress: userAddress.toLowerCase() }),
  getUserTrades: (userAddress: string, limit = 50, offset = 0) =>
    gqlReq<{ Trade: TradeEntity[] }>(queries.userTrades, { userAddress: userAddress.toLowerCase(), limit, offset }),
};


