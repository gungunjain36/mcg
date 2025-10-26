"""
Portfolio Advisor Agent - ASI Alliance
Provides personalized trading recommendations and portfolio management advice
Analyzes user positions and generates actionable insights
"""

import os
import logging
from typing import List, Dict
from datetime import datetime

from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
import requests

# Setup logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Message Models
class PortfolioAnalysisRequest(Model):
    """Request portfolio analysis for a user"""
    user_address: str
    include_recommendations: bool = True


class PortfolioAnalysisResponse(Model):
    """Portfolio analysis results"""
    user_address: str
    total_positions: int
    total_invested_eth: float
    current_value_eth: float
    unrealized_pnl_eth: float
    realized_pnl_eth: float
    recommendations: List[str]
    risk_score: float
    timestamp: str


# Create Agent
agent = Agent(
    name="mcg_portfolio_advisor",
    seed=os.getenv("PORTFOLIO_ADVISOR_SEED", "portfolio_advisor_default_seed"),
    port=int(os.getenv("PORTFOLIO_ADVISOR_PORT", "8003")),
    endpoint=[f"http://localhost:{os.getenv('PORTFOLIO_ADVISOR_PORT', '8003')}/submit"]
)

logger.info(f"✅ Portfolio Advisor Agent initialized")
logger.info(f"📡 Agent Address: {agent.address}")


# Helper Functions
async def fetch_user_positions(user_address: str) -> List[Dict]:
    """Fetch user positions from GraphQL"""
    query = """
    query GetPositions($user: String!) {
        Position(where: {user_id: {_eq: $user}}) {
            market_id
            yesShares
            noShares
            totalInvested
            realizedPnL
            updatedAt
        }
    }
    """
    
    try:
        endpoint = os.getenv("GRAPHQL_ENDPOINT", "http://localhost:8080/v1/graphql")
        response = requests.post(
            endpoint,
            json={
                "query": query,
                "variables": {"user": user_address.lower()}
            },
            timeout=10
        )
        
        data = response.json()
        return data.get('data', {}).get('Position', [])
        
    except Exception as e:
        logger.error(f"Failed to fetch positions: {e}")
        return []


def calculate_risk_score(positions: List[Dict]) -> float:
    """Calculate portfolio risk score (0-1)"""
    if not positions:
        return 0.0
    
    # Risk factors:
    # 1. Number of positions (more = lower risk from diversification)
    # 2. Position concentration (more balanced = lower risk)
    # 3. Total capital at risk
    
    num_positions = len(positions)
    
    # Diversification score (more positions = better)
    if num_positions == 1:
        diversification_risk = 0.8
    elif num_positions == 2:
        diversification_risk = 0.6
    elif num_positions <= 4:
        diversification_risk = 0.4
    else:
        diversification_risk = 0.2
    
    # Concentration score
    total_invested = sum(float(p.get('totalInvested', 0)) for p in positions)
    if total_invested > 0:
        max_position = max(float(p.get('totalInvested', 0)) for p in positions)
        concentration = max_position / total_invested
        concentration_risk = concentration  # 1.0 = all in one position
    else:
        concentration_risk = 0.0
    
    # Combined risk score
    risk_score = (diversification_risk * 0.6) + (concentration_risk * 0.4)
    
    return min(1.0, risk_score)


