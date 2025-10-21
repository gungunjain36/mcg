export interface Market {
  id: string;
  question: string;
  collectionSlug: string;
  collectionName: string;
  collectionImage: string;
  targetPrice: number;
  currentFloorPrice: number;
  resolutionDate: string;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  totalLiquidity: number;
  creatorAddress: string;
  resolved: boolean;
  outcome?: 'YES' | 'NO';
}

export interface Trade {
  id: string;
  marketId: string;
  type: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  amount: number;
  price: number;
  trader: string;
  timestamp: string;
}

export interface Position {
  marketId: string;
  yesShares: number;
  noShares: number;
  avgYesPrice: number;
  avgNoPrice: number;
}

export const mockMarkets: Market[] = [
  {
    id: '1',
    question: 'Will BAYC floor price be > 30 ETH by Nov 1st?',
    collectionSlug: 'boredapeyachtclub',
    collectionName: 'Bored Ape Yacht Club',
    collectionImage: '/nfts/bayc.png',
    targetPrice: 30,
    currentFloorPrice: 28.5,
    resolutionDate: '2025-11-01',
    yesPrice: 0.65,
    noPrice: 0.35,
    totalVolume: 450.5,
    totalLiquidity: 1250,
    creatorAddress: '0x1234...5678',
    resolved: false,
  },
  {
    id: '2',
    question: 'Will CryptoPunks floor exceed 60 ETH by Dec 15th?',
    collectionSlug: 'cryptopunks',
    collectionName: 'CryptoPunks',
    collectionImage: '/nfts/cryptopunks.png',
    targetPrice: 60,
    currentFloorPrice: 58.2,
    resolutionDate: '2025-12-15',
    yesPrice: 0.72,
    noPrice: 0.28,
    totalVolume: 892.3,
    totalLiquidity: 2100,
    creatorAddress: '0xabcd...efgh',
    resolved: false,
  },
  {
    id: '3',
    question: 'Will Azuki floor drop below 10 ETH by Oct 30th?',
    collectionSlug: 'azuki',
    collectionName: 'Azuki',
    collectionImage: '/nfts/azuki.png',
    targetPrice: 10,
    currentFloorPrice: 12.3,
    resolutionDate: '2025-10-30',
    yesPrice: 0.42,
    noPrice: 0.58,
    totalVolume: 320.8,
    totalLiquidity: 850,
    creatorAddress: '0x9876...5432',
    resolved: false,
  },
  {
    id: '4',
    question: 'Will Pudgy Penguins floor be > 15 ETH by Dec 1st?',
    collectionSlug: 'pudgypenguins',
    collectionName: 'Pudgy Penguins',
    collectionImage: '/nfts/pudgy.png',
    targetPrice: 15,
    currentFloorPrice: 13.8,
    resolutionDate: '2025-12-01',
    yesPrice: 0.55,
    noPrice: 0.45,
    totalVolume: 275.4,
    totalLiquidity: 680,
    creatorAddress: '0xfedc...ba98',
    resolved: false,
  },
  {
    id: '5',
    question: 'Did Doodles floor reach 8 ETH by Oct 20th?',
    collectionSlug: 'doodles-official',
    collectionName: 'Doodles',
    collectionImage: '/nfts/doodles.png',
    targetPrice: 8,
    currentFloorPrice: 8.5,
    resolutionDate: '2025-10-20',
    yesPrice: 1.0,
    noPrice: 0.0,
    totalVolume: 520.2,
    totalLiquidity: 950,
    creatorAddress: '0x5678...1234',
    resolved: true,
    outcome: 'YES',
  },
];

export const mockTrades: Trade[] = [
  {
    id: '1',
    marketId: '1',
    type: 'BUY',
    outcome: 'YES',
    amount: 5.0,
    price: 0.64,
    trader: '0xabc...def',
    timestamp: '2025-10-19T10:23:00Z',
  },
  {
    id: '2',
    marketId: '1',
    type: 'BUY',
    outcome: 'NO',
    amount: 3.2,
    price: 0.36,
    trader: '0x123...456',
    timestamp: '2025-10-19T10:15:00Z',
  },
  {
    id: '3',
    marketId: '1',
    type: 'SELL',
    outcome: 'YES',
    amount: 2.5,
    price: 0.63,
    trader: '0x789...012',
    timestamp: '2025-10-19T09:45:00Z',
  },
];

export const mockPositions: Position[] = [
  {
    marketId: '1',
    yesShares: 15.5,
    noShares: 0,
    avgYesPrice: 0.58,
    avgNoPrice: 0,
  },
  {
    marketId: '3',
    yesShares: 0,
    noShares: 8.2,
    avgYesPrice: 0,
    avgNoPrice: 0.54,
  },
];
