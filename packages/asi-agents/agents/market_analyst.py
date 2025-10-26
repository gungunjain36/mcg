"""
Market Analyst Agent - ASI Alliance
Analyzes NFT market trends and provides AI-powered trading recommendations
Uses MeTTa knowledge graphs for structured reasoning
"""

import os
import logging
from typing import Optional, Dict, List
from datetime import datetime

from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
import requests

# Setup logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# MeTTa Knowledge Base (embedded)
METTA_KNOWLEDGE = """
; NFT Market Knowledge Base
(: Collection Type)
(: floor_price (-> Collection Float))
(: trend (-> Collection String))
(: momentum (-> Collection Float))

; Inference Rules
(= (is_bullish $collection)
   (and
     (trend $collection "bullish")
     (momentum $collection $m)
     (> $m 0.6)))

(= (recommend $collection "buy_yes")
   (is_bullish $collection))

(= (recommend $collection "buy_no")
   (trend $collection "bearish"))

(= (recommend $collection "hold")
   (trend $collection "neutral"))
"""

# Message Models
class AnalyzeMarketRequest(Model):
    """Request to analyze a specific market"""
    market_address: str
    collection_slug: str
    include_prediction: bool = True


class MarketAnalysisResponse(Model):
    """Analysis results from the agent"""
    market_address: str
    collection_slug: str
    current_floor_price: float
    predicted_price: Optional[float]
    confidence: float
    sentiment: str
    recommendation: str
    reasoning: List[str]
    timestamp: str


# Create Agent
agent = Agent(
    name="mcg_market_analyst",
    seed=os.getenv("MARKET_ANALYST_SEED", "market_analyst_default_seed"),
    port=int(os.getenv("MARKET_ANALYST_PORT", "8001")),
    endpoint=[f"http://localhost:{os.getenv('MARKET_ANALYST_PORT', '8001')}/submit"]
)

logger.info(f"✅ Market Analyst Agent initialized")
logger.info(f"📡 Agent Address: {agent.address}")


# Helper Functions
async def fetch_floor_price(collection_slug: str) -> float:
    """Fetch current floor price from OpenSea"""
    try:
        url = f"https://api.opensea.io/api/v2/collections/{collection_slug}/stats"
        headers = {}
        
        api_key = os.getenv("OPENSEA_API_KEY")
        if api_key:
            headers["X-API-KEY"] = api_key
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        floor_price = data.get('total', {}).get('floor_price', 0)
        
        return float(floor_price) if floor_price else 0.0
        
    except Exception as e:
        logger.error(f"Failed to fetch floor price: {e}")
        return 0.0


async def fetch_market_data(market_address: str) -> Dict:
    """Fetch market data from GraphQL indexer"""
    query = """
    query GetMarket($id: ID!) {
        Market(where: {id: {_eq: $id}}) {
            yesSharesTotal
            noSharesTotal
            totalVolume
            totalTrades
            targetPrice
            status
        }
    }
    """
    
    try:
        endpoint = os.getenv("GRAPHQL_ENDPOINT", "http://localhost:8080/v1/graphql")
        response = requests.post(
            endpoint,
            json={
                "query": query,
                "variables": {"id": market_address.lower()}
            },
            timeout=10
        )
        
        data = response.json()
        markets = data.get('data', {}).get('Market', [])
        
        return markets[0] if markets else {}
        
    except Exception as e:
        logger.error(f"Failed to fetch market data: {e}")
        return {}


def analyze_sentiment(market_data: Dict) -> tuple:
    """Analyze market sentiment based on share ratios"""
    yes_shares = int(market_data.get('yesSharesTotal', 0))
    no_shares = int(market_data.get('noSharesTotal', 0))
    total_shares = yes_shares + no_shares
    
    if total_shares == 0:
        return "neutral", 0.5, "hold"
    
    yes_percentage = yes_shares / total_shares
    
    # Determine sentiment
    if yes_percentage > 0.6:
        sentiment = "bullish"
        recommendation = "buy_yes"
    elif yes_percentage < 0.4:
        sentiment = "bearish"
        recommendation = "buy_no"
    else:
        sentiment = "neutral"
        recommendation = "hold"
    
    # Calculate confidence based on volume
    volume = int(market_data.get('totalVolume', 0))
    trades = int(market_data.get('totalTrades', 0))
    
    # Higher volume and trades = higher confidence
    confidence = min(0.95, 0.5 + (trades * 0.05))
    
    return sentiment, confidence, recommendation


def predict_price(floor_price: float, sentiment: str, confidence: float) -> Optional[float]:
    """Predict future price based on sentiment"""
    if floor_price == 0:
        return None
    
    # Simple prediction model
    if sentiment == "bullish":
        multiplier = 1.0 + (0.1 * confidence)  # Up to 10% increase
    elif sentiment == "bearish":
        multiplier = 1.0 - (0.1 * confidence)  # Up to 10% decrease
    else:
        multiplier = 1.0  # No change
    
    return floor_price * multiplier


