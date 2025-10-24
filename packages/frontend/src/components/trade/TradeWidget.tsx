import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Market } from '@/lib/mockData';
import { 
  useBuyShares, 
  useSellShares, 
  useGetCostForShares,
  useGetReturnForShares,
  useUserShares,
  useGetSpotPrice
} from '@/hooks/useMarket';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

interface TradeWidgetProps {
  market: Market;
  marketAddress?: string;
}

const TradeWidget = ({ market, marketAddress }: TradeWidgetProps) => {
  const [amount, setAmount] = useState('');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const { isConnected } = useAccount();
  
  const isYes = outcome === 'YES';
  
  // Get user's current shares
  const { yesShares, noShares } = useUserShares(marketAddress);
  const userShares = isYes ? yesShares : noShares;
  
  // Get spot price
  const spotPrice = useGetSpotPrice(marketAddress, isYes);
  
  // Get cost/return estimates
  const costForShares = useGetCostForShares(marketAddress, isYes, amount);
  const returnForShares = useGetReturnForShares(marketAddress, isYes, amount);
  
  // Buy/Sell hooks
  const { buyShares, isPending: isBuying, isConfirming: isBuyConfirming } = useBuyShares(marketAddress);
  const { sellShares, isPending: isSelling, isConfirming: isSellConfirming } = useSellShares(marketAddress);
  
  const isProcessing = isBuying || isSelling || isBuyConfirming || isSellConfirming;
  
  const handleBuy = async () => {
    if (!amount || !costForShares) return;
    
    try {
      await buyShares(isYes, amount, costForShares);
      toast.success('Buy transaction submitted!');
      setAmount('');
    } catch (error: any) {
      console.error('Buy error:', error);
      toast.error(error?.message || 'Failed to buy shares');
    }
  };
  
  const handleSell = async () => {
    if (!amount) return;
    
    try {
      await sellShares(isYes, amount);
      toast.success('Sell transaction submitted!');
      setAmount('');
    } catch (error: any) {
      console.error('Sell error:', error);
      toast.error(error?.message || 'Failed to sell shares');
    }
  };
  
  const currentPrice = spotPrice || (isYes ? market.yesPrice : market.noPrice).toString();
  const estimatedCost = tradeType === 'buy' ? costForShares : returnForShares;
  const potentialProfit = tradeType === 'buy' && amount && estimatedCost
    ? (parseFloat(amount) - parseFloat(estimatedCost)).toFixed(4)
    : '0.00';
  
  return (
    <Card className="border-border p-6">
      <h3 className="mb-4 text-lg font-semibold">Trade Shares</h3>
      
      <Tabs value={outcome} onValueChange={(v) => setOutcome(v as 'YES' | 'NO')} className="mb-4">
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
      
      <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">
            {tradeType === 'buy' ? 'Shares to Buy' : 'Shares to Sell'}
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 text-lg"
            max={tradeType === 'sell' ? userShares : undefined}
          />
        </div>
        
        <div className="rounded border border-border bg-muted/30 p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Spot Price</span>
            <span>{(parseFloat(currentPrice) * 100).toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {tradeType === 'buy' ? 'Estimated Cost' : 'Estimated Return'}
            </span>
            <span>
              {estimatedCost ? `${parseFloat(estimatedCost).toFixed(4)} ETH` : '-'}
            </span>
          </div>
          {tradeType === 'buy' && (
            <div className="flex justify-between pt-2 border-t border-border">
              <span>Max Profit (if wins)</span>
              <span className="text-green-500">
                {amount ? `+${potentialProfit} ETH` : '-'}
              </span>
            </div>
          )}
        </div>
        
        {!isConnected ? (
          <Button className="w-full" disabled>
            Connect Wallet
          </Button>
        ) : (
          <Button 
            className="w-full"
            disabled={
              !amount || 
              parseFloat(amount) <= 0 || 
              isProcessing ||
              (tradeType === 'sell' && parseFloat(amount) > parseFloat(userShares))
            }
            onClick={tradeType === 'buy' ? handleBuy : handleSell}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isBuyConfirming || isSellConfirming ? 'Confirming...' : 'Processing...'}
              </>
            ) : (
              `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${outcome} Shares`
            )}
          </Button>
        )}
        
        <div className="text-center text-xs text-muted-foreground">
          Your Balance: {parseFloat(userShares).toFixed(2)} {outcome} shares
        </div>
      </div>
    </Card>
  );
};

export default TradeWidget;