def generate_recommendations(
    positions: List[Dict],
    risk_score: float,
    realized_pnl: float
) -> List[str]:
    """Generate personalized trading recommendations"""
    recommendations = []
    
    num_positions = len(positions)
    
    # Diversification recommendations
    if num_positions == 0:
        recommendations.append("💡 Start by exploring active markets and taking positions")
        recommendations.append("📊 Consider starting with 2-3 different collections to diversify risk")
    elif num_positions == 1:
        recommendations.append("⚠️ Your portfolio is concentrated in a single market")
        recommendations.append("🎯 Consider diversifying across 3-4 different NFT collections")
    elif num_positions <= 3:
        recommendations.append("✅ Good start on diversification")
        recommendations.append("📈 Consider expanding to 4-5 positions for better risk distribution")
    else:
        recommendations.append("✅ Well-diversified portfolio across multiple markets")
    
    # Risk-based recommendations
    if risk_score > 0.7:
        recommendations.append("🔴 High risk score detected - consider reducing position sizes")
        recommendations.append("🛡️ Hedge your positions by taking opposite sides in correlated markets")
    elif risk_score > 0.5:
        recommendations.append("🟡 Moderate risk - monitor positions closely")
        recommendations.append("⚖️ Balance YES and NO positions to reduce directional risk")
    else:
        recommendations.append("🟢 Good risk management")
    
    # P&L-based recommendations
    if realized_pnl > 0:
        recommendations.append(f"🎉 Positive realized P&L: {realized_pnl:.4f} ETH - great job!")
        recommendations.append("💰 Consider taking profits on winning positions before resolution")
    elif realized_pnl < 0:
        recommendations.append(f"📉 Realized losses: {abs(realized_pnl):.4f} ETH")
        recommendations.append("📚 Review your trading strategy and market analysis")
    
    # Activity-based recommendations
    if num_positions > 0:
        recommendations.append("🔄 Regularly review floor prices before market resolution")
        recommendations.append("📱 Set reminders for resolution dates to claim winnings promptly")
    
    # General advice
    recommendations.append("🧠 Use the Market Analyst agent for data-driven insights")
    recommendations.append("⏰ Monitor upcoming resolution dates to optimize exit timing")
    
    return recommendations[:8]  # Top 8 recommendations


# Event Handlers
@agent.on_event("startup")
async def startup(ctx: Context):
    """Initialize agent on startup"""
    ctx.logger.info(f"💼 Portfolio Advisor Agent starting...")
    ctx.logger.info(f"📡 Address: {agent.address}")
    
    # Fund agent if needed
    try:
        await fund_agent_if_low(agent.wallet.address())
        ctx.logger.info("✅ Agent funded")
    except:
        ctx.logger.warning("⚠️ Could not fund agent (requires testnet)")


@agent.on_message(model=PortfolioAnalysisRequest)
async def handle_analysis_request(ctx: Context, sender: str, msg: PortfolioAnalysisRequest):
    """Handle portfolio analysis requests"""
    ctx.logger.info(f"📥 Portfolio analysis request for {msg.user_address[:8]}... from {sender[:8]}...")
    
    try:
        # Fetch positions
        ctx.logger.info("📡 Fetching user positions...")
        positions = await fetch_user_positions(msg.user_address)
        
        # Calculate metrics
        total_invested = sum(float(p.get('totalInvested', 0)) for p in positions) / 1e18
        realized_pnl = sum(float(p.get('realizedPnL', 0)) for p in positions) / 1e18
        
        # For unrealized P&L, we'd need current market prices
        # Simplified for now
        unrealized_pnl = 0.0
        current_value = total_invested
        
        # Calculate risk
        risk_score = calculate_risk_score(positions)
        
        # Generate recommendations
        recommendations = []
        if msg.include_recommendations:
            recommendations = generate_recommendations(positions, risk_score, realized_pnl)
        
        # Create response
        response = PortfolioAnalysisResponse(
            user_address=msg.user_address,
            total_positions=len(positions),
            total_invested_eth=total_invested,
            current_value_eth=current_value,
            unrealized_pnl_eth=unrealized_pnl,
            realized_pnl_eth=realized_pnl,
            recommendations=recommendations,
            risk_score=risk_score,
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Send response
        await ctx.send(sender, response)
        ctx.logger.info(f"✅ Portfolio analysis sent (Risk: {risk_score:.2f})")
        
    except Exception as e:
        ctx.logger.error(f"❌ Analysis failed: {e}")


# Main entry point
if __name__ == "__main__":
    logger.info("🚀 Starting Portfolio Advisor Agent...")
    agent.run()

