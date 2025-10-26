/**
 * Agentverse Client Library
 * Direct communication with ASI Alliance agents deployed on Agentverse
 * No backend needed - FREE deployment!
 */

// Agent addresses (update these after deploying to Agentverse)
export const ASI_AGENTS = {
  marketAnalyst: process.env.VITE_ASI_MARKET_ANALYST || '',
  resolver: process.env.VITE_ASI_RESOLVER || '',
  portfolioAdvisor: process.env.VITE_ASI_PORTFOLIO_ADVISOR || '',
  oracle: process.env.VITE_ASI_ORACLE || '',
};

// Agentverse API configuration
const AGENTVERSE_API = {
  base: 'https://agentverse.ai/v1/api',
  messages: '/agents',
  query: '/query',
};

/**
 * Message types for agent communication
 */
export interface AgentMessage<T = any> {
  message: T;
  session_id?: string;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Market analysis request/response types
 */
export interface AnalyzeMarketRequest {
  market_address: string;
  collection_slug: string;
  include_prediction?: boolean;
}

export interface MarketAnalysisResponse {
  market_address: string;
  collection_slug: string;
  current_floor_price: number;
  predicted_price: number | null;
  confidence: number;
  sentiment: string;
  recommendation: string;
  reasoning: string[];
  timestamp: string;
}

/**
 * Portfolio analysis request/response types
 */
export interface PortfolioAnalysisRequest {
  user_address: string;
  include_recommendations?: boolean;
}

export interface PortfolioAnalysisResponse {
  user_address: string;
  total_positions: number;
  total_invested_eth: number;
  current_value_eth: number;
  unrealized_pnl_eth: number;
  realized_pnl_eth: number;
  recommendations: string[];
  risk_score: number;
  timestamp: string;
}

/**
 * Price request/response types
 */
export interface PriceRequest {
  collection_slug: string;
  require_consensus?: boolean;
}

export interface PriceResponse {
  collection_slug: string;
  floor_price: number;
  source_count: number;
  sources: string[];
  confidence: number;
  timestamp: string;
}

/**
 * Agentverse Client for browser-based agent communication
 */
export class AgentverseClient {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `mcg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Send a message to an agent on Agentverse
   */
  async sendMessage<TRequest, TResponse>(
    agentAddress: string,
    message: TRequest
  ): Promise<AgentResponse<TResponse>> {
    try {
      const response = await fetch(
        `${AGENTVERSE_API.base}${AGENTVERSE_API.messages}/${agentAddress}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            session_id: this.sessionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Agent communication failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Agentverse communication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Market Analyst: Analyze a market
   */
  async analyzeMarket(
    marketAddress: string,
    collectionSlug: string,
    includePrediction = true
  ): Promise<AgentResponse<MarketAnalysisResponse>> {
    const request: AnalyzeMarketRequest = {
      market_address: marketAddress,
      collection_slug: collectionSlug,
      include_prediction: includePrediction,
    };

    return this.sendMessage<AnalyzeMarketRequest, MarketAnalysisResponse>(
      ASI_AGENTS.marketAnalyst,
      request
    );
  }

  /**
   * Portfolio Advisor: Get portfolio advice
   */
  async getPortfolioAdvice(
    userAddress: string,
    includeRecommendations = true
  ): Promise<AgentResponse<PortfolioAnalysisResponse>> {
    const request: PortfolioAnalysisRequest = {
      user_address: userAddress,
      include_recommendations: includeRecommendations,
    };

    return this.sendMessage<PortfolioAnalysisRequest, PortfolioAnalysisResponse>(
      ASI_AGENTS.portfolioAdvisor,
      request
    );
  }

  /**
   * Oracle: Get verified floor price
   */
  async getVerifiedPrice(
    collectionSlug: string,
    requireConsensus = true
  ): Promise<AgentResponse<PriceResponse>> {
    const request: PriceRequest = {
      collection_slug: collectionSlug,
      require_consensus: requireConsensus,
    };

    return this.sendMessage<PriceRequest, PriceResponse>(
      ASI_AGENTS.oracle,
      request
    );
  }
}

/**
 * Utility functions
 */
export function isAsiConfigured(): boolean {
  return Object.values(ASI_AGENTS).every((addr) => addr && addr.length > 0);
}

export function formatAgentResponse(response: AgentResponse<any>): string {
  if (!response.success) {
    return `Error: ${response.error}`;
  }

  if (!response.data) {
    return 'No data received from agent';
  }

  const data = response.data;

  // Format market analysis
  if (data.sentiment) {
    return `
**Market Analysis**

Floor Price: ${data.current_floor_price?.toFixed(4)} ETH
${data.predicted_price ? `Predicted: ${data.predicted_price.toFixed(4)} ETH` : ''}
Sentiment: ${data.sentiment.toUpperCase()}
Recommendation: ${data.recommendation}
Confidence: ${(data.confidence * 100).toFixed(0)}%

**Reasoning:**
${data.reasoning?.map((r: string) => `• ${r}`).join('\n')}
    `.trim();
  }

  // Format portfolio analysis
  if (data.total_positions !== undefined) {
    return `
**Portfolio Analysis**

Positions: ${data.total_positions}
Invested: ${data.total_invested_eth?.toFixed(4)} ETH
Realized P&L: ${data.realized_pnl_eth?.toFixed(4)} ETH
Risk Score: ${(data.risk_score * 100).toFixed(0)}%

**Recommendations:**
${data.recommendations?.map((r: string) => `• ${r}`).join('\n')}
    `.trim();
  }

  // Format price response
  if (data.floor_price !== undefined) {
    return `
**Verified Floor Price**

Price: ${data.floor_price.toFixed(4)} ETH
Sources: ${data.source_count} (${data.sources?.join(', ')})
Confidence: ${(data.confidence * 100).toFixed(0)}%
    `.trim();
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Create a singleton instance
 */
export const agentverseClient = new AgentverseClient();

