# 🤖 MCG.FUN ASI Alliance Agents

**Autonomous AI agents for NFT prediction markets powered by ASI Alliance**

## 🌟 Overview

This package contains 4 autonomous AI agents built with Fetch.ai's uAgents framework, enhanced with SingularityNET's MeTTa for structured reasoning. These agents power the AI features of MCG.FUN, providing real-time market analysis, automated resolution, portfolio advice, and verified price oracles.

### 🎯 ASI Alliance Integration

- **Fetch.ai uAgents**: Autonomous agent framework
- **SingularityNET MeTTa**: Knowledge graphs for structured reasoning
- **Agentverse**: Decentralized agent hosting (FREE!)
- **ASI:One**: Chat protocol for human-agent interaction
- **Fetch Network**: Secure agent messaging & identities

## 🤖 The Four Agents

### 1. 📊 Market Analyst Agent
**Purpose**: Analyzes NFT markets and provides AI-powered trading recommendations

**Capabilities**:
- Fetches real-time floor prices from OpenSea
- Analyzes market sentiment from on-chain data
- Predicts price movements using MeTTa reasoning
- Provides buy/sell/hold recommendations
- Calculates confidence scores

**MeTTa Integration**: Uses knowledge graphs to reason about:
- Bullish/bearish trends
- Momentum indicators
- Volatility patterns
- Trading opportunities

### 2. ⚖️ Resolver Agent
**Purpose**: Automatically resolves prediction markets using verified data

**Capabilities**:
- Monitors markets for resolution deadlines
- Fetches verified floor prices at resolution time
- Executes on-chain resolution transactions
- Multi-source price verification
- Trustless settlement

**Security**: Only authorized resolvers can execute, with multi-source verification

### 3. 💼 Portfolio Advisor Agent
**Purpose**: Provides personalized trading and portfolio management advice

**Capabilities**:
- Analyzes user positions across all markets
- Calculates P&L and risk metrics
- Generates personalized recommendations
- Diversification advice
- Risk management strategies

**MeTTa Integration**: Uses knowledge graphs for:
- Portfolio risk assessment
- Diversification scoring
- Personalized advice generation

### 4. 🔮 Oracle Agent
**Purpose**: Multi-source price aggregation with confidence scoring

**Capabilities**:
- Fetches prices from multiple sources
- Aggregates using median for outlier resistance
- Confidence scoring based on source consensus
- Real-time price monitoring
- API-based verification

**Planned**: Integration with Blur, LooksRare, and other marketplaces

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- pip or pipenv
- OpenSea API key (optional but recommended)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Configure .env with your settings
nano .env
```

### Configuration

Edit `.env` and set:

```bash
# Required: Generate unique seeds for each agent
MARKET_ANALYST_SEED="your-unique-seed-1"
RESOLVER_SEED="your-unique-seed-2"
PORTFOLIO_ADVISOR_SEED="your-unique-seed-3"
ORACLE_SEED="your-unique-seed-4"

# Optional: Your GraphQL indexer
GRAPHQL_ENDPOINT="http://localhost:8080/v1/graphql"

# Optional: OpenSea API key for higher rate limits
OPENSEA_API_KEY="your-opensea-key"

# Optional: For resolver agent only
RESOLVER_PRIVATE_KEY="your-private-key"
```

### Running Agents

**All agents at once** (recommended):
```bash
python run_all_agents.py
```

**Individual agents**:
```bash
python agents/market_analyst.py
python agents/resolver_agent.py
python agents/portfolio_advisor.py
python agents/oracle_agent.py
```

**Using npm scripts**:
```bash
npm run start:all       # All agents
npm run start:analyst   # Market Analyst only
npm run start:resolver  # Resolver only
npm run start:portfolio # Portfolio Advisor only
npm run start:oracle    # Oracle only
```

## 🌐 Deploying to Agentverse (FREE!)

Agentverse provides **FREE hosting** for your agents - no backend needed!

### Step 1: Prepare Agents

```bash
# Run deployment script
bash scripts/deploy_to_agentverse.sh
```

This will:
- ✅ Test all agents locally
- ✅ Generate agent addresses
- ✅ Provide deployment instructions

### Step 2: Deploy to Agentverse

1. Go to [https://agentverse.ai/](https://agentverse.ai/)
2. Create an account (free)
3. Click "Create Agent" for each agent:
   - Market Analyst
   - Resolver
   - Portfolio Advisor
   - Oracle

For each agent:
- Upload the Python file from `agents/` directory
- Set agent name (e.g., `mcg_market_analyst`)
- Configure environment variables from your `.env`
- Click "Deploy" ✅

### Step 3: Update Frontend

Copy agent addresses and add to `frontend/.env.local`:

```bash
VITE_ASI_MARKET_ANALYST=agent1q...
VITE_ASI_RESOLVER=agent1q...
VITE_ASI_PORTFOLIO_ADVISOR=agent1q...
VITE_ASI_ORACLE=agent1q...
```

### Step 4: Test!

```bash
cd ../frontend
npm run dev
```

Visit a market page and click "Ask AI" to chat with your agents! 🎉

## 🧠 MeTTa Knowledge Graphs

Our agents use MeTTa for structured reasoning. The knowledge base is in `knowledge/nft_markets.metta`.

**Key Features**:
- Type-safe reasoning rules
- Explainable AI decisions
- Dynamic knowledge updates
- Complex inference patterns

**Example MeTTa Rule**:
```lisp
; Recommend buying YES shares for bullish markets
(= (recommend_buy_yes $collection $confidence)
   (and
     (trend $collection "30d" Bullish)
     (momentum $collection $momentum)
     (> $momentum 0.7)
     (= $confidence 0.85)))
