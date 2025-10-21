import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Trade } from '@/lib/mockData';

interface TradeHistoryProps {
  trades: Trade[];
}

const TradeHistory = ({ trades }: TradeHistoryProps) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };
  
  return (
    <Card className="border-border p-6">
      <h3 className="mb-4 text-lg font-semibold">Recent Trades</h3>
      
      <div className="space-y-3">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between border-b border-border last:border-0 py-3"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                trade.type === 'BUY' 
                  ? trade.outcome === 'YES' ? 'bg-primary/20' : 'bg-secondary/20'
                  : 'bg-muted'
              }`}>
                {trade.type === 'BUY' ? (
                  trade.outcome === 'YES' ? (
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-secondary" />
                  )
                ) : (
                  trade.outcome === 'YES' ? (
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  )
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {formatAddress(trade.trader)}
                  </span>
                  <Badge variant="outline" className={
                    trade.outcome === 'YES' ? 'border-primary/50 text-primary' : 'border-secondary/50 text-secondary'
                  }>
                    {trade.outcome}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {trade.type} • {trade.amount.toFixed(2)} ETH @ {(trade.price * 100).toFixed(0)}¢
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {(trade.amount / trade.price).toFixed(2)} shares
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(trade.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TradeHistory;
