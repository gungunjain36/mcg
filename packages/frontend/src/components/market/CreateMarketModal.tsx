import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Search } from 'lucide-react';
import { useCreateMarket } from '@/hooks/useMarketFactory';
import { searchCollections, type NFTCollection } from '@/lib/opensea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  collectionSlug: z.string().min(1, 'Collection slug is required'),
  targetPrice: z.string().min(0.01, 'Target price must be positive'),
  resolutionDate: z.string().min(1, 'Resolution date is required'),
  initialLiquidity: z.string().min(0.01, 'Initial liquidity must be at least 0.01 ETH'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateMarketModalProps {
  onSuccess?: () => void;
  preselectedCollection?: {
    collection: string;
    name: string;
    image_url: string;
    floor_price?: number;
    floor_price_symbol?: string;
  };
}

const CreateMarketModal = ({ onSuccess, preselectedCollection }: CreateMarketModalProps) => {
  const [open, setOpen] = useState(!!preselectedCollection);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NFTCollection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();
  
  const { createMarket, isPending, isConfirming, isConfirmed } = useCreateMarket();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: preselectedCollection 
        ? `Will ${preselectedCollection.name} floor price be above X ${preselectedCollection.floor_price_symbol || 'ETH'} by DATE?`
        : '',
      collectionSlug: preselectedCollection?.collection || '',
      targetPrice: preselectedCollection?.floor_price?.toString() || '',
      resolutionDate: '',
      initialLiquidity: '0.1',
    },
  });

  const handleSearchCollections = async () => {
    if (!searchQuery) return;
    
    setIsSearching(true);
    try {
      const results = await searchCollections(searchQuery);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching collections:', error);
      toast.error('Failed to search collections');
    } finally {
      setIsSearching(false);
    }
  };

  const selectCollection = (collection: NFTCollection) => {
    form.setValue('collectionSlug', collection.collection);
    setSearchQuery('');
    setSearchResults([]);
  };

  const onSubmit = async (data: FormData) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const resolutionTimestamp = Math.floor(new Date(data.resolutionDate).getTime() / 1000);
      
      await createMarket({
        question: data.question,
        collectionSlug: data.collectionSlug,
        targetPrice: data.targetPrice,
        resolutionTimestamp,
        initialLiquidity: data.initialLiquidity,
      });

      toast.success('Market creation transaction submitted!');
      
      // Wait for confirmation
      if (isConfirmed) {
        toast.success('Market created successfully!');
        
        // Invalidate queries to refresh data immediately
        queryClient.invalidateQueries({ queryKey: ['markets'] });
        queryClient.invalidateQueries({ queryKey: ['globalStats'] });
        queryClient.invalidateQueries({ queryKey: ['userPositions', address] });
        
        form.reset();
        setOpen(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Error creating market:', error);
      toast.error(error?.message || 'Failed to create market');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!preselectedCollection && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Market
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create NFT Prediction Market</DialogTitle>
          <DialogDescription>
            {preselectedCollection 
              ? `Create a prediction market for ${preselectedCollection.name}`
              : 'Create a market for predicting NFT floor prices. Set your question, target price, and resolution date.'}
          </DialogDescription>
        </DialogHeader>
        
        {preselectedCollection && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
            <img 
              src={preselectedCollection.image_url || '/nfts/placeholder.svg'} 
              alt={preselectedCollection.name}
              className="h-12 w-12 rounded object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/nfts/placeholder.svg';
              }}
            />
            <div className="flex-1">
              <div className="font-semibold text-sm">{preselectedCollection.name}</div>
              <div className="text-xs text-muted-foreground">
                Floor: {preselectedCollection.floor_price?.toFixed(2) || '—'} {preselectedCollection.floor_price_symbol || 'ETH'}
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Will BAYC floor price be above 30 ETH by November 1st, 2025?"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Phrase your question clearly. It should resolve to YES or NO.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collectionSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NFT Collection</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="boredapeyachtclub"
                        {...field}
                        value={field.value || searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearchCollections}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    Enter the OpenSea collection slug or search for collections
                  </FormDescription>
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                      {searchResults.map((collection) => (
                        <div
                          key={collection.collection}
                          className="p-2 hover:bg-accent rounded cursor-pointer flex items-center gap-2"
                          onClick={() => selectCollection(collection)}
                        >
                          {collection.image_url && (
                            <img
                              src={collection.image_url}
                              alt={collection.name}
                              className="w-8 h-8 rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{collection.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {collection.collection}
                            </div>
                          </div>
                          {collection.floor_price && (
                            <Badge variant="outline">
                              {collection.floor_price} {collection.floor_price_symbol}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Price (ETH)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The floor price target for the market to resolve
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resolutionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </FormControl>
                  <FormDescription>
                    When the market can be resolved based on the floor price
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialLiquidity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Liquidity (ETH)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    ETH to seed the market with initial liquidity (minimum 0.01 ETH)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending || isConfirming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isConfirming || !isConnected}>
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isPending ? 'Creating...' : 'Confirming...'}
                  </>
                ) : (
                  'Create Market'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMarketModal;
