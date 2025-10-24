import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MarketCardSkeleton = () => {
  return (
    <Card className="border-border overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      
      <div className="p-4">
        <div className="mb-3">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
        
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded border border-border p-2">
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-5 w-12" />
          </div>
          
          <div className="rounded border border-border p-2">
            <Skeleton className="h-3 w-6 mb-1" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </Card>
  );
};

export default MarketCardSkeleton;
