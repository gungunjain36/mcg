import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, ArrowRight, Wallet, Activity, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { graph } from '@/lib/graphql';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnchainPortfolioFallback } from '@/hooks/useOnchainFallback';
import PositionCard from '@/components/portfolio/PositionCard';
import TradeHistoryList from '@/components/portfolio/TradeHistoryList';

const Portfolio = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'positions' | 'trades'>('positions');
  
  // Fetch user positions from indexer
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['userPositions', address],
    queryFn: () => graph.getUserPositions(address || ''),
    enabled: !!address && isConnected,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  // Fetch user trades from indexer
  const { data: tradesData, isLoading: isLoadingTrades } = useQuery({
    queryKey: ['userTrades', address],
    queryFn: () => graph.getUserTrades(address || '', 100),
    enabled: !!address && isConnected,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  // Fetch markets data to get current prices
  const { data: marketsData } = useQuery({
    queryKey: ['markets', 100],
    queryFn: () => graph.getMarkets(100, 0, [{ createdAt: 'desc' }]),
  });
  
  const positions = positionsData?.Position || [];
  const trades = tradesData?.Trade || [];
  const markets = marketsData?.Market || [];
  const onchainFallback = useOnchainPortfolioFallback(address);
  
  // Debug logging
  console.log('Portfolio Debug:', {
    address,
    positionsCount: positions.length,
    tradesCount: trades.length,
    marketsCount: markets.length,
    positions: positions.map(p => ({ market_id: p.market_id, yesShares: p.yesShares, noShares: p.noShares })),
    onchainFallbackCount: onchainFallback.length,
  });
  
  // Map trades to markets for display
  const tradesWithMarkets = trades.map((trade) => ({
    trade,
    market: markets.find((m) => m.marketAddress === trade.market_id),
  }));
  
  const activePositions = (positions.length > 0 ? positions : []).map((position) => {
    const market = markets.find((m) => m.marketAddress === position.market_id);
    
    // Log if market not found
    if (!market) {
      console.warn('Market not found for position:', position.market_id);
      // Don't filter out - show position anyway with limited info
      const yesShares = Number(position.yesShares) / 1e18;
      const noShares = Number(position.noShares) / 1e18;
      const totalInvested = Number(position.totalInvested) / 1e18;
      const realizedPnL = Number(position.realizedPnL) / 1e18;
      
      return {
        position: {
          marketId: position.market_id,
          yesShares,
          noShares,
          avgYesPrice: 0.5,
          avgNoPrice: 0.5,
        },
        market: {
          id: position.market_id,
          question: 'Loading market data...',
          collectionSlug: 'unknown',
          yesPrice: 0.5,
          noPrice: 0.5,
          resolved: false,
          winningOutcome: undefined,
        },
        totalValue: (yesShares + noShares) * 0.5,
        profit: 0,
        profitPercent: '0',
      };
    }
    
    const yesShares = Number(position.yesShares) / 1e18;
    const noShares = Number(position.noShares) / 1e18;
    const totalInvested = Number(position.totalInvested) / 1e18;
    const realizedPnL = Number(position.realizedPnL) / 1e18;
    
    // Calculate current market prices
    const marketYesShares = Number(market.yesSharesTotal) / 1e18;
    const marketNoShares = Number(market.noSharesTotal) / 1e18;
    const totalShares = marketYesShares + marketNoShares;
    const yesPrice = totalShares > 0 ? marketYesShares / totalShares : 0.5;
    const noPrice = totalShares > 0 ? marketNoShares / totalShares : 0.5;
    
    const yesValue = yesShares * yesPrice;
    const noValue = noShares * noPrice;
    const totalValue = yesValue + noValue;
    const profit = totalValue - totalInvested + realizedPnL;
    const profitPercent = totalInvested > 0 ? ((profit / totalInvested) * 100).toFixed(2) : '0';
    
    return {
      position: {
        marketId: position.market_id,
        yesShares,
        noShares,
        avgYesPrice: yesPrice,
        avgNoPrice: noPrice,
      },
      market: {
        id: market.marketAddress,
        question: market.question,
        collectionSlug: market.collectionSlug,
        yesPrice,
        noPrice,
        resolved: market.status === 'Resolved',
        winningOutcome: market.winningOutcome,
      },
      totalValue,
      profit,
      profitPercent,
    };
  }); // Don't filter - show all positions even with missing market data

  // If indexer returned no positions, fall back to on-chain discovered positions
  const activePositionsFallback = positions.length > 0 ? activePositions : onchainFallback.map((p) => {
    const yesValue = p.yesShares * p.yesPrice;
    const noValue = p.noShares * p.noPrice;
    const totalValue = yesValue + noValue;
    const profit = totalValue; // Without indexer, we can't compute invested/realized; show value only
    const profitPercent = '0';

    return {
      position: {
        marketId: p.marketAddress,
        yesShares: p.yesShares,
        noShares: p.noShares,
        avgYesPrice: p.yesPrice,
        avgNoPrice: p.noPrice,
      },
      market: {
        id: p.marketAddress,
        question: p.question,
        collectionSlug: p.collectionSlug,
        yesPrice: p.yesPrice,
        noPrice: p.noPrice,
        resolved: p.resolved,
      },
      totalValue,
      profit,
      profitPercent,
    };
  });

  const displayPositions = positions.length > 0 ? activePositions : activePositionsFallback;
  
  // Calculate portfolio stats
  const totalPortfolioValue = displayPositions.reduce((sum, item) => sum + (item?.totalValue || 0), 0);
  const totalProfit = displayPositions.reduce((sum, item) => sum + (item?.profit || 0), 0);
  const totalInvested = displayPositions.reduce((sum, item) => {
    if (!item) return sum;
    const position = positions.find(p => p.market_id === item.market.id);
    return sum + (position ? Number(position.totalInvested) / 1e18 : 0);
  }, 0);
  
  // Calculate trade stats
  const totalTrades = trades.length;
  const totalTradeVolume = trades.reduce((sum, trade) => sum + Number(trade.ethAmount) / 1e18, 0);
  const buyTrades = trades.filter(t => t.isBuy).length;
  const sellTrades = trades.filter(t => !t.isBuy).length;
  
  // Show connect wallet prompt if not connected
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-border p-12 text-center">
            <div className="max-w-md mx-auto">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to view your portfolio, trades, and positions
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Track your positions, trades, and performance</p>
          
          {/* Debug Info */}
          {(isLoadingPositions || isLoadingTrades) && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm">
              <p className="text-blue-400">
                {isLoadingPositions && '⏳ Loading positions...'}
                {isLoadingTrades && ' ⏳ Loading trades...'}
              </p>
            </div>
          )}
          
          {positions.length === 0 && !isLoadingPositions && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
              <p className="text-yellow-400">
                ℹ️ No positions found from indexer. {onchainFallback.length > 0 ? `Showing ${onchainFallback.length} positions from on-chain fallback.` : 'No positions found on-chain either.'}
              </p>
            </div>
          )}
        </div>
        
        {/* Portfolio Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Portfolio Value</div>
            <div className="text-2xl font-semibold">{totalPortfolioValue.toFixed(3)} ETH</div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
            <div className="text-2xl font-semibold">{totalInvested.toFixed(3)} ETH</div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
            <div className={`text-2xl font-semibold flex items-center gap-1 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(3)} ETH
            </div>
            {totalInvested > 0 && (
              <div className={`text-xs ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {((totalProfit / totalInvested) * 100).toFixed(2)}%
              </div>
            )}
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Active Positions</div>
            <div className="text-2xl font-semibold">{displayPositions.length}</div>
            <div className="text-xs text-muted-foreground">{totalTrades} total trades</div>
          </Card>
        </div>
        
        {/* Trade Volume Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Volume</div>
            <div className="text-xl font-semibold">{totalTradeVolume.toFixed(3)} ETH</div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Buy Trades
            </div>
            <div className="text-xl font-semibold">{buyTrades}</div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Sell Trades
            </div>
            <div className="text-xl font-semibold">{sellTrades}</div>
          </Card>
        </div>
        
        {/* Tabs for Positions and Trade History */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'positions' | 'trades')}>
          <TabsList className="mb-6">
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Positions ({displayPositions.length})
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Trade History ({totalTrades})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="positions" className="mt-0">
            {isLoadingPositions ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border p-6">
                    <Skeleton className="h-24 w-full" />
                  </Card>
                ))}
              </div>
            ) : displayPositions.length === 0 ? (
              <Card className="border-border p-12 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start trading to build your portfolio
                  </p>
                  <Button asChild size="sm">
                    <Link to="/">Browse Markets</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {displayPositions.map((item) => {
                  const { position, market, totalValue, profit, profitPercent } = item;
                  
                  return (
                    <PositionCard
                      key={market.id}
                      position={position}
                      market={market}
                      totalValue={totalValue}
                      profit={profit}
                      profitPercent={profitPercent}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trades" className="mt-0">
            {isLoadingTrades ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="border-border p-4">
                    <Skeleton className="h-16 w-full" />
                  </Card>
                ))}
              </div>
            ) : (
              <TradeHistoryList trades={tradesWithMarkets} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Portfolio;
