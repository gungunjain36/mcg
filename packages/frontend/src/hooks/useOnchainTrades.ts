import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { getMarketFactoryAddress } from '@/lib/wagmi';
import { MARKET_FACTORY_ABI, MARKET_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

export type OnchainTrade = {
  id: string;
  marketAddress: string;
  userAddress: string;
  outcome: boolean;
  isBuy: boolean;
  shareAmount: string;
  ethAmount: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
};

export function useOnchainTrades(userAddress?: string) {
  const publicClient = usePublicClient();
  const [trades, setTrades] = useState<OnchainTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || !publicClient) {
      setTrades([]);
      return;
    }

    let cancelled = false;

    async function fetchTrades() {
      if (!publicClient || !userAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        const chainId = publicClient.chain.id;
        const factoryAddress = getMarketFactoryAddress(chainId);

        if (!factoryAddress) {
          throw new Error(`No factory address for chain ${chainId}`);
        }

        // Step 1: Get all market addresses from factory
        console.log('📡 Fetching markets from factory...');
        const markets = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getAllMarkets',
        }) as `0x${string}`[];

        console.log(`✅ Found ${markets.length} markets`);

        if (cancelled) return;

        // Step 2: Fetch Trade events from all markets for this user
        const allTrades: OnchainTrade[] = [];

        // Get current block for range
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(10000); // Last ~10k blocks (adjust as needed)

        console.log(`🔍 Scanning blocks ${fromBlock} to ${currentBlock} for trades...`);

        // Fetch logs from all markets in parallel
        const logsPromises = markets.map(async (marketAddress) => {
          try {
            const logs = await publicClient.getLogs({
              address: marketAddress,
              event: {
                type: 'event',
                name: 'Trade',
                inputs: [
                  { type: 'address', indexed: true, name: 'user' },
                  { type: 'bool', indexed: true, name: 'outcome' },
                  { type: 'uint256', indexed: false, name: 'ethAmount' },
                  { type: 'uint256', indexed: false, name: 'shareAmount' },
                  { type: 'bool', indexed: false, name: 'isBuy' },
                ],
              },
              args: {
                user: userAddress as `0x${string}`,
              },
              fromBlock,
              toBlock: currentBlock,
            });

            return { marketAddress, logs };
          } catch (err) {
            console.warn(`Failed to fetch logs from market ${marketAddress}:`, err);
            return { marketAddress, logs: [] };
          }
        });

        const results = await Promise.all(logsPromises);

        if (cancelled) return;

        // Process all logs
        for (const { marketAddress, logs } of results) {
          for (const log of logs) {
            if (!log.args) continue;

            const { user, outcome, ethAmount, shareAmount, isBuy } = log.args;

            // Get block details for timestamp
            let timestamp = Date.now() / 1000;
            try {
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              timestamp = Number(block.timestamp);
            } catch (err) {
              console.warn('Failed to get block timestamp:', err);
            }

            if (cancelled) return;

            allTrades.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              marketAddress: marketAddress.toLowerCase(),
              userAddress: (user as string).toLowerCase(),
              outcome: outcome as boolean,
              isBuy: isBuy as boolean,
              shareAmount: (shareAmount as bigint).toString(),
              ethAmount: (ethAmount as bigint).toString(),
              timestamp,
              blockNumber: Number(log.blockNumber),
              transactionHash: log.transactionHash,
              logIndex: Number(log.logIndex),
            });
          }
        }

        // Sort by timestamp descending (newest first)
        allTrades.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`✅ Found ${allTrades.length} trades for user ${userAddress.slice(0, 6)}...`);

        if (!cancelled) {
          setTrades(allTrades);
        }
      } catch (err) {
        console.error('Error fetching on-chain trades:', err);
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTrades();

    return () => {
      cancelled = true;
    };
  }, [userAddress, publicClient]);

  return { trades, isLoading, error };
}

