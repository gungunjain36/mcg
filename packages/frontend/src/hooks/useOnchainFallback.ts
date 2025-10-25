import { useEffect, useMemo, useState } from 'react';
import { usePublicClient, useAccount, useChainId } from 'wagmi';
import type { Address } from 'viem';
import { formatEther } from 'viem';
import { MARKET_ABI } from '@/lib/contracts';
import { getMarketFactoryAddress } from '@/lib/wagmi';

type RecentTrade = {
  id: string;
  marketId: string;
  trader: string;
  outcome: 'YES' | 'NO';
  type: 'BUY' | 'SELL';
  amount: number; // ETH
  price: number;  // ETH per share
  timestamp: string;
};

export function useOnchainMarketTotals(marketAddress?: string) {
  const publicClient = usePublicClient();
  const [totals, setTotals] = useState<{ yes: number; no: number } | null>(null);

  useEffect(() => {
    if (!publicClient || !marketAddress) return;
    let cancelled = false;
    (async () => {
      try {
        // getMarketInfo returns a tuple with yesSharesTotal and noSharesTotal
        const result: any = await publicClient.readContract({
          address: marketAddress as Address,
          abi: MARKET_ABI,
          functionName: 'getMarketInfo',
          args: [],
        });
        // [question, collectionSlug, targetPrice, resolutionTimestamp, status, winningOutcome, yesSharesTotal, noSharesTotal, spotPriceYes, spotPriceNo]
        const yes = Number(formatEther(result[6] as bigint));
        const no = Number(formatEther(result[7] as bigint));
        if (!cancelled) setTotals({ yes, no });
      } catch {
        // ignore fallback errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicClient, marketAddress]);

  return totals;
}

export function useRecentTradesOnchain(marketAddress?: string, limit = 50) {
  const publicClient = usePublicClient();
  const [trades, setTrades] = useState<RecentTrade[]>([]);

  const tradeEvent = useMemo(() => {
    // Extract the Trade event from ABI
    return MARKET_ABI.find((i) => (i as any).type === 'event' && (i as any).name === 'Trade') as any;
  }, []);

  useEffect(() => {
    if (!publicClient || !marketAddress || !tradeEvent) return;
    let cancelled = false;
    (async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const from = latest > 50000n ? latest - 50000n : 0n;
        const logs = await publicClient.getLogs({
          address: marketAddress as Address,
          event: tradeEvent,
          fromBlock: from,
          toBlock: latest,
        });
        const mapped: RecentTrade[] = logs
          .map((l) => {
            const args: any = l.args as any;
            const ethAmount = Number(formatEther(args.ethAmount as bigint));
            const shares = Number(formatEther(args.shareAmount as bigint));
            const unitPrice = shares > 0 ? ethAmount / shares : 0;
            return {
              id: `${l.transactionHash}-${l.logIndex}`,
              marketId: (marketAddress as string),
              trader: (args.user as string).toLowerCase(),
              outcome: (args.outcome as boolean) ? 'YES' : 'NO',
              type: (args.isBuy as boolean) ? 'BUY' : 'SELL',
              amount: ethAmount,
              price: unitPrice,
              timestamp: new Date(Number(l.blockTimestamp ?? 0n) * 1000).toISOString(),
            } as RecentTrade;
          })
          .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
          .slice(0, limit);
        if (!cancelled) setTrades(mapped);
      } catch {
        if (!cancelled) setTrades([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicClient, marketAddress, tradeEvent, limit]);

  return trades;
}

export function useOnchainPortfolioFallback(userAddress?: string) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [items, setItems] = useState<{
    marketAddress: string;
    question: string;
    collectionSlug: string;
    yesShares: number;
    noShares: number;
    yesPrice: number;
    noPrice: number;
    resolved: boolean;
  }[]>([]);

  useEffect(() => {
    if (!publicClient || !userAddress) return;
    let cancelled = false;
    (async () => {
      try {
        const factory = getMarketFactoryAddress(chainId);
        if (!factory) {
          if (!cancelled) setItems([]);
          return;
        }
        // Read all markets from factory
        const marketAddresses = (await publicClient.readContract({
          address: factory as Address,
          abi: [
            {
              inputs: [],
              name: 'getAllMarkets',
              outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
              stateMutability: 'view',
              type: 'function',
            },
          ] as const,
          functionName: 'getAllMarkets',
        })) as Address[];

        if (!marketAddresses?.length) {
          if (!cancelled) setItems([]);
          return;
        }

        // Prepare multicall: balances and market info per market
        const balanceCalls = marketAddresses.map((m) => ({
          address: m,
          abi: MARKET_ABI,
          functionName: 'getUserBalances' as const,
          args: [userAddress as Address],
        }));
        const infoCalls = marketAddresses.map((m) => ({
          address: m,
          abi: MARKET_ABI,
          functionName: 'getMarketInfo' as const,
          args: [],
        }));

        const [balancesRes, infoRes] = await Promise.all([
          publicClient.multicall({ contracts: balanceCalls, allowFailure: true }),
          publicClient.multicall({ contracts: infoCalls, allowFailure: true }),
        ]);

        const results: {
          marketAddress: string;
          question: string;
          collectionSlug: string;
          yesShares: number;
          noShares: number;
          yesPrice: number;
          noPrice: number;
          resolved: boolean;
        }[] = [];

        for (let i = 0; i < marketAddresses.length; i++) {
          const mAddr = marketAddresses[i] as string;
          const balEntry = balancesRes[i];
          const infoEntry = infoRes[i];
          if (!balEntry?.result || !infoEntry?.result) continue;

          const [yesUserRaw, noUserRaw] = infoEntry ? (balEntry.result as readonly [bigint, bigint]) : [0n, 0n];
          const info = infoEntry.result as readonly [
            string,
            string,
            bigint,
            bigint,
            number | bigint,
            boolean,
            bigint,
            bigint,
            bigint,
            bigint
          ];
          const question = info[0] as string;
          const collectionSlug = info[1] as string;
          const statusRaw = info[4] as number | bigint;
          const yesTotalRaw = info[6] as bigint;
          const noTotalRaw = info[7] as bigint;

          const yesUser = Number(formatEther(yesUserRaw as bigint));
          const noUser = Number(formatEther(noUserRaw as bigint));
          if (yesUser <= 0 && noUser <= 0) continue;

          const yesTotal = Number(formatEther(yesTotalRaw));
          const noTotal = Number(formatEther(noTotalRaw));
          const total = yesTotal + noTotal;
          const yesPrice = total > 0 ? yesTotal / total : 0.5;
          const noPrice = total > 0 ? noTotal / total : 0.5;

          results.push({
            marketAddress: mAddr,
            question,
            collectionSlug,
            yesShares: yesUser,
            noShares: noUser,
            yesPrice,
            noPrice,
            resolved: Number(statusRaw) === 1,
          });
        }

        if (!cancelled) setItems(results);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicClient, userAddress, chainId]);

  return items;
}


