import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import Header from '@/components/layout/Header';
import MarketCard from '@/components/market/MarketCard';
import MarketCardSkeleton from '@/components/market/MarketCardSkeleton';
import CreateMarketModal from '@/components/market/CreateMarketModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Plus } from 'lucide-react';
import { mockMarkets } from '@/lib/mockData';
import StatsCards from '@/components/dashboard/StatsCards';
import { graph } from '@/lib/graphql';

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
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  const marketsFromIndexer = marketsData?.Market ?? [];
  const mappedMarkets = marketsFromIndexer.map((m) => {
    const yesShares = Number(m.yesSharesTotal) / 1e18;
    const noShares = Number(m.noSharesTotal) / 1e18;
    const totalShares = yesShares + noShares;
    const yesPrice = totalShares > 0 ? yesShares / totalShares : 0.5;
    const noPrice = totalShares > 0 ? noShares / totalShares : 0.5;
    
    return {
      id: m.marketAddress,
      question: m.question,
      collectionSlug: m.collectionSlug,
      collectionName: m.collectionSlug,
      collectionImage: `/nfts/${m.collectionSlug || 'placeholder'}.png`,
      targetPrice: Number(m.targetPrice) / 1e18,
      currentFloorPrice: 0,
      resolutionDate: new Date(Number(m.resolutionTimestamp) * 1000).toLocaleDateString(),
      yesPrice,
      noPrice,
      totalVolume: Number(m.totalVolume) / 1e18,
      totalLiquidity: totalShares,
      creatorAddress: m.creator,
      resolved: m.status === 'Resolved',
      outcome: m.winningOutcome,
    };
  });

  const dataForUI = (marketsLoading ? [] : (mappedMarkets.length ? mappedMarkets : mockMarkets));

  const filteredMarkets = dataForUI.filter((market) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !market.resolved) ||
      (filter === 'resolved' && market.resolved);
    
    const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.collectionName.toLowerCase().includes(searchQuery.toLowerCase());
    
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
            
            <div className="flex gap-3">
              <CreateMarketModal />
              <Button size="sm" variant="outline">
                View All
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Markets Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <StatsCards
              totalMarkets={statsData?.globalStats?.totalMarkets}
              totalTrades={statsData?.globalStats?.totalTrades}
              totalUsers={statsData?.globalStats?.totalUsers}
              totalVolumeEth={statsData?.globalStats ? String(statsData.globalStats.totalVolume) : '0'}
              loading={statsLoading}
            />
          </div>
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
                  <MarketCard key={market.id} market={market} />
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