```

See `knowledge/nft_markets.metta` for the complete knowledge base.

## 📡 Agent Communication

### From Frontend (TypeScript)

```typescript
import { agentverseClient } from '@/lib/agentverse-client';

// Analyze a market
const response = await agentverseClient.analyzeMarket(
  marketAddress,
  collectionSlug
);

// Get portfolio advice
const advice = await agentverseClient.getPortfolioAdvice(
  userAddress
);

// Get verified price
const price = await agentverseClient.getVerifiedPrice(
  collectionSlug
);
```

### From Other Agents (Python)

```python
from uagents import Context

# Send message to another agent
await ctx.send(
    agent_address,
    AnalyzeMarketRequest(
        market_address="0x123...",
        collection_slug="boredapeyachtclub"
    )
)

# Receive response
@agent.on_message(model=MarketAnalysisResponse)
async def handle_response(ctx: Context, sender: str, msg: MarketAnalysisResponse):
    ctx.logger.info(f"Received analysis: {msg.sentiment}")
```

## 🧪 Testing

```bash
# Run tests
npm test

# Or with pytest directly
pytest tests/ -v
```

## 📊 Monitoring

### Agent Logs

Agents log to both console and `agents.log`:

```bash
# Watch logs in real-time
tail -f agents.log
```

### Agentverse Dashboard

Once deployed, monitor your agents at:
https://agentverse.ai/dashboard

You can see:
- Agent status (online/offline)
- Message history
- Performance metrics
- Error logs

## 🎯 ASI Alliance Hackathon

This project is designed for the ASI Alliance $10,000 hackathon!

### ✅ Requirements Met

**Functionality & Technical Implementation (25%)**:
- ✅ 4 working autonomous agents
- ✅ Real-time communication
- ✅ MeTTa-powered reasoning

**Use of ASI Alliance Tech (20%)**:
- ✅ Agents registered on Agentverse
- ✅ ASI:One Chat Protocol implemented
- ✅ uAgents framework
- ✅ MeTTa Knowledge Graphs

**Innovation & Creativity (20%)**:
- ✅ Novel NFT prediction market use case
- ✅ Multi-agent collaboration
- ✅ Automated market resolution
- ✅ Real-time portfolio optimization

**Real-World Impact (20%)**:
- ✅ Solves real problem (NFT market prediction)
- ✅ Immediate user value
- ✅ Scalable architecture

**User Experience (15%)**:
- ✅ Beautiful chat interface
- ✅ Clear agent responses
- ✅ One-click interactions
- ✅ Comprehensive documentation

### 🏆 Prize Categories

1. **Best use of ASI:One + MeTTa** 🥇
   - ASI:One chat protocol ✅
   - MeTTa knowledge graphs ✅
   - Structured reasoning ✅

2. **Impactful Agentverse launch** 🥈
   - Well-documented agents ✅
   - Easy to discover ✅
   - Clear value proposition ✅

3. **Cohesive multi-agent system** 🥉
   - 4 agents working together ✅
   - Shared knowledge base ✅
   - Coordinated workflows ✅

## 🛠️ Development

### Project Structure

```
packages/asi-agents/
├── agents/                  # Agent implementations
│   ├── market_analyst.py    # Market analysis agent
│   ├── resolver_agent.py    # Resolution agent
│   ├── portfolio_advisor.py # Portfolio advice agent
│   └── oracle_agent.py      # Price oracle agent
├── knowledge/               # MeTTa knowledge bases
│   └── nft_markets.metta    # NFT market knowledge graph
├── scripts/                 # Deployment & utility scripts
│   └── deploy_to_agentverse.sh
├── tests/                   # Agent tests
├── run_all_agents.py        # Multi-agent runner
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

### Adding New Agents

1. Create agent file in `agents/`
2. Define message models with Pydantic
3. Implement event handlers
4. Update `run_all_agents.py`
5. Add to deployment script

### Extending MeTTa Knowledge

Edit `knowledge/nft_markets.metta`:

```lisp
; Add new collection
(: MyCollection Collection)
(floor_price MyCollection 5.0)
(trend MyCollection "30d" Bullish)

; Add new inference rule
(= (my_custom_rule $collection)
   (and
     (floor_price $collection $price)
     (> $price 10.0)))
```

## 📚 Resources

### ASI Alliance Docs
- [Fetch.ai Innovation Lab](https://innovationlab.fetch.ai/resources/docs/intro)
- [uAgents Framework](https://innovationlab.fetch.ai/resources/docs/agent-creation/uagent-creation)
- [Agentverse Guide](https://innovationlab.fetch.ai/resources/docs/agentverse/)
- [MeTTa Documentation](https://metta-lang.dev/docs/learn/tutorials/python_use/metta_python_basics.html)
- [ASI:One](https://asi1.ai/)
- [Agentverse MCP](https://docs.agentverse.ai/documentation/advanced-usages/agentverse-mcp)

### MCG.FUN Docs
- [Project README](../../README.md)
- [Smart Contracts](../blockend/)
- [Frontend](../frontend/)
- [Indexer](../indexer/)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Test your agents locally
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 💬 Support

- **GitHub Issues**: [mcg-fun/issues](https://github.com/your-org/mcg-fun/issues)
- **Discord**: [Join our community](#)
- **Twitter**: [@mcgfun](#)

---

**Built with ❤️ for the ASI Alliance Hackathon**

*Powering the future of decentralized AI agents for NFT prediction markets* 🚀

