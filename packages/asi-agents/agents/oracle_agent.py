"""
Oracle Agent - ASI Alliance
Multi-source price aggregation with confidence scoring
Provides verified NFT floor price data for market resolution
"""

import os
import logging
from typing import Optional, List
from datetime import datetime
from statistics import median

from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
import requests

# Setup logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Message Models
class PriceRequest(Model):
    """Request price data for a collection"""
    collection_slug: str
    require_consensus: bool = True


class PriceResponse(Model):
    """Aggregated price data"""
    collection_slug: str
    floor_price: float
    source_count: int
    sources: List[str]
    confidence: float
    timestamp: str


# Create Agent
agent = Agent(
    name="mcg_oracle",
    seed=os.getenv("ORACLE_SEED", "oracle_default_seed"),
    port=int(os.getenv("ORACLE_PORT", "8004")),
    endpoint=[f"http://localhost:{os.getenv('ORACLE_PORT', '8004')}/submit"]
)

logger.info(f"✅ Oracle Agent initialized")
logger.info(f"📡 Agent Address: {agent.address}")


# Helper Functions
async def fetch_opensea_price(collection_slug: str) -> Optional[float]:
    """Fetch price from OpenSea"""
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
        
        return float(floor_price) if floor_price else None
        
    except Exception as e:
        logger.error(f"OpenSea fetch failed: {e}")
        return None


async def fetch_multi_source_prices(collection_slug: str) -> List[float]:
    """Fetch prices from multiple sources"""
    prices = []
    
    # Source 1: OpenSea
    opensea_price = await fetch_opensea_price(collection_slug)
    if opensea_price:
        prices.append(opensea_price)
        logger.info(f"  OpenSea: {opensea_price:.4f} ETH")
    
    # TODO: Add more sources (Blur, LooksRare, etc.) when available
    # For now, we'll use OpenSea as the primary source
    
    return prices


def calculate_confidence(prices: List[float]) -> float:
    """Calculate confidence based on price variance"""
    if len(prices) < 1:
        return 0.0
    
    if len(prices) == 1:
        # Single source - moderate confidence
        return 0.7
    
    # Multiple sources - confidence based on variance
    min_price = min(prices)
    max_price = max(prices)
    avg_price = sum(prices) / len(prices)
    
    if avg_price == 0:
        return 0.5
    
    # Calculate variance ratio
    variance = (max_price - min_price) / avg_price
    
    # Lower variance = higher confidence
    if variance < 0.01:  # < 1% difference
        confidence = 0.95
    elif variance < 0.05:  # < 5% difference
        confidence = 0.85
    elif variance < 0.10:  # < 10% difference
        confidence = 0.75
    else:
        confidence = 0.60
    
    return confidence


# Event Handlers
@agent.on_event("startup")
async def startup(ctx: Context):
    """Initialize agent on startup"""
    ctx.logger.info(f"🔮 Oracle Agent starting...")
    ctx.logger.info(f"📡 Address: {agent.address}")
    
    # Fund agent if needed
    try:
        await fund_agent_if_low(agent.wallet.address())
        ctx.logger.info("✅ Agent funded")
    except:
        ctx.logger.warning("⚠️ Could not fund agent (requires testnet)")


@agent.on_message(model=PriceRequest)
async def handle_price_request(ctx: Context, sender: str, msg: PriceRequest):
    """Handle price requests"""
    ctx.logger.info(f"📥 Price request for {msg.collection_slug} from {sender[:8]}...")
    
    try:
        # Fetch from multiple sources
        ctx.logger.info("📡 Fetching prices from multiple sources...")
        prices = await fetch_multi_source_prices(msg.collection_slug)
        
        if not prices:
            ctx.logger.error("❌ No price data available")
            return
        
        # Aggregate prices (use median for outlier resistance)
        if len(prices) > 1:
            aggregated_price = median(prices)
        else:
            aggregated_price = prices[0]
        
        # Calculate confidence
        confidence = calculate_confidence(prices)
        
        # Create response
        response = PriceResponse(
            collection_slug=msg.collection_slug,
            floor_price=aggregated_price,
            source_count=len(prices),
            sources=["OpenSea"],  # Expand as more sources are added
            confidence=confidence,
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Send response
        await ctx.send(sender, response)
        ctx.logger.info(f"✅ Price: {aggregated_price:.4f} ETH (confidence: {confidence:.0%})")
        
    except Exception as e:
        ctx.logger.error(f"❌ Price fetch failed: {e}")


@agent.on_interval(period=1800.0)
async def monitor_popular_collections(ctx: Context):
    """Monitor popular collections every 30 minutes"""
    ctx.logger.info("🔄 Monitoring popular collections...")
    
    popular_collections = [
        "boredapeyachtclub",
        "azuki",
        "doodles-official",
        "pudgypenguins"
    ]
    
    for slug in popular_collections:
        try:
            prices = await fetch_multi_source_prices(slug)
            if prices:
                price = median(prices) if len(prices) > 1 else prices[0]
                ctx.logger.info(f"  {slug}: {price:.4f} ETH")
        except Exception as e:
            ctx.logger.error(f"  Failed to fetch {slug}: {e}")


# Main entry point
if __name__ == "__main__":
    logger.info("🚀 Starting Oracle Agent...")
    agent.run()

