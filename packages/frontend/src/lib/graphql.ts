export const INDEXER_URL = import.meta.env.VITE_INDEXER_URL as string;

async function gqlReq<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(INDEXER_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-password": "testing" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

export type MarketEntity = {
  id: string;
  question: string;
  collectionSlug: string;
  targetPrice: string;
  status: "Open" | "Resolved";
  yesSharesTotal: string;
  noSharesTotal: string;
  totalVolume: string;
  createdAt: string;
};

export type GlobalStatsEntity = {
  id: string;
  totalMarkets: number;
  totalTrades: number;
  totalVolume: string;
  totalUsers: number;
  updatedAt: string;
};

const queries = {
  globalStats: `
    query {
      globalStats: globalStatsById(id: "global") {
        id totalMarkets totalTrades totalVolume totalUsers updatedAt
      }
    }
  `,
  markets: `
    query ($first: Int!, $skip: Int!) {
      markets(first: $first, skip: $skip) {
        id question collectionSlug targetPrice status yesSharesTotal noSharesTotal totalVolume createdAt
      }
    }
  `,
};

export const graph = {
  getGlobalStats: () => gqlReq<{ globalStats: GlobalStatsEntity | null }>(queries.globalStats),
  getMarkets: (first = 30, skip = 0) => gqlReq<{ markets: MarketEntity[] }>(queries.markets, { first, skip }),
};


