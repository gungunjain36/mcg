import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import MarketStats from '@/components/market/MarketStats';
import TradeWidget from '@/components/trade/TradeWidget';
import TradeHistory from '@/components/trade/TradeHistory';
import AsiChatWidget from '@/components/ai/AsiChatWidget';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { getFloorPrice, getCollectionDisplayInfo } from '@/lib/opensea';
import { graph } from '@/lib/graphql';

const MarketDetail = () => {
  const { id } = useParams();
  
  // Fetch market data from indexer
  const { data: marketData, isLoading: isLoadingMarket } = useQuery({
    queryKey: ['market', id],
    queryFn: () => graph.getMarketById(id || ''),
    enabled: !!id,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch market trades from indexer
  const { data: tradesData, isLoading: isLoadingTrades } = useQuery({
    queryKey: ['marketTrades', id],
    queryFn: () => graph.getMarketTrades(id || '', 100, 0),
    enabled: !!id,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  const marketFromIndexer = marketData?.market;
  const collectionSlug = marketFromIndexer?.collectionSlug || '';
  
  // Fetch OpenSea floor price
  const { data: floorPrice, isLoading: isLoadingFloor } = useQuery({
    queryKey: ['floorPrice', collectionSlug],
    queryFn: () => getFloorPrice(collectionSlug),
    enabled: !!collectionSlug,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Create market object from indexer data only (no mock data)
  const market = marketFromIndexer ? (() => {
    const yesShares = Number(marketFromIndexer.yesSharesTotal) / 1e18;
    const noShares = Number(marketFromIndexer.noSharesTotal) / 1e18;
    const totalShares = yesShares + noShares;
    const yesPrice = totalShares > 0 ? yesShares / totalShares : 0.5;
    const noPrice = totalShares > 0 ? noShares / totalShares : 0.5;
    
    return {
      id: marketFromIndexer.marketAddress,
      question: marketFromIndexer.question,
      collectionSlug: marketFromIndexer.collectionSlug,
      collectionName: getCollectionDisplayInfo(marketFromIndexer.collectionSlug).name,
      collectionImage: getCollectionDisplayInfo(marketFromIndexer.collectionSlug).image,
      targetPrice: Number(marketFromIndexer.targetPrice) / 1e18,
      currentFloorPrice: floorPrice || 0,
      resolutionDate: new Date(Number(marketFromIndexer.resolutionTimestamp) * 1000).toISOString(),
      yesPrice,
      noPrice,
      totalVolume: Number(marketFromIndexer.totalVolume) / 1e18,
      totalLiquidity: totalShares,
      creatorAddress: marketFromIndexer.creator,
      resolved: marketFromIndexer.status === 'Resolved',
      outcome: marketFromIndexer.winningOutcome,
    };
  })() : null;
  
  if (isLoadingMarket) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (!market) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Market not found</h1>
          <p className="text-muted-foreground">The market you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }
  
  // Map indexer trades to UI format (no mock data fallback)
  const marketTrades = tradesData?.Trade ? tradesData.Trade.map(t => ({
    id: t.id,
    marketId: t.market_id,
    userAddress: t.user_id,
    outcome: t.outcome ? 'yes' : 'no',
    type: t.isBuy ? 'buy' : 'sell',
    shares: Number(t.shareAmount) / 1e18,
    price: Number(t.ethAmount) / 1e18,
    timestamp: new Date(Number(t.timestamp) * 1000).toISOString(),
  })) : [];
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Market Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative rounded overflow-hidden w-20 h-20 flex-shrink-0">
              <img
                src={market.collectionImage}
                alt={market.collectionName}
                className="h-full w-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">
                {market.resolved ? 'Resolved' : 'Active'}
              </Badge>
              <h1 className="text-2xl font-semibold mb-2">{market.question}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{market.collectionName}</span>
                <span>•</span>
                <span>Floor: {market.currentFloorPrice} ETH</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="flex-1 rounded border border-border p-4">
              <div className="text-xs text-muted-foreground mb-1">YES</div>
              <div className="text-2xl font-semibold">
                {(market.yesPrice * 100).toFixed(0)}¢
              </div>
            </div>
            
            <div className="flex-1 rounded border border-border p-4">
              <div className="text-xs text-muted-foreground mb-1">NO</div>
              <div className="text-2xl font-semibold">
                {(market.noPrice * 100).toFixed(0)}¢
              </div>
            </div>
          </div>
          
          <MarketStats market={market} />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trading & History */}
          <div className="lg:col-span-2 space-y-6">
            <TradeWidget market={market} marketAddress={marketAddress} />
            <TradeHistory trades={marketTrades} />
            
            {/* Market Details */}
            <Card className="border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Market Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator</span>
                  <span>{market.creatorAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Price</span>
                  <span>{market.targetPrice} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Floor</span>
                  <span>{market.currentFloorPrice} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution Date</span>
                  <span>
                    {new Date(market.resolutionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right Column - AI Chat */}
          <div className="lg:col-span-1">
            <AsiChatWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;
