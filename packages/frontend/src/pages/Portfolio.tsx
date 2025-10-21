import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ArrowRight, Wallet } from 'lucide-react';
import { mockMarkets, mockPositions } from '@/lib/mockData';
import { Link } from 'react-router-dom';

const Portfolio = () => {
  const activePositions = mockPositions.map((position) => {
    const market = mockMarkets.find((m) => m.id === position.marketId);
    if (!market) return null;
    
    const yesValue = position.yesShares * market.yesPrice;
    const noValue = position.noShares * market.noPrice;
    const totalValue = yesValue + noValue;
    const totalCost = position.yesShares * position.avgYesPrice + position.noShares * position.avgNoPrice;
    const profit = totalValue - totalCost;
    const profitPercent = ((profit / totalCost) * 100).toFixed(2);
    
    return { position, market, totalValue, profit, profitPercent };
  }).filter(Boolean);
  
  const totalPortfolioValue = activePositions.reduce((sum, item) => sum + (item?.totalValue || 0), 0);
  const totalProfit = activePositions.reduce((sum, item) => sum + (item?.profit || 0), 0);
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Track positions and performance</p>
        </div>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Value</div>
            <div className="text-2xl font-semibold">{totalPortfolioValue.toFixed(2)} ETH</div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
            <div className={`text-2xl font-semibold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ETH
            </div>
          </Card>
          
          <Card className="border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Active Positions</div>
            <div className="text-2xl font-semibold">{activePositions.length}</div>
          </Card>
        </div>
        
        {/* Active Positions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Positions</h2>
          
          {activePositions.length === 0 ? (
            <Card className="border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start trading to build your portfolio
                </p>
                <Button asChild size="sm">
                  <Link to="/">View Markets</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {activePositions.map((item) => {
                if (!item) return null;
                const { position, market, totalValue, profit, profitPercent } = item;
                
                return (
                  <Card key={market.id} className="border-border p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={market.collectionImage}
                          alt={market.collectionName}
                          className="h-12 w-12 rounded object-cover flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 truncate">{market.question}</h3>
                          <p className="text-xs text-muted-foreground">{market.collectionName}</p>
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
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
