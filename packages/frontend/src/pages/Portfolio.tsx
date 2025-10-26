import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, History } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { graph } from '@/lib/graphql';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnchainTrades } from '@/hooks/useOnchainTrades';
import TradeHistoryList from '@/components/portfolio/TradeHistoryList';

const Portfolio = () => {
  const { address, isConnected } = useAccount();
  
  // Fetch user trades - PRIMARY: on-chain, FALLBACK: indexer
  const { trades: onchainTrades, isLoading: isLoadingOnchainTrades } = useOnchainTrades(address);
  
  const { data: tradesData, isLoading: isLoadingIndexerTrades } = useQuery({
    queryKey: ['userTrades', address],
    queryFn: () => graph.getUserTrades(address || '', 100),
    enabled: !!address && isConnected,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  const isLoadingTrades = isLoadingOnchainTrades || isLoadingIndexerTrades;
  
  // Fetch markets data to get current prices
  const { data: marketsData } = useQuery({
    queryKey: ['markets', 100],
    queryFn: () => graph.getMarkets(100, 0, [{ createdAt: 'desc' }]),
  });
  
  const indexerTrades = tradesData?.Trade || [];
  const markets = marketsData?.Market || [];
  
  // Use on-chain trades as primary, indexer as fallback
  const hasOnchainTrades = onchainTrades.length > 0;
  
  // Normalize on-chain trades to match indexer format
  const normalizedOnchainTrades = onchainTrades.map((t) => ({
    id: t.id,
    market_id: t.marketAddress,
    user_id: t.userAddress,
    outcome: t.outcome,
    isBuy: t.isBuy,
    shareAmount: t.shareAmount,
    ethAmount: t.ethAmount,
    yesSharesTotal: '0', // Not available from events
    noSharesTotal: '0', // Not available from events
    timestamp: t.timestamp.toString(),
    blockNumber: t.blockNumber.toString(),
    transactionHash: t.transactionHash,
  }));
  
  const trades = hasOnchainTrades ? normalizedOnchainTrades : indexerTrades;
  
  // Debug logging
  console.log('Portfolio Debug:', {
    address,
    onchainTradesCount: onchainTrades.length,
    indexerTradesCount: indexerTrades.length,
    usingOnchainTrades: hasOnchainTrades,
    marketsCount: markets.length,
  });
  
  // Map trades to markets for display
  const tradesWithMarkets = trades.map((trade) => ({
    trade,
    market: markets.find((m) => m.marketAddress === trade.market_id),
  }));
  
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
        <div className="mb-6 flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Trade History</h1>
            <p className="text-sm text-muted-foreground">View all your trades across markets</p>
          </div>
        </div>
        
        {/* Trade Volume Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
            <div className="text-2xl font-semibold">{totalTrades}</div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Buy Trades
            </div>
            <div className="text-2xl font-semibold">{buyTrades}</div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Sell Trades
            </div>
            <div className="text-2xl font-semibold">{sellTrades}</div>
          </Card>
        </div>
        
        {/* Trade History */}
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
      </div>
    </div>
  );
};

export default Portfolio;
