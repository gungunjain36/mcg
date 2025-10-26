import { useQuery } from '@tanstack/react-query';
import { getCollection, getCollectionDisplayInfo, type NFTCollection } from '@/lib/opensea';

/**
 * Custom hook to fetch collection data from OpenSea API with caching
 * Falls back to hardcoded popular collections if API fails
 */
export function useCollectionData(collectionSlug: string) {
  return useQuery<NFTCollection | null>({
    queryKey: ['collection', collectionSlug],
    queryFn: async () => {
      // Try to fetch from OpenSea API
      const collection = await getCollection(collectionSlug);
      return collection;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Helper hook to get collection display info (name and image)
 * with dynamic fetching and fallback to hardcoded values
 */
export function useCollectionDisplay(collectionSlug: string): {
  name: string;
  image: string;
  isLoading: boolean;
} {
  const { data: collection, isLoading } = useCollectionData(collectionSlug);
  
  // If we have data from OpenSea API, use it
  if (collection) {
    return {
      name: collection.name,
      image: collection.image_url || '/nfts/placeholder.svg',
      isLoading: false,
    };
  }
  
  // Fall back to hardcoded popular collections while loading or if API fails
  const fallback = getCollectionDisplayInfo(collectionSlug);
  
  return {
    name: fallback.name,
    image: fallback.image,
    isLoading,
  };
}

