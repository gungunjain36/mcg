import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import type { Address } from 'viem';
import { formatEther } from 'viem';
import { MARKET_ABI } from '@/lib/contracts';

type MarketTotals = {
  [marketAddress: string]: {
    yes: number;
    no: number;
  };
};

export function useBatchMarketTotals(marketAddresses: string[]) {
  const publicClient = usePublicClient();
  const [totals, setTotals] = useState<MarketTotals>({});

  useEffect(() => {
    if (!publicClient || marketAddresses.length === 0) return;
    
    let cancelled = false;
    
    // Function to fetch totals
    const fetchTotals = async () => {
      try {
        // Create multicall for all markets
        const calls = marketAddresses.map((address) => ({
          address: address as Address,
          abi: MARKET_ABI,
          functionName: 'getMarketInfo' as const,
          args: [],
        }));

        const results = await publicClient.multicall({
          contracts: calls,
          allowFailure: true,
        });

        const newTotals: MarketTotals = {};
        
        results.forEach((result, index) => {
          if (result.result && !cancelled) {
            const marketAddress = marketAddresses[index];
            const data = result.result as readonly [
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
            
            const yes = Number(formatEther(data[6] as bigint));
            const no = Number(formatEther(data[7] as bigint));
            
            newTotals[marketAddress] = { yes, no };
          }
        });

        if (!cancelled) {
          setTotals(newTotals);
        }
      } catch (error) {
        console.error('Error fetching batch market totals:', error);
        if (!cancelled) {
          setTotals({});
        }
      }
    };

    // Initial fetch
    fetchTotals();
    
    // Set up interval for real-time updates (every 30 seconds)
    const interval = setInterval(fetchTotals, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicClient, marketAddresses.join(',')]);

  return totals;
}
