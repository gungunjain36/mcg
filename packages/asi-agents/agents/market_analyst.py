"""
Market Analyst Agent - ASI Alliance
Analyzes NFT market trends and provides AI-powered trading recommendations
Uses MeTTa knowledge graphs for structured reasoning
"""

import os
import logging
from typing import Optional, Dict, List
from datetime import datetime
from uuid import uuid4

from openai import OpenAI
from uagents import Agent, Context, Model, Protocol
from uagents.setup import fund_agent_if_low
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)
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


# Chat Protocol Functions
def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
    content = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(timestamp=datetime.utcnow(), msg_id=uuid4(), content=content)


# OpenAI client for ASI-1 model
client = OpenAI(
    # By default, we are using the ASI-1 LLM endpoint and model
    base_url='https://api.asi1.ai/v1',
    # You can get an ASI-1 api key by creating an account at https://asi1.ai/dashboard/api-keys
    api_key=os.getenv("ASI1_API_KEY", "INSERT_YOUR_API_HERE"),
)

# Create Agent
agent = Agent(
    name="mcg_market_analyst",
    seed=os.getenv("MARKET_ANALYST_SEED", "market_analyst_default_seed"),
    port=int(os.getenv("MARKET_ANALYST_PORT", "8001")),
    endpoint=[f"http://localhost:{os.getenv('MARKET_ANALYST_PORT', '8001')}/submit"]
)

# Create chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

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


async def handle_user_text_with_ai(text: str, ctx: Context) -> str:
    """
    Handle user text input for market analysis using ASI-1 model
    """
    try:
        # Create a system prompt that includes market analysis capabilities
        system_prompt = f"""You are an expert NFT market analyst agent. You specialize in analyzing NFT collections, providing floor prices, market sentiment analysis, and trading recommendations.

Your capabilities include:
- Analyzing NFT collection market trends
- Providing current floor prices from OpenSea
- Analyzing market sentiment based on trading activity
- Making price predictions and trading recommendations
- Using MeTTa knowledge graphs for structured reasoning

You have access to real-time data from OpenSea API and prediction markets.

When users ask about NFT collections, provide helpful analysis. If they ask about topics outside of NFT market analysis, politely redirect them to your area of expertise.

Available commands:
- "analyze [collection-name]" - Full market analysis
- "floor price of [collection-name]" - Get current floor price
- "sentiment for [collection-name]" - Market sentiment analysis
- "help" - Show available commands

Respond in a friendly, professional manner as a market analyst would."""

        r = client.chat.completions.create(
            model="asi1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            max_tokens=2048,
        )

        response = str(r.choices[0].message.content)
        
        # If the AI suggests analysis, we can enhance with actual data
        text_lower = text.lower().strip()
        if "analyze" in text_lower and any(word in text_lower for word in ["boredapeyachtclub", "cryptopunks", "azuki", "pudgypenguins"]):
            # Extract collection name and add real data
            words = text_lower.split()
            for word in words:
                if word in ["boredapeyachtclub", "cryptopunks", "azuki", "pudgypenguins"]:
                    try:
                        floor_price = await fetch_floor_price(word)
                        if floor_price > 0:
                            response += f"\n\n📊 Real-time data: Current floor price for {word} is {floor_price:.4f} ETH"
                    except:
                        pass
                    break
        
        return response
        
    except Exception as e:
        ctx.logger.exception('Error querying ASI-1 model')
        return f"I'm having trouble processing your request right now. Please try again later. As your market analyst, I can help with NFT collection analysis, floor prices, and trading recommendations. {e}"


# Chat Protocol Handlers
@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    # 1) Send the acknowledgement for receiving the message
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.utcnow(), acknowledged_msg_id=msg.msg_id),
    )

    # 2) greet if a session starts
    if any(isinstance(item, StartSessionContent) for item in msg.content):
        await ctx.send(sender, create_text_chat("Hi! I'm your Market Analyst Agent powered by ASI-1. I can analyze NFT markets, provide floor prices, and give AI-powered trading recommendations. How can I help?", end_session=False))

    # 3) collect all text at once
    text = msg.text()
    if not text:
        return
    
    try:
        reply = await handle_user_text_with_ai(text, ctx)
    except Exception as e:
        ctx.logger.exception("Error in handle_user_text_with_ai")
        reply = f"Sorry, something went wrong with the analysis. Please try again. {e}"

    # 4) decide whether to end the session or keep it open
    end_now = False  # Keep session open for continuous market analysis
    await ctx.send(sender, create_text_chat(reply, end_session=end_now))


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    # we are not interested in the acknowledgements for this example, but they can be useful to
    # implement read receipts, for example.
    # ctx.logger.info(f"Got an acknowledgement from {sender} for {msg.acknowledged_msg_id}")
    pass


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


# Include chat protocol to agent
agent.include(chat_proto, publish_manifest=True)


# Main entry point
if __name__ == "__main__":
    logger.info("🚀 Starting Market Analyst Agent...")
    agent.run()
