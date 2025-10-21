import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Market } from '@/lib/mockData';

interface TradeWidgetProps {
  market: Market;
}

const TradeWidget = ({ market }: TradeWidgetProps) => {
  const [amount, setAmount] = useState('');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  
  const currentPrice = outcome === 'YES' ? market.yesPrice : market.noPrice;
  const estimatedShares = amount ? (parseFloat(amount) / currentPrice).toFixed(2) : '0.00';
  const potentialReturn = amount ? ((parseFloat(amount) / currentPrice) * 1.0).toFixed(2) : '0.00';
  const potentialProfit = amount ? (parseFloat(potentialReturn) - parseFloat(amount)).toFixed(2) : '0.00';
  
  return (
    <Card className="border-border p-6">
      <h3 className="mb-4 text-lg font-semibold">Trade Shares</h3>
      
      <Tabs value={outcome} onValueChange={(v) => setOutcome(v as 'YES' | 'NO')} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="YES" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="mr-2 h-4 w-4" />
            YES
          </TabsTrigger>
          <TabsTrigger value="NO" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <TrendingDown className="mr-2 h-4 w-4" />
            NO
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 text-lg"
          />
        </div>
        
        <div className="rounded border border-border bg-muted/30 p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span>{(currentPrice * 100).toFixed(0)}¢</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares</span>
            <span>{estimatedShares}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span>Potential Profit</span>
            <span className={parseFloat(potentialProfit) > 0 ? 'text-success' : ''}>
              +{potentialProfit} ETH
            </span>
          </div>
        </div>
        
        <Button 
          className="w-full"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Buy {outcome} Shares
        </Button>
        
        <div className="text-center text-xs text-muted-foreground">
          Your Balance: 0.00 {outcome} shares
        </div>
      </div>
    </Card>
  );
};

export default TradeWidget;
