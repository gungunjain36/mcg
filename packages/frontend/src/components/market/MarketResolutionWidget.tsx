import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Gavel } from 'lucide-react';
import { useResolveMarket } from '@/hooks/useMarket';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface MarketResolutionWidgetProps {
  marketAddress: string;
  marketQuestion: string;
  targetPrice: number;
  resolverAddress: string;
  currentFloorPrice?: number;
}

const MarketResolutionWidget = ({
  marketAddress,
  marketQuestion,
  targetPrice,
  resolverAddress,
  currentFloorPrice = 0,
}: MarketResolutionWidgetProps) => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [finalPrice, setFinalPrice] = useState(currentFloorPrice.toString());
  
  const {
    resolveMarket,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  } = useResolveMarket(marketAddress);

  const isResolver = address?.toLowerCase() === resolverAddress.toLowerCase();
  
  // Calculate predicted outcome
  const predictedOutcome = parseFloat(finalPrice) > targetPrice ? 'YES' : 'NO';
  
  const handleResolve = async () => {
    if (!finalPrice || parseFloat(finalPrice) <= 0) {
      toast.error('Please enter a valid final price');
      return;
    }

    try {
      await resolveMarket(finalPrice);
      toast.success('Resolution transaction submitted!');
    } catch (err: any) {
      console.error('Resolution error:', err);
      toast.error(err?.message || 'Failed to resolve market');
    }
  };

  // On confirmation, refresh data
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Market resolved successfully!');
      queryClient.invalidateQueries({ queryKey: ['market', marketAddress] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['globalStats'] });
      queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
    }
  }, [isConfirmed, marketAddress, address, queryClient]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error('Resolution failed. Please try again.');
    }
  }, [error]);

  if (!isResolver) {
    return (
      <Card className="border-amber-300 bg-amber-50/50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">Resolution Pending</h3>
            <p className="text-sm text-amber-700 mt-1">
              This market can only be resolved by the designated resolver.
            </p>
            <p className="text-xs text-amber-600 mt-2 font-mono">
              Resolver: {resolverAddress.slice(0, 6)}...{resolverAddress.slice(-4)}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isConfirmed) {
    return (
      <Card className="border-green-300 bg-green-50/50 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900">Market Resolved</h3>
            <p className="text-sm text-green-700 mt-1">
              The market has been successfully resolved at {finalPrice} ETH.
            </p>
            <Badge className="mt-2 bg-green-600">
              Winning Outcome: {predictedOutcome}
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Gavel className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Resolve Market</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You are the designated resolver for this market
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Market Info */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Price</span>
            <span className="font-medium">{targetPrice.toFixed(3)} ETH</span>
          </div>
          {currentFloorPrice > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Floor</span>
              <span className="font-medium">{currentFloorPrice.toFixed(3)} ETH</span>
            </div>
          )}
        </div>

        {/* Final Price Input */}
        <div>
          <Label htmlFor="finalPrice" className="text-sm font-medium">
            Final Floor Price (ETH)
          </Label>
          <Input
            id="finalPrice"
            type="number"
            step="0.001"
            placeholder="0.000"
            value={finalPrice}
            onChange={(e) => setFinalPrice(e.target.value)}
            className="mt-1.5"
            disabled={isPending || isConfirming}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the NFT collection's final floor price at resolution time
          </p>
        </div>

        {/* Predicted Outcome */}
        {finalPrice && parseFloat(finalPrice) > 0 && (
          <div className="rounded-lg border border-border p-3 bg-background">
            <div className="text-xs text-muted-foreground mb-1">Predicted Outcome</div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  predictedOutcome === 'YES'
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-red-500 text-red-700 bg-red-50'
                }
              >
                {predictedOutcome}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {parseFloat(finalPrice).toFixed(3)} ETH {predictedOutcome === 'YES' ? '>' : '≤'}{' '}
                {targetPrice.toFixed(3)} ETH
              </span>
            </div>
          </div>
        )}

        {/* Resolve Button */}
        <Button
          onClick={handleResolve}
          disabled={!finalPrice || parseFloat(finalPrice) <= 0 || isPending || isConfirming}
          className="w-full"
          size="lg"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isConfirming ? 'Confirming...' : 'Resolving...'}
            </>
          ) : (
            <>
              <Gavel className="h-4 w-4 mr-2" />
              Resolve Market
            </>
          )}
        </Button>

        {/* Warning */}
        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            This action is <strong>irreversible</strong>. Ensure the final price is accurate before
            resolving.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MarketResolutionWidget;

