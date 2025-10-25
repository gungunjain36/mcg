import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { Market } from '@/lib/mockData';

interface MarketCardProps {
  market: Market;
}

const MarketCard = ({ market }: MarketCardProps) => {
  const daysUntilResolution = Math.ceil(
    (new Date(market.resolutionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  const priceChange = market.yesPrice > 0.5 ? 'up' : 'down';
  
  return (
    <Link to={`/market/${market.id}`}>
      <Card className="group border-border hover:border-foreground/20 transition-smooth overflow-hidden">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={market.collectionImage}
            alt={market.collectionName}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/nfts/placeholder.svg';
            }}
          />
          {market.resolved && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
              <Badge variant="secondary">
                Resolved: {market.outcome}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-medium leading-tight text-sm mb-1">
              {market.question}
            </h3>
            <p className="text-xs text-muted-foreground">{market.collectionName}</p>
          </div>
          
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded border border-border p-2">
              <div className="text-xs text-muted-foreground mb-1">YES</div>
              <div className="text-base font-semibold">
                {market.yesPrice.toFixed(3)} ETH
              </div>
            </div>
            
            <div className="rounded border border-border p-2">
              <div className="text-xs text-muted-foreground mb-1">NO</div>
              <div className="text-base font-semibold">
                {market.noPrice.toFixed(3)} ETH
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{market.totalVolume.toFixed(1)} ETH</span>
            <span>{daysUntilResolution}d left</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default MarketCard;
