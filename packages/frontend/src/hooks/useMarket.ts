import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { MARKET_ABI } from '@/lib/contracts';

/**
 * Hook to get market details
 */
export function useMarketDetails(marketAddress: string | undefined) {
  const { data: question } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'question',
    query: { enabled: !!marketAddress },
  });

  const { data: collectionSlug } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'collectionSlug',
    query: { enabled: !!marketAddress },
  });

  const { data: targetPrice } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'targetPrice',
    query: { enabled: !!marketAddress },
  });

  const { data: resolutionTimestamp } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'resolutionTimestamp',
    query: { enabled: !!marketAddress },
  });

  const { data: status } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'status',
    query: { enabled: !!marketAddress },
  });

  const { data: yesSharesTotal } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'yesSharesTotal',
    query: { enabled: !!marketAddress },
  });

  const { data: noSharesTotal } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'noSharesTotal',
    query: { enabled: !!marketAddress },
  });

  const { data: creator } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'creator',
    query: { enabled: !!marketAddress },
  });

  const { data: resolver } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'resolver',
    query: { enabled: !!marketAddress },
  });

  return {
    question: question as string | undefined,
    collectionSlug: collectionSlug as string | undefined,
    targetPrice: targetPrice ? formatEther(targetPrice as bigint) : undefined,
    resolutionTimestamp: resolutionTimestamp
      ? Number(resolutionTimestamp as bigint)
      : undefined,
    status: status as number | undefined,
    yesSharesTotal: yesSharesTotal ? formatEther(yesSharesTotal as bigint) : undefined,
    noSharesTotal: noSharesTotal ? formatEther(noSharesTotal as bigint) : undefined,
    creator: creator as string | undefined,
    resolver: resolver as string | undefined,
  };
}

/**
 * Hook to get spot price for YES or NO shares
 */
export function useGetSpotPrice(marketAddress: string | undefined, outcome: boolean) {
  const { data } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'getSpotPrice',
    args: [outcome],
    query: { enabled: !!marketAddress },
  });

  return data ? formatEther(data as bigint) : undefined;
}

/**
 * Hook to get cost for buying shares
 */
export function useGetCostForShares(
  marketAddress: string | undefined,
  outcome: boolean,
  shares: string
) {
  const { data } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'getCostForShares',
    args: [outcome, parseEther(shares || '0')],
    query: { enabled: !!marketAddress && !!shares },
  });

  return data ? formatEther(data as bigint) : undefined;
}

/**
 * Hook to get return for selling shares
 */
export function useGetReturnForShares(
  marketAddress: string | undefined,
  outcome: boolean,
  shares: string
) {
  const { data } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'getReturnForShares',
    args: [outcome, parseEther(shares || '0')],
    query: { enabled: !!marketAddress && !!shares },
  });

  return data ? formatEther(data as bigint) : undefined;
}

/**
 * Hook to get user's balance of YES and NO shares
 */
export function useUserShares(marketAddress: string | undefined) {
  const { address } = useAccount();

  const { data: yesShares } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'balanceOf',
    args: [address as Address, BigInt(0)], // YES_SHARE_ID = 0
    query: { enabled: !!marketAddress && !!address },
  });

  const { data: noShares } = useReadContract({
    address: marketAddress as Address,
    abi: MARKET_ABI,
    functionName: 'balanceOf',
    args: [address as Address, BigInt(1)], // NO_SHARE_ID = 1
    query: { enabled: !!marketAddress && !!address },
  });

  return {
    yesShares: yesShares ? formatEther(yesShares as bigint) : '0',
    noShares: noShares ? formatEther(noShares as bigint) : '0',
  };
}

/**
 * Hook to buy shares in a market
 */
export function useBuyShares(marketAddress: string | undefined) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const buyShares = (outcome: boolean, shares: string, ethAmount: string) => {
    if (!marketAddress) {
      throw new Error('Market address is required');
    }

    return writeContract({
      address: marketAddress as Address,
      abi: MARKET_ABI,
      functionName: 'buyShares',
      args: [outcome, parseEther(shares)],
      value: parseEther(ethAmount),
    });
  };

  return {
    buyShares,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to sell shares in a market
 */
export function useSellShares(marketAddress: string | undefined) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const sellShares = (outcome: boolean, shares: string) => {
    if (!marketAddress) {
      throw new Error('Market address is required');
    }

    return writeContract({
      address: marketAddress as Address,
      abi: MARKET_ABI,
      functionName: 'sellShares',
      args: [outcome, parseEther(shares)],
    });
  };

  return {
    sellShares,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to resolve a market (only for resolver)
 */
export function useResolveMarket(marketAddress: string | undefined) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveMarket = (finalPrice: string) => {
    if (!marketAddress) {
      throw new Error('Market address is required');
    }

    return writeContract({
      address: marketAddress as Address,
      abi: MARKET_ABI,
      functionName: 'resolveMarket',
      args: [parseEther(finalPrice)],
    });
  };

  return {
    resolveMarket,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to redeem winning shares after market resolution
 */
export function useRedeemShares(marketAddress: string | undefined) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const redeemShares = () => {
    if (!marketAddress) {
      throw new Error('Market address is required');
    }

    return writeContract({
      address: marketAddress as Address,
      abi: MARKET_ABI,
      functionName: 'redeemShares',
    });
  };

  return {
    redeemShares,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

