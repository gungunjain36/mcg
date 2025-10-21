import { Card } from '@/components/ui/card';
import { Activity, DollarSign, Droplets, Calendar } from 'lucide-react';
import { Market } from '@/lib/mockData';

interface MarketStatsProps {
  market: Market;
}

const MarketStats = ({ market }: MarketStatsProps) => {
  const daysUntilResolution = Math.ceil(
    (new Date(market.resolutionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border p-4">
        <div className="text-xs text-muted-foreground mb-1">Volume</div>
        <div className="text-xl font-semibold">{market.totalVolume.toFixed(1)} ETH</div>
      </Card>
      
      <Card className="border-border p-4">
        <div className="text-xs text-muted-foreground mb-1">Liquidity</div>
        <div className="text-xl font-semibold">{market.totalLiquidity.toFixed(0)} ETH</div>
      </Card>
      
      <Card className="border-border p-4">
        <div className="text-xs text-muted-foreground mb-1">Floor Price</div>
        <div className="text-xl font-semibold">{market.currentFloorPrice} ETH</div>
      </Card>
      
      <Card className="border-border p-4">
        <div className="text-xs text-muted-foreground mb-1">Time Left</div>
        <div className="text-xl font-semibold">{daysUntilResolution} days</div>
      </Card>
    </div>
  );
};

export default MarketStats;
