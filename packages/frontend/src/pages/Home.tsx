import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import Header from '@/components/layout/Header';
import MarketCardWithCollection from '@/components/market/MarketCardWithCollection';
import MarketCardSkeleton from '@/components/market/MarketCardSkeleton';
import CreateMarketModal from '@/components/market/CreateMarketModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Plus } from 'lucide-react';
import StatsCards from '@/components/dashboard/StatsCards';
import { graph } from '@/lib/graphql';
import { useBatchMarketTotals } from '@/hooks/useBatchMarketTotals';

const Home = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["globalStats"],
    queryFn: graph.getGlobalStats,
  });

  const { data: marketsData, isLoading: marketsLoading } = useQuery({
    queryKey: ["markets", 30],
    queryFn: () => graph.getMarkets(30, 0, [{ createdAt: 'desc' }]),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const marketsFromIndexer = marketsData?.Market ?? [];
  
  // Extract market addresses for batch fetching
  const marketAddresses = marketsFromIndexer.map(m => m.marketAddress);
  
  // Batch fetch real-time totals for all markets
  // This provides real-time price updates when trades occur, updating every 30 seconds
  const batchTotals = useBatchMarketTotals(marketAddresses);
  
  // Create a component that uses real-time data for each market
  const MarketCardWithRealtimeData = ({ market }: { market: any }) => {
    // Get real-time totals for this specific market
    const onchainTotals = batchTotals[market.marketAddress];
    
    // Use on-chain data if available, otherwise fallback to indexer data
    const yesSharesIndexer = Number(market.yesSharesTotal) / 1e18;
    const noSharesIndexer = Number(market.noSharesTotal) / 1e18;
    const yesShares = onchainTotals?.yes ?? yesSharesIndexer;
    const noShares = onchainTotals?.no ?? noSharesIndexer;
    const totalShares = yesShares + noShares;
    
    // Calculate actual ETH price for YES and NO shares
    // Price represents probability (0-1 range) which equals ETH cost to buy 1 share
    const yesPrice = totalShares > 0 ? yesShares / totalShares : 0.5;
    const noPrice = totalShares > 0 ? noShares / totalShares : 0.5;
    
    const marketWithRealtimePrices = {
      id: market.marketAddress,
      question: market.question,
      collectionSlug: market.collectionSlug,
      targetPrice: Number(market.targetPrice) / 1e18,
      currentFloorPrice: 0,
      resolutionDate: new Date(Number(market.resolutionTimestamp) * 1000).toLocaleDateString(),
      yesPrice, // ETH price per share - REAL-TIME
      noPrice, // ETH price per share - REAL-TIME
      totalVolume: Number(market.totalVolume) / 1e18,
      totalLiquidity: totalShares,
      creatorAddress: market.creator,
      resolved: market.status === 'Resolved',
      outcome: market.winningOutcome,
    };
    
    return <MarketCardWithCollection market={marketWithRealtimePrices} />;
  };

  const mappedMarkets = marketsFromIndexer.map((m) => ({
    marketAddress: m.marketAddress,
    question: m.question,
    collectionSlug: m.collectionSlug,
    targetPrice: m.targetPrice,
    resolutionTimestamp: m.resolutionTimestamp,
    yesSharesTotal: m.yesSharesTotal,
    noSharesTotal: m.noSharesTotal,
    totalVolume: m.totalVolume,
    creator: m.creator,
    status: m.status,
    winningOutcome: m.winningOutcome,
  }));

  const filteredMarkets = mappedMarkets.filter((market) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && market.status !== 'Resolved') ||
      (filter === 'resolved' && market.status === 'Resolved');
    
    const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.collectionSlug.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-semibold mb-4">
              NFT Prediction Markets
            </h1>
            
            <p className="text-base text-muted-foreground mb-6">
              Trade on NFT floor price predictions. Express market opinions through outcome shares.
            </p>
          </div>
        </div>
      </section>
      
      {/* Markets Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="all">All Markets</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {marketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MarketCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMarkets.map((market) => (
                  <MarketCardWithRealtimeData key={market.marketAddress} market={market} />
                ))}
              </div>
              
              {filteredMarkets.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No markets found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
