import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import Header from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, ExternalLink, Plus } from 'lucide-react';
import {
  getTrendingCollections,
  getMarketableCollections,
  searchCollections,
  type TrendingCollection,
  type NFTCollection,
} from '@/lib/opensea';
import CreateMarketModal from '@/components/market/CreateMarketModal';
import { toast } from 'sonner';

const BrowseCollections = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<TrendingCollection | NFTCollection | null>(null);

  // Fetch trending collections - increased to 20
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['trending-collections'],
    queryFn: () => getTrendingCollections(20),
    staleTime: 300000, // 5 minutes
  });

  // Fetch all marketable collections - increased to 100
  const { data: allCollections, isLoading: isAllLoading } = useQuery({
    queryKey: ['all-collections'],
    queryFn: () => getMarketableCollections(100),
    staleTime: 600000, // 10 minutes
  });

  // Search collections from OpenSea API (for new results not in our list)
  const { data: apiSearchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-collections', searchQuery],
    queryFn: () => searchCollections(searchQuery),
    enabled: searchQuery.length > 2,
    staleTime: 300000,
  });

  // Client-side filtering of already loaded collections + API results
  const displayCollections = searchQuery.length > 2 
    ? (() => {
        const query = searchQuery.toLowerCase();
        
        // Filter already-loaded collections (exclude invalid names)
        const filteredLocal = (allCollections || []).filter(collection => {
          // Skip collections with invalid names
          if (!collection.name || collection.name.trim() === '' || collection.name === 'Not requested') {
            return false;
          }
          return (
            collection.name.toLowerCase().includes(query) ||
            collection.collection.toLowerCase().includes(query) ||
            collection.description?.toLowerCase().includes(query)
          );
        });
        
        // Combine with API search results (deduplicate and filter invalid)
        const apiResults = (apiSearchResults || []).filter(c => 
          c.name && c.name.trim() !== '' && c.name !== 'Not requested'
        );
        const localSlugs = new Set(filteredLocal.map(c => c.collection));
        const uniqueApiResults = apiResults.filter(c => !localSlugs.has(c.collection));
        
        return [...filteredLocal, ...uniqueApiResults];
      })()
    : (allCollections || []).filter(c => 
        c.name && c.name.trim() !== '' && c.name !== 'Not requested'
      );

  // Sync modal state with selected collection
  useEffect(() => {
    if (selectedCollection) {
      // Modal will open when selectedCollection is set
    }
  }, [selectedCollection]);

  const handleCreateMarket = (collection: TrendingCollection | NFTCollection) => {
    setSelectedCollection(collection);
  };

  const handleMarketCreated = () => {
    toast.success('Market created! Check your Portfolio to see your position.');
    
    // Invalidate queries to refresh data immediately
    queryClient.invalidateQueries({ queryKey: ['markets'] });
    queryClient.invalidateQueries({ queryKey: ['globalStats'] });
    queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
    
    setSelectedCollection(null);
    // Optionally navigate to markets page or portfolio
    // navigate('/');
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-semibold mb-4">
              Browse NFT Collections
            </h1>
            <p className="text-base text-muted-foreground mb-6">
              Explore trending NFT collections and create prediction markets based on floor price movements.
            </p>
          </div>
        </div>
      </section>

      {/* Trending Collections */}
      <section className="py-8 border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Trending Collections</h2>
          </div>

          {isTrendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="aspect-square w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingData?.map((collection) => (
                <Card
                  key={collection.collection}
                  className="border-border hover:border-foreground/20 transition-smooth overflow-hidden group cursor-pointer"
                  onClick={() => handleCreateMarket(collection)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={collection.image_url || '/nfts/placeholder.svg'}
                      alt={collection.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/nfts/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2 truncate">
                      {collection.name && collection.name.trim() !== '' && collection.name !== 'Not requested'
                        ? collection.name
                        : collection.collection || 'Unknown Collection'}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="text-muted-foreground">Floor</div>
                        <div className="font-medium">
                          {collection.floor_price?.toFixed(2) || '—'} {collection.floor_price_symbol || 'ETH'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">24h Vol</div>
                        <div className="font-medium">
                          {collection.volume_24h?.toFixed(0) || '—'}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-3" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Market
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All Collections */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">All Collections</h2>
              {displayCollections && displayCollections.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {displayCollections.length} collection{displayCollections.length !== 1 ? 's' : ''}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              )}
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {isSearching || isAllLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : displayCollections && displayCollections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCollections.map((collection) => (
                <Card
                  key={collection.collection}
                  className="border-border hover:border-foreground/20 transition-smooth overflow-hidden group"
                >
                  <div className="p-4">
                    <div className="flex gap-4 mb-4">
                      <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <img
                          src={collection.image_url || '/nfts/placeholder.svg'}
                          alt={collection.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/nfts/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 truncate">
                          {collection.name && collection.name.trim() !== '' && collection.name !== 'Not requested'
                            ? collection.name
                            : collection.collection || 'Unknown Collection'}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {collection.description || 'No description available'}
                        </p>
                        {collection.opensea_url && (
                          <a
                            href={collection.opensea_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View on OpenSea
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {collection.safelist_status && (
                        <Badge variant="outline" className="text-xs">
                          {collection.safelist_status}
                        </Badge>
                      )}
                      {collection.category && (
                        <Badge variant="secondary" className="text-xs">
                          {collection.category}
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleCreateMarket(collection)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Market
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {searchQuery ? 'No collections found matching your search.' : 'No collections available.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Create Market Modal */}
      {selectedCollection && (
        <CreateMarketModal
          preselectedCollection={{
            collection: selectedCollection.collection,
            name: selectedCollection.name,
            image_url: selectedCollection.image_url,
            floor_price: 'floor_price' in selectedCollection ? selectedCollection.floor_price : 0,
            floor_price_symbol: 'floor_price_symbol' in selectedCollection ? selectedCollection.floor_price_symbol : 'ETH',
          }}
          onSuccess={handleMarketCreated}
        />
      )}
    </div>
  );
};

export default BrowseCollections;

