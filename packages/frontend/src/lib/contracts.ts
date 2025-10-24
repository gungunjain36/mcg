// Contract ABIs and utilities
import MarketFactoryAbi from '../../../frontend/abi/MarketFactory.json';
import MarketAbi from '../../../frontend/abi/Market.json';

export const MARKET_FACTORY_ABI = MarketFactoryAbi as const;
export const MARKET_ABI = MarketAbi as const;

export { MARKET_FACTORY_ABI as marketFactoryABI, MARKET_ABI as marketABI };