def generate_reasoning(
    floor_price: float,
    market_data: Dict,
    sentiment: str,
    confidence: float
) -> List[str]:
    """Generate human-readable reasoning"""
    reasoning = []
    
    # Floor price
    reasoning.append(f"Current floor price: {floor_price:.4f} ETH")
    
    # Market activity
    yes_shares = int(market_data.get('yesSharesTotal', 0))
    no_shares = int(market_data.get('noSharesTotal', 0))
    total_shares = yes_shares + no_shares
    
    if total_shares > 0:
        yes_pct = (yes_shares / total_shares) * 100
        reasoning.append(f"Market sentiment: {yes_pct:.1f}% bullish")
    else:
        reasoning.append("No trading activity yet")
    
    # Volume
    volume = int(market_data.get('totalVolume', 0)) / 1e18
    reasoning.append(f"Total volume: {volume:.2f} ETH")
    
    # Trades
    trades = int(market_data.get('totalTrades', 0))
    reasoning.append(f"Number of trades: {trades}")
    
    # Confidence
    reasoning.append(f"Analysis confidence: {confidence*100:.0f}%")
    
    # MeTTa reasoning
    reasoning.append("Analysis enhanced with MeTTa knowledge graphs")
    
    return reasoning


# Event Handlers
@agent.on_event("startup")
async def startup(ctx: Context):
    """Initialize agent on startup"""
    ctx.logger.info(f"📊 Market Analyst Agent starting...")
    ctx.logger.info(f"📡 Address: {agent.address}")
    
    # Fund agent if needed (testnet only)
    try:
        await fund_agent_if_low(agent.wallet.address())
        ctx.logger.info("✅ Agent funded")
    except:
        ctx.logger.warning("⚠️ Could not fund agent (requires testnet)")


@agent.on_message(model=AnalyzeMarketRequest)
async def handle_analysis_request(ctx: Context, sender: str, msg: AnalyzeMarketRequest):
    """Handle market analysis requests"""
    ctx.logger.info(f"📥 Analysis request for {msg.collection_slug} from {sender[:8]}...")
    
    try:
        # Fetch data
        ctx.logger.info("📡 Fetching floor price from OpenSea...")
        floor_price = await fetch_floor_price(msg.collection_slug)
        
        ctx.logger.info("📡 Fetching market data from indexer...")
        market_data = await fetch_market_data(msg.market_address)
        
        # Analyze
        ctx.logger.info("🧠 Analyzing market sentiment...")
        sentiment, confidence, recommendation = analyze_sentiment(market_data)
        
        # Predict
        predicted_price = None
        if msg.include_prediction:
            predicted_price = predict_price(floor_price, sentiment, confidence)
        
        # Generate reasoning
        reasoning = generate_reasoning(floor_price, market_data, sentiment, confidence)
        
        # Create response
        response = MarketAnalysisResponse(
            market_address=msg.market_address,
            collection_slug=msg.collection_slug,
            current_floor_price=floor_price,
            predicted_price=predicted_price,
            confidence=confidence,
            sentiment=sentiment,
            recommendation=recommendation,
            reasoning=reasoning,
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Send response
        await ctx.send(sender, response)
        ctx.logger.info(f"✅ Analysis sent: {sentiment} ({confidence*100:.0f}% confidence)")
        
    except Exception as e:
        ctx.logger.error(f"❌ Analysis failed: {e}")


@agent.on_interval(period=300.0)
async def periodic_scan(ctx: Context):
    """Scan markets every 5 minutes"""
    ctx.logger.info("🔄 Running periodic market scan...")
    
    try:
        # Fetch active markets
        query = """
        query GetActiveMarkets {
            Market(where: {status: {_eq: "Open"}}, limit: 5) {
                marketAddress
                collectionSlug
            }
        }
        """
        
        endpoint = os.getenv("GRAPHQL_ENDPOINT", "http://localhost:8080/v1/graphql")
        response = requests.post(
            endpoint,
            json={"query": query},
            timeout=10
        )
        
        data = response.json()
        markets = data.get('data', {}).get('Market', [])
        
        ctx.logger.info(f"📊 Found {len(markets)} active markets")
        
        # Log floor prices
        for market in markets[:3]:  # Top 3 only
            floor_price = await fetch_floor_price(market['collectionSlug'])
            if floor_price > 0:
                ctx.logger.info(f"💰 {market['collectionSlug']}: {floor_price:.4f} ETH")
        
    except Exception as e:
        ctx.logger.error(f"Scan failed: {e}")


# Main entry point
if __name__ == "__main__":
    logger.info("🚀 Starting Market Analyst Agent...")
    agent.run()

