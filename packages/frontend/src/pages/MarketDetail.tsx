import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import MarketStats from '@/components/market/MarketStats';
import TradeWidget from '@/components/trade/TradeWidget';
import TradeHistory from '@/components/trade/TradeHistory';
import AsiChatWidget from '@/components/ai/AsiChatWidget';
import RedemptionWidget from '@/components/market/RedemptionWidget';
import MarketResolutionWidget from '@/components/market/MarketResolutionWidget';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { getFloorPrice } from '@/lib/opensea';
import { graph } from '@/lib/graphql';
import { useOnchainMarketTotals, useRecentTradesOnchain } from '@/hooks/useOnchainFallback';
import { useCollectionDisplay } from '@/hooks/useCollectionData';
import { useMarketDetails } from '@/hooks/useMarket';

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
  const marketAddress = marketFromIndexer?.marketAddress || id;
  
  // Fetch collection display info dynamically
  const { name: collectionName, image: collectionImage } = useCollectionDisplay(collectionSlug);
  
  // Fetch OpenSea floor price
  const { data: floorPrice, isLoading: isLoadingFloor } = useQuery({
    queryKey: ['floorPrice', collectionSlug],
    queryFn: () => getFloorPrice(collectionSlug),
    enabled: !!collectionSlug,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // On-chain fallback: totals and recent trades
  const onchainTotals = useOnchainMarketTotals(marketAddress);
  const onchainTrades = useRecentTradesOnchain(marketAddress, 50);
  
  // Get on-chain market details (including resolver)
  const { resolver } = useMarketDetails(marketAddress);

  // Create market object (prefer indexer; fallback to on-chain totals)
  const market = marketFromIndexer ? (() => {
    const yesSharesIndexer = Number(marketFromIndexer.yesSharesTotal) / 1e18;
    const noSharesIndexer = Number(marketFromIndexer.noSharesTotal) / 1e18;
    const yesShares = onchainTotals?.yes ?? yesSharesIndexer;
    const noShares = onchainTotals?.no ?? noSharesIndexer;
    const totalShares = yesShares + noShares;
    const yesPrice = totalShares > 0 ? yesShares / totalShares : 0.5;
    const noPrice = totalShares > 0 ? noShares / totalShares : 0.5;
    
    return {
      id: marketFromIndexer.marketAddress,
      question: marketFromIndexer.question,
      collectionSlug: marketFromIndexer.collectionSlug,
      collectionName,
      collectionImage,
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
  
  // Trades: prefer indexer, fallback to on-chain logs
  const tradesFromIndexer = tradesData?.Trade ? tradesData.Trade.map(t => {
    const amountEth = Number(t.ethAmount) / 1e18;
    const shares = Number(t.shareAmount) / 1e18;
    const unitPrice = shares > 0 ? (amountEth / shares) : 0;
    return {
      id: t.id,
      marketId: t.market_id,
      trader: t.user_id,
      outcome: t.outcome ? 'YES' : 'NO',
      type: t.isBuy ? 'BUY' : 'SELL',
      amount: amountEth,
      price: unitPrice,
      timestamp: new Date(Number(t.timestamp) * 1000).toISOString(),
    };
  }) : [];
  const marketTrades = tradesFromIndexer.length > 0 ? tradesFromIndexer : onchainTrades;
  
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
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/nfts/placeholder.svg';
                }}
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

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded border border-green-300/40 bg-green-500/10 p-4">
              <div className="text-xs font-medium text-green-600 mb-1">YES</div>
              <div className="text-2xl font-semibold text-green-700">
                {(market.yesPrice * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-green-600/70 mt-1">
                {market.yesPrice.toFixed(3)} ETH per share
              </div>
            </div>
            <div className="rounded border border-red-300/40 bg-red-500/10 p-4">
              <div className="text-xs font-medium text-red-600 mb-1">NO</div>
              <div className="text-2xl font-semibold text-red-700">
                {(market.noPrice * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-red-600/70 mt-1">
                {market.noPrice.toFixed(3)} ETH per share
              </div>
            </div>
          </div>
          
          <MarketStats market={market} />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trading & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Show resolution widget if market is past resolution date and not resolved */}
            {!market.resolved && new Date() >= new Date(market.resolutionDate) && resolver && (
              <MarketResolutionWidget
                marketAddress={market.id}
                marketQuestion={market.question}
                targetPrice={market.targetPrice}
                resolverAddress={resolver}
                currentFloorPrice={market.currentFloorPrice}
              />
            )}
            
            {/* Show redemption widget if market is resolved */}
            {market.resolved && (
              <RedemptionWidget
                marketAddress={market.id}
                marketQuestion={market.question}
                winningOutcome={market.outcome}
                compact={false}
              />
            )}
            
            {/* Show trading widget only if market is not resolved */}
            {!market.resolved && <TradeWidget market={market} marketAddress={market.id} />}
            
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
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border p-6">
              <div className="text-sm text-muted-foreground mb-2">Price Breakdown</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded bg-green-500/10 p-3">
                  <div className="text-xs text-green-600 mb-1">YES probability</div>
                  <div className="text-lg font-semibold text-green-700">{(market.yesPrice * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded bg-red-500/10 p-3">
                  <div className="text-xs text-red-600 mb-1">NO probability</div>
                  <div className="text-lg font-semibold text-red-700">{(market.noPrice * 100).toFixed(1)}%</div>
                </div>
              </div>
            </Card>
            <AsiChatWidget marketAddress={market.id} collectionSlug={market.collectionSlug} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;
