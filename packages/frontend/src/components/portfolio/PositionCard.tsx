import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollectionDisplay } from '@/hooks/useCollectionData';
import RedemptionWidget from '@/components/market/RedemptionWidget';

interface PositionCardProps {
  position: {
    marketId: string;
    yesShares: number;
    noShares: number;
    avgYesPrice: number;
    avgNoPrice: number;
  };
  market: {
    id: string;
    question: string;
    collectionSlug: string;
    yesPrice: number;
    noPrice: number;
    resolved: boolean;
    winningOutcome?: boolean;
  };
  totalValue: number;
  profit: number;
  profitPercent: string;
}

const PositionCard = ({ position, market, totalValue, profit, profitPercent }: PositionCardProps) => {
  const { name: collectionName, image: collectionImage } = useCollectionDisplay(market.collectionSlug);
  
  return (
    <Card key={market.id} className="border-border p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <img
            src={collectionImage}
            alt={collectionName}
            className="h-12 w-12 rounded object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/nfts/placeholder.svg';
            }}
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1 truncate">{market.question}</h3>
            <p className="text-xs text-muted-foreground">{collectionName}</p>
            {market.resolved && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Resolved: {market.winningOutcome ? 'YES' : 'NO'}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          {position.yesShares > 0 && (
            <div>
              <div className="text-xs text-muted-foreground">YES</div>
              <div className="font-medium">{position.yesShares.toFixed(2)}</div>
            </div>
          )}
          
          {position.noShares > 0 && (
            <div>
              <div className="text-xs text-muted-foreground">NO</div>
              <div className="font-medium">{position.noShares.toFixed(2)}</div>
            </div>
          )}
          
          <div>
            <div className="text-xs text-muted-foreground">Value</div>
            <div className="font-medium">{totalValue.toFixed(2)} ETH</div>
          </div>
        </div>
        
        <Button variant="outline" size="sm" asChild>
          <Link to={`/market/${market.id}`}>
            View
          </Link>
        </Button>
      </div>
      
      {/* Show redemption widget if market is resolved */}
      {market.resolved && (
        <div className="mt-4">
          <RedemptionWidget
            marketAddress={market.id}
            marketQuestion={market.question}
            winningOutcome={market.winningOutcome}
            compact={true}
          />
        </div>
      )}
    </Card>
  );
};

export default PositionCard;

