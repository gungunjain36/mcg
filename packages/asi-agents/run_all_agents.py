"""
Run All MCG.FUN ASI Agents
Starts all 4 agents concurrently for local testing
"""

import asyncio
import logging
import sys
from typing import List
import uvicorn
from threading import Thread
import os

# Import all agents
from agents.market_analyst import agent as market_analyst
from agents.resolver_agent import agent as resolver
from agents.portfolio_advisor import agent as portfolio_advisor
from agents.oracle_agent import agent as oracle
from gateway import app as gateway_app

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('agents.log')
    ]
)
logger = logging.getLogger(__name__)


async def run_agent(agent, name: str):
    """Run a single agent with error handling"""
    try:
        logger.info(f"✅ Starting {name}...")
        await agent.run_async()
    except Exception as e:
        logger.error(f"❌ {name} failed: {e}")
        raise


def run_gateway():
    uvicorn.run(gateway_app, host="0.0.0.0", port=int(os.getenv("GATEWAY_PORT", "8010")))

async def main():
    """Run all agents concurrently"""
    logger.info("=" * 60)
    logger.info("🚀 MCG.FUN ASI Alliance Agents")
    logger.info("=" * 60)
    logger.info("")
    logger.info("Starting all 4 autonomous agents...")
    logger.info("")
    
    # Start gateway in background thread (avoid multiprocessing import issues)
    gateway_thread = Thread(target=run_gateway, daemon=True)
    gateway_thread.start()

    # Create tasks for all agents
    tasks: List[asyncio.Task] = [
        asyncio.create_task(run_agent(market_analyst, "Market Analyst")),
        asyncio.create_task(run_agent(resolver, "Resolver")),
        asyncio.create_task(run_agent(portfolio_advisor, "Portfolio Advisor")),
        asyncio.create_task(run_agent(oracle, "Oracle")),
    ]
    
    logger.info(f"📊 Market Analyst:    {market_analyst.address}")
    logger.info(f"⚖️  Resolver:          {resolver.address}")
    logger.info(f"💼 Portfolio Advisor: {portfolio_advisor.address}")
    logger.info(f"🔮 Oracle:            {oracle.address}")
    logger.info("")
    logger.info("✨ All agents running!")
    logger.info("💬 Agents are discoverable via Agentverse")
    logger.info("⏹️  Press Ctrl+C to stop")
    logger.info("=" * 60)
    
    try:
        # Wait for all tasks
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("")
        logger.info("=" * 60)
        logger.info("⏹️  Shutting down agents...")
        logger.info("=" * 60)
        
        # Cancel all tasks
        for task in tasks:
            task.cancel()
        
        # Wait for cancellation
        await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info("👋 All agents stopped successfully")
        # Thread is daemon; it will exit on process shutdown


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Goodbye!")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)

