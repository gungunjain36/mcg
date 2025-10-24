import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { MARKET_FACTORY_ABI } from '@/lib/contracts';
import { getMarketFactoryAddress } from '@/lib/wagmi';
import { useChainId } from 'wagmi';

/**
 * Hook to get all markets from the factory
 */
export function useGetAllMarkets() {
  const chainId = useChainId();
  const factoryAddress = getMarketFactoryAddress(chainId);

  return useReadContract({
    address: factoryAddress as Address,
    abi: MARKET_FACTORY_ABI,
    functionName: 'getAllMarkets',
    query: {
      enabled: !!factoryAddress,
    },
  });
}

/**
 * Hook to create a new market
 */
export function useCreateMarket() {
  const chainId = useChainId();
  const factoryAddress = getMarketFactoryAddress(chainId);
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = (params: {
    question: string;
    collectionSlug: string;
    targetPrice: string;
    resolutionTimestamp: number;
    initialLiquidity: string;
  }) => {
    if (!factoryAddress) {
      throw new Error('Market factory address not found for current chain');
    }

    return writeContract({
      address: factoryAddress as Address,
      abi: MARKET_FACTORY_ABI,
      functionName: 'createMarket',
      args: [
        params.question,
        params.collectionSlug,
        parseEther(params.targetPrice),
        BigInt(params.resolutionTimestamp),
      ],
      value: parseEther(params.initialLiquidity),
    });
  };

  return {
    createMarket,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

