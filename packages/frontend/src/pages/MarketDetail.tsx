import { useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import MarketStats from '@/components/market/MarketStats';
import TradeWidget from '@/components/trade/TradeWidget';
import TradeHistory from '@/components/trade/TradeHistory';
import AsiChatWidget from '@/components/ai/AsiChatWidget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { mockMarkets, mockTrades } from '@/lib/mockData';

const MarketDetail = () => {
  const { id } = useParams();
  const market = mockMarkets.find((m) => m.id === id);
  
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
  
  const marketTrades = mockTrades.filter((t) => t.marketId === market.id);
  
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
            <TradeWidget market={market} />
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
