// OpenSea API v2 integration
const OPENSEA_API_KEY = import.meta.env.VITE_OPENSEA_API_KEY || '';
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';

// OpenSea API v2 Types based on official docs
export interface NFTCollection {
  collection: string;
  name: string;
  description: string;
  image_url: string;
  banner_image_url?: string;
  owner?: string;
  safelist_status?: string;
  category?: string;
  is_disabled?: boolean;
  is_nsfw?: boolean;
  trait_offers_enabled?: boolean;
  collection_offers_enabled?: boolean;
  opensea_url?: string;
  project_url?: string;
  wiki_url?: string;
  discord_url?: string;
  telegram_url?: string;
  twitter_username?: string;
  instagram_username?: string;
  contracts?: Array<{
    address: string;
    chain: string;
  }>;
  total_supply?: number;
  created_date?: string;
}

export interface NFTCollectionStats {
  total: {
    volume: number;
    sales: number;
    average_price: number;
    num_owners: number;
    market_cap: number;
    floor_price: number;
    floor_price_symbol: string;
  };
  intervals?: Array<{
    interval: string;
    volume: number;
    volume_diff: number;
    volume_change: number;
    sales: number;
    sales_diff: number;
    average_price: number;
  }>;
}

export interface TrendingCollection {
  collection: string;
  name: string;
  image_url: string;
  floor_price: number;
  floor_price_symbol: string;
  volume_24h: number;
  volume_change_24h: number;
  sales_24h: number;
}

/**
 * Fetch NFT collection details from OpenSea
 */
