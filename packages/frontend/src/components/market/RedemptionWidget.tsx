import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Trophy, Coins } from 'lucide-react';
import { useRedeemShares } from '@/hooks/useMarket';
import { useReadContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import { MARKET_ABI } from '@/lib/contracts';

interface RedemptionWidgetProps {
  marketAddress: string;
  marketQuestion: string;
  winningOutcome?: boolean;
  compact?: boolean;
}

const RedemptionWidget = ({ 
  marketAddress, 
  marketQuestion, 
  winningOutcome,
  compact = false 
}: RedemptionWidgetProps) => {
  const { address } = useAccount();
  const [hasRedeemed, setHasRedeemed] = useState(false);

  // Check if user can redeem
  const { data: canRedeemData } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MARKET_ABI,
    functionName: 'canRedeem',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!marketAddress },
  });

  // Get redeemable amount
  const { data: redeemableAmountData } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MARKET_ABI,
    functionName: 'getRedeemableAmount',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!marketAddress },
  });

  const canRedeem = canRedeemData as boolean;
  const redeemableAmount = redeemableAmountData 
    ? parseFloat(formatEther(redeemableAmountData as bigint))
    : 0;

  // Redemption hook
  const { 
    redeemShares, 
    isPending, 
    isConfirming, 
    isConfirmed,
    error 
  } = useRedeemShares(marketAddress);

  const isProcessing = isPending || isConfirming;

  // Handle redemption
  const handleRedeem = async () => {
    try {
      await redeemShares();
      toast.success('Redemption transaction submitted!');
    } catch (error: any) {
      console.error('Redemption error:', error);
      toast.error(error?.message || 'Failed to redeem shares');
    }
  };

  // Update state when redemption is confirmed
  useEffect(() => {
    if (isConfirmed) {
      setHasRedeemed(true);
      toast.success(`Successfully redeemed ${redeemableAmount.toFixed(4)} ETH!`);
    }
  }, [isConfirmed, redeemableAmount]);

  // Show error if redemption failed
  useEffect(() => {
    if (error) {
      toast.error('Redemption failed. Please try again.');
    }
  }, [error]);

  // Don't show widget if user can't redeem
  if (!canRedeem || redeemableAmount === 0 || hasRedeemed) {
    return null;
  }

  // Compact version for portfolio cards
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 p-3 rounded border border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs font-medium text-green-500">Claimable</p>
            <p className="text-sm font-semibold">{redeemableAmount.toFixed(4)} ETH</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleRedeem}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {isConfirming ? 'Confirming...' : 'Claiming...'}
            </>
          ) : (
            <>
              <Coins className="mr-1 h-3 w-3" />
              Claim
            </>
          )}
        </Button>
      </div>
    );
  }

  // Full version for market detail page
  return (
    <Card className="border-green-500/20 bg-green-500/5">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Congratulations! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                You predicted correctly on this market
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Winner
          </Badge>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 mb-4">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Market Outcome</p>
            <p className="font-medium text-sm">{marketQuestion}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs text-muted-foreground">Result:</p>
            <Badge variant={winningOutcome ? "default" : "secondary"}>
              {winningOutcome ? 'YES' : 'NO'}
            </Badge>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 rounded border border-border bg-muted/30">
            <span className="text-sm text-muted-foreground">Claimable Amount</span>
            <span className="text-lg font-semibold text-green-500">
              {redeemableAmount.toFixed(4)} ETH
            </span>
          </div>
          <div className="flex items-center justify-between px-3 text-xs text-muted-foreground">
            <span>Each winning share = 1 ETH</span>
            <span>{redeemableAmount.toFixed(4)} winning shares</span>
          </div>
        </div>

        <Button
          onClick={handleRedeem}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isConfirming ? 'Confirming Transaction...' : 'Submitting Transaction...'}
            </>
          ) : (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Claim {redeemableAmount.toFixed(4)} ETH
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Your winnings will be transferred to your wallet after the transaction confirms
        </p>
      </div>
    </Card>
  );
};

export default RedemptionWidget;

