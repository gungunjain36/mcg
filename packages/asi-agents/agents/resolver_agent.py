"""
Resolver Agent - ASI Alliance
Automatically resolves prediction markets using verified price data
Executes on-chain transactions for trustless settlement
"""

import os
import logging
from typing import Optional, Dict
from datetime import datetime

from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
from web3 import Web3
from eth_account import Account
import requests

# Setup logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Message Models
class ResolveMarketRequest(Model):
    """Request to resolve a specific market"""
    market_address: str


class MarketResolutionResponse(Model):
    """Response after resolution attempt"""
    market_address: str
    success: bool
    transaction_hash: Optional[str]
    final_price: Optional[float]
    winning_outcome: Optional[bool]
    error: Optional[str]
    timestamp: str


# Market Contract ABI (minimal for resolution)
MARKET_ABI = [
    {
        "inputs": [{"name": "_finalPrice", "type": "uint256"}],
        "name": "resolveMarket",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "resolver",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "resolutionTimestamp",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "status",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "targetPrice",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Create Agent
agent = Agent(
    name="mcg_resolver",
    seed=os.getenv("RESOLVER_SEED", "resolver_default_seed"),
    port=int(os.getenv("RESOLVER_PORT", "8002")),
    endpoint=[f"http://localhost:{os.getenv('RESOLVER_PORT', '8002')}/submit"]
)

# Web3 Setup
rpc_url = os.getenv("BASE_SEPOLIA_RPC", "https://sepolia.base.org")
w3 = Web3(Web3.HTTPProvider(rpc_url))

resolver_pk = os.getenv("RESOLVER_PRIVATE_KEY", "")
if resolver_pk:
    account = Account.from_key(resolver_pk)
    logger.info(f"🔐 Resolver wallet: {account.address}")
else:
    account = None
    logger.warning("⚠️ No resolver private key - resolution disabled")

logger.info(f"✅ Resolver Agent initialized")
logger.info(f"📡 Agent Address: {agent.address}")


# Helper Functions
async def fetch_floor_price(collection_slug: str) -> Optional[float]:
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
        
        return float(floor_price) if floor_price else None
        
    except Exception as e:
        logger.error(f"Failed to fetch floor price: {e}")
        return None


async def fetch_market_data(market_address: str) -> Dict:
    """Fetch market data from GraphQL"""
    query = """
    query GetMarket($id: ID!) {
        Market(where: {id: {_eq: $id}}) {
            collectionSlug
            targetPrice
            resolutionTimestamp
            resolver
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


async def fetch_resolvable_markets() -> list:
    """Fetch markets ready for resolution"""
    current_timestamp = int(datetime.utcnow().timestamp())
    
    query = """
    query GetResolvableMarkets($currentTime: BigInt!) {
        Market(
            where: {
                status: {_eq: "Open"},
                resolutionTimestamp: {_lte: $currentTime}
            },
            limit: 10
        ) {
            marketAddress
            collectionSlug
            targetPrice
            resolutionTimestamp
        }
    }
    """
    
    try:
        endpoint = os.getenv("GRAPHQL_ENDPOINT", "http://localhost:8080/v1/graphql")
        response = requests.post(
            endpoint,
            json={
                "query": query,
                "variables": {"currentTime": str(current_timestamp)}
            },
            timeout=10
        )
        
        data = response.json()
        return data.get('data', {}).get('Market', [])
        
    except Exception as e:
        logger.error(f"Failed to fetch resolvable markets: {e}")
        return []


async def resolve_market(market_address: str) -> MarketResolutionResponse:
    """Resolve a market on-chain"""
    try:
        # Get market contract
        market_contract = w3.eth.contract(
            address=Web3.to_checksum_address(market_address),
            abi=MARKET_ABI
        )
        
        # Check status
        status = market_contract.functions.status().call()
        if status != 0:  # 0 = Open
            return MarketResolutionResponse(
                market_address=market_address,
                success=False,
                transaction_hash=None,
                final_price=None,
                winning_outcome=None,
                error="Market already resolved",
                timestamp=datetime.utcnow().isoformat()
            )
        
        # Check resolution time
        resolution_time = market_contract.functions.resolutionTimestamp().call()
        current_time = int(datetime.utcnow().timestamp())
        
        if current_time < resolution_time:
            return MarketResolutionResponse(
                market_address=market_address,
                success=False,
                transaction_hash=None,
                final_price=None,
                winning_outcome=None,
                error=f"Resolution time not reached (in {resolution_time - current_time}s)",
                timestamp=datetime.utcnow().isoformat()
            )
        
        # Check if we are the resolver
        if account:
            resolver_address = market_contract.functions.resolver().call()
            if resolver_address.lower() != account.address.lower():
                return MarketResolutionResponse(
                    market_address=market_address,
                    success=False,
                    transaction_hash=None,
                    final_price=None,
                    winning_outcome=None,
                    error="Not authorized resolver",
                    timestamp=datetime.utcnow().isoformat()
                )
        
        # Fetch market data
        market_data = await fetch_market_data(market_address)
        collection_slug = market_data.get('collectionSlug')
        target_price = int(market_data.get('targetPrice', 0))
        
        # Get floor price
        floor_price = await fetch_floor_price(collection_slug)
        
        if floor_price is None:
            return MarketResolutionResponse(
                market_address=market_address,
                success=False,
                transaction_hash=None,
                final_price=None,
                winning_outcome=None,
                error="Failed to fetch floor price",
                timestamp=datetime.utcnow().isoformat()
            )
        
        # Convert to wei
        final_price_wei = w3.to_wei(floor_price, 'ether')
        
        # Determine winning outcome
        winning_outcome = final_price_wei > target_price
        
        logger.info(f"Resolving market {market_address}")
        logger.info(f"  Target Price: {w3.from_wei(target_price, 'ether')} ETH")
        logger.info(f"  Final Price: {floor_price} ETH")
        logger.info(f"  Winner: {'YES' if winning_outcome else 'NO'}")
        
        # Execute resolution if we have account
        if not account:
            return MarketResolutionResponse(
                market_address=market_address,
                success=False,
                transaction_hash=None,
                final_price=floor_price,
                winning_outcome=winning_outcome,
                error="No resolver account configured",
                timestamp=datetime.utcnow().isoformat()
            )
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(account.address)
        
        tx = market_contract.functions.resolveMarket(
            final_price_wei
        ).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 200000,
            'gasPrice': w3.eth.gas_price
        })
        
        # Sign and send
        signed_tx = w3.eth.account.sign_transaction(tx, resolver_pk)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if receipt.status == 1:
            logger.info(f"✅ Market resolved: {tx_hash.hex()}")
            
            return MarketResolutionResponse(
                market_address=market_address,
                success=True,
                transaction_hash=tx_hash.hex(),
                final_price=floor_price,
                winning_outcome=winning_outcome,
                error=None,
                timestamp=datetime.utcnow().isoformat()
            )
        else:
            return MarketResolutionResponse(
                market_address=market_address,
                success=False,
                transaction_hash=tx_hash.hex(),
                final_price=floor_price,
                winning_outcome=winning_outcome,
                error="Transaction reverted",
                timestamp=datetime.utcnow().isoformat()
            )
            
    except Exception as e:
        logger.error(f"Resolution error: {e}", exc_info=True)
        
        return MarketResolutionResponse(
            market_address=market_address,
            success=False,
            transaction_hash=None,
            final_price=None,
            winning_outcome=None,
            error=str(e),
            timestamp=datetime.utcnow().isoformat()
        )


# Event Handlers
@agent.on_event("startup")
async def startup(ctx: Context):
    """Initialize agent on startup"""
    ctx.logger.info(f"⚖️ Resolver Agent starting...")
    ctx.logger.info(f"📡 Address: {agent.address}")
    
    # Fund agent if needed
    try:
        await fund_agent_if_low(agent.wallet.address())
        ctx.logger.info("✅ Agent funded")
    except:
        ctx.logger.warning("⚠️ Could not fund agent (requires testnet)")


@agent.on_message(model=ResolveMarketRequest)
async def handle_resolve_request(ctx: Context, sender: str, msg: ResolveMarketRequest):
    """Handle manual resolution requests"""
    ctx.logger.info(f"📥 Resolution request for {msg.market_address} from {sender[:8]}...")
    
    response = await resolve_market(msg.market_address)
    await ctx.send(sender, response)


@agent.on_interval(period=600.0)
async def check_markets_for_resolution(ctx: Context):
    """Check for markets ready for resolution every 10 minutes"""
    ctx.logger.info("🔄 Checking for markets ready for resolution...")
    
    try:
        markets = await fetch_resolvable_markets()
        
        ctx.logger.info(f"Found {len(markets)} markets ready for resolution")
        
        for market in markets:
            ctx.logger.info(f"⚖️ Resolving market: {market['marketAddress']}")
            
            try:
                response = await resolve_market(market['marketAddress'])
                
                if response.success:
                    ctx.logger.info(f"✅ Market resolved: {response.transaction_hash}")
                else:
                    ctx.logger.error(f"❌ Resolution failed: {response.error}")
                    
            except Exception as e:
                ctx.logger.error(f"Error resolving {market['marketAddress']}: {e}")
            
    except Exception as e:
        ctx.logger.error(f"Check failed: {e}")


# Main entry point
if __name__ == "__main__":
    logger.info("🚀 Starting Resolver Agent...")
    agent.run()