export async function getCollection(collectionSlug: string): Promise<NFTCollection | null> {
  try {
    const response = await fetch(`${OPENSEA_BASE_URL}/collections/${collectionSlug}`, {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch collection:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

/**
 * Fetch NFT collection stats from OpenSea
 */
export async function getCollectionStats(collectionSlug: string): Promise<NFTCollectionStats | null> {
  try {
    const response = await fetch(`${OPENSEA_BASE_URL}/collections/${collectionSlug}/stats`, {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch collection stats:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching collection stats:', error);
    return null;
  }
}

/**
 * Search for NFT collections on OpenSea
 */
export async function searchCollections(query: string): Promise<NFTCollection[]> {
  try {
    const response = await fetch(
      `${OPENSEA_BASE_URL}/collections?q=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          'X-API-KEY': OPENSEA_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to search collections:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.collections || [];
  } catch (error) {
    console.error('Error searching collections:', error);
    return [];
  }
}

/**
 * Get current floor price for a collection
 * This is a helper that specifically extracts just the floor price
 */
export async function getFloorPrice(collectionSlug: string): Promise<number | null> {
  const stats = await getCollectionStats(collectionSlug);
  return stats?.total?.floor_price ?? null;
}

/**
 * Map of popular collection slugs to their display names
 * This helps with initial display before OpenSea data loads
 */
export const POPULAR_COLLECTIONS: Record<string, { name: string; image: string }> = {
  'boredapeyachtclub': { name: 'Bored Ape Yacht Club', image: '/nfts/bayc.png' },
  'cryptopunks': { name: 'CryptoPunks', image: '/nfts/cryptopunks.png' },
  'azuki': { name: 'Azuki', image: '/nfts/azuki.png' },
  'pudgypenguins': { name: 'Pudgy Penguins', image: '/nfts/pudgy.png' },
  'doodles-official': { name: 'Doodles', image: '/nfts/doodles.png' },
  'mutant-ape-yacht-club': { name: 'Mutant Ape Yacht Club', image: '/nfts/placeholder.svg' },
  'clonex': { name: 'CLONE X', image: '/nfts/placeholder.svg' },
  'moonbirds': { name: 'Moonbirds', image: '/nfts/placeholder.svg' },
};

/**
 * Get collection display info (name and image)
 * Falls back to popular collections map if API fails
 */
export function getCollectionDisplayInfo(collectionSlug: string): {
  name: string;
  image: string;
} {
  return (
    POPULAR_COLLECTIONS[collectionSlug] || {
      name: collectionSlug,
      image: '/nfts/placeholder.svg',
    }
  );
}

/**
 * Get trending NFT collections from OpenSea
 * Note: OpenSea v2 API doesn't have a direct trending endpoint
 * We'll simulate by fetching popular collections with high volume
 */
export async function getTrendingCollections(limit: number = 20): Promise<TrendingCollection[]> {
  try {
    // Fetch multiple popular collections and get their stats
    const popularSlugs = Object.keys(POPULAR_COLLECTIONS).slice(0, limit);
    
    const collectionsData = await Promise.all(
      popularSlugs.map(async (slug) => {
        const [collection, stats] = await Promise.all([
          getCollection(slug),
          getCollectionStats(slug),
        ]);
        
        if (!collection || !stats) return null;
        
        const interval24h = stats.intervals?.find((i) => i.interval === '1d');
        
        return {
          collection: slug,
          name: collection.name,
          image_url: collection.image_url,
          floor_price: stats.total.floor_price,
          floor_price_symbol: stats.total.floor_price_symbol,
          volume_24h: interval24h?.volume || 0,
          volume_change_24h: interval24h?.volume_change || 0,
          sales_24h: interval24h?.sales || 0,
        };
      })
    );
    
    return collectionsData
      .filter((c): c is TrendingCollection => c !== null)
      .sort((a, b) => b.volume_24h - a.volume_24h);
  } catch (error) {
    console.error('Error fetching trending collections:', error);
    return [];
  }
}

/**
 * Get collection with stats combined
 * This is more efficient than making two separate calls
 */
export async function getCollectionWithStats(
  collectionSlug: string
): Promise<{ collection: NFTCollection; stats: NFTCollectionStats } | null> {
  try {
    const [collection, stats] = await Promise.all([
      getCollection(collectionSlug),
      getCollectionStats(collectionSlug),
    ]);

    if (!collection || !stats) return null;

    return { collection, stats };
  } catch (error) {
    console.error('Error fetching collection with stats:', error);
    return null;
  }
}

/**
 * Get best NFT collections for prediction markets
 * Returns collections with good liquidity and trading volume
 */
export async function getMarketableCollections(limit: number = 50): Promise<NFTCollection[]> {
  try {
    // First, get our popular collections
    const popularSlugs = Object.keys(POPULAR_COLLECTIONS);
    const popularCollections = await Promise.all(
      popularSlugs.map((slug) => getCollection(slug))
    );
    
    const validPopular = popularCollections
      .filter((c): c is NFTCollection => c !== null)
      .filter((c) => !c.is_disabled && !c.is_nsfw)
      .filter((c) => c.name && c.name.trim() !== '' && c.name !== 'Not requested')
      .filter((c) => c.image_url && c.image_url.trim() !== '');
    
    // If we need more collections, fetch from OpenSea API
    if (validPopular.length < limit) {
      try {
        // Fetch collections with a generic search or category
        // OpenSea API v2 doesn't have a "list all" endpoint, so we'll use multiple searches
        const searches = ['art', 'gaming', 'pfp', 'utility', 'metaverse', 'sports'];
        const additionalCollections: NFTCollection[] = [];
        
        for (const searchTerm of searches) {
          if (additionalCollections.length >= limit - validPopular.length) break;
          
          const results = await searchCollections(searchTerm);
          const filtered = results
            .filter((c) => !c.is_disabled && !c.is_nsfw)
            .filter((c) => !popularSlugs.includes(c.collection)) // Avoid duplicates
            .filter((c) => c.name && c.name.trim() !== '' && c.name !== 'Not requested') // Must have valid name
            .filter((c) => c.image_url && c.image_url.trim() !== ''); // Must have valid image
          
          additionalCollections.push(...filtered);
        }
        
        // Deduplicate by collection slug
        const seen = new Set(validPopular.map(c => c.collection));
        const uniqueAdditional = additionalCollections.filter(c => {
          if (seen.has(c.collection)) return false;
          seen.add(c.collection);
          return true;
        });
        
        return [...validPopular, ...uniqueAdditional].slice(0, limit);
      } catch (error) {
        console.error('Error fetching additional collections:', error);
        return validPopular.slice(0, limit);
      }
    }
    
    return validPopular.slice(0, limit);
  } catch (error) {
    console.error('Error fetching marketable collections:', error);
    return [];
  }
}

