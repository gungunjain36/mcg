import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { useCollectionDisplay } from '@/hooks/useCollectionData';
import type { TradeEntity, MarketEntity } from '@/lib/graphql';

interface TradeWithMarket {
  trade: TradeEntity;
  market?: MarketEntity;
}

interface TradeHistoryListProps {
  trades: TradeWithMarket[];
}

const TradeRow = ({ trade, market }: { trade: TradeEntity; market?: MarketEntity }) => {
  const { name: collectionName, image: collectionImage } = useCollectionDisplay(
    market?.collectionSlug || ''
  );

  const ethAmount = Number(trade.ethAmount) / 1e18;
  const shareAmount = Number(trade.shareAmount) / 1e18;
  const outcome = trade.outcome ? 'YES' : 'NO';
  const isBuy = trade.isBuy;
  
  const formatDate = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="border-border p-4 hover:border-foreground/20 transition-smooth">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Collection Image & Market Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {market && (
            <>
              <img
                src={collectionImage}
                alt={collectionName}
                className="h-10 w-10 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/nfts/placeholder.svg';
                }}
              />
              <div className="flex-1 min-w-0">
                <Link
                  to={`/market/${market.marketAddress}`}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {market.question}
                </Link>
                <p className="text-xs text-muted-foreground">{collectionName}</p>
              </div>
            </>
          )}
          {!market && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Market: {formatAddress(trade.market_id)}</p>
              <p className="text-xs text-muted-foreground">Details unavailable</p>
            </div>
          )}
        </div>

        {/* Trade Type & Outcome */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isBuy ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <Badge variant={isBuy ? 'default' : 'secondary'} className="text-xs">
              {isBuy ? 'BUY' : 'SELL'}
            </Badge>
          </div>
          <Badge
            variant={outcome === 'YES' ? 'default' : 'secondary'}
            className={outcome === 'YES' ? 'bg-green-500' : 'bg-red-500'}
          >
            {outcome}
          </Badge>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4 text-sm flex-shrink-0">
          <div>
            <div className="text-xs text-muted-foreground">Shares</div>
            <div className="font-medium">{shareAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Amount</div>
            <div className="font-medium">{ethAmount.toFixed(4)} ETH</div>
          </div>
        </div>

        {/* Timestamp & Tx Link */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            {formatDate(trade.timestamp)}
          </div>
          <a
            href={`https://sepolia.etherscan.io/tx/${trade.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            View Tx
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
};

const TradeHistoryList = ({ trades }: TradeHistoryListProps) => {
  if (trades.length === 0) {
    return (
      <Card className="border-border p-12 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2">No Trade History</h3>
          <p className="text-sm text-muted-foreground">
            Your trades will appear here once you start trading
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map(({ trade, market }) => (
        <TradeRow key={trade.id} trade={trade} market={market} />
      ))}
    </div>
  );
};

export default TradeHistoryList;

