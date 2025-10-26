import { useCollectionDisplay } from '@/hooks/useCollectionData';
import MarketCard from './MarketCard';
import MarketCardSkeleton from './MarketCardSkeleton';
import { Market } from '@/lib/mockData';

interface MarketCardWithCollectionProps {
  market: Omit<Market, 'collectionName' | 'collectionImage'> & {
    collectionSlug: string;
  };
}

/**
 * Wrapper component that fetches collection data dynamically
 * and passes it to MarketCard
 */
const MarketCardWithCollection = ({ market }: MarketCardWithCollectionProps) => {
  const { name, image, isLoading } = useCollectionDisplay(market.collectionSlug);
  
  // Show skeleton while loading collection data
  if (isLoading) {
    return <MarketCardSkeleton />;
  }
  
  // Create full market object with collection data
  const fullMarket: Market = {
    ...market,
    collectionName: name,
    collectionImage: image,
  };
  
  return <MarketCard market={fullMarket} />;
};

export default MarketCardWithCollection;

