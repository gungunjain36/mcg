# 🚀 ASI Alliance Integration - Quick Start Guide

**Get your ASI agents running in 10 minutes!**

## ⚡ Super Quick Start

```bash
# 1. Navigate to asi-agents
cd packages/asi-agents

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 4. Run all agents
python run_all_agents.py
```

That's it! Your agents are now running locally. 🎉

## 🌐 Deploy to Agentverse (FREE!)

### Why Agentverse?
- ✅ **FREE hosting** - No backend costs!
- ✅ **Auto-scaling** - Handles any traffic
- ✅ **Built-in monitoring** - Dashboard & logs
- ✅ **Agent discovery** - Searchable via ASI:One
- ✅ **Secure messaging** - Fetch Network protocol

### Deployment Steps

#### 1. Test Locally First
```bash
bash scripts/deploy_to_agentverse.sh
```

This will test all agents and show you their addresses.

#### 2. Go to Agentverse
Visit [https://agentverse.ai/](https://agentverse.ai/) and create a free account.

#### 3. Deploy Each Agent

For **Market Analyst Agent**:
1. Click "Create Agent"
2. Name: `mcg_market_analyst`
3. Upload: `agents/market_analyst.py`
4. Environment Variables:
   ```
   MARKET_ANALYST_SEED=your-seed-1
   GRAPHQL_ENDPOINT=your-indexer-url
   OPENSEA_API_KEY=your-opensea-key (optional)
   ```
5. Click "Deploy" ✅
6. Copy the agent address (starts with `agent1q...`)

Repeat for:
- **Resolver Agent** (`agents/resolver_agent.py`)
- **Portfolio Advisor Agent** (`agents/portfolio_advisor.py`)
- **Oracle Agent** (`agents/oracle_agent.py`)

#### 4. Update Frontend

Create `packages/frontend/.env.local`:

```bash
VITE_ASI_MARKET_ANALYST=agent1q...YOUR_MARKET_ANALYST_ADDRESS
VITE_ASI_RESOLVER=agent1q...YOUR_RESOLVER_ADDRESS
VITE_ASI_PORTFOLIO_ADVISOR=agent1q...YOUR_PORTFOLIO_ADVISOR_ADDRESS
VITE_ASI_ORACLE=agent1q...YOUR_ORACLE_ADDRESS
```

#### 5. Start Frontend

```bash
cd ../frontend
npm run dev
```

#### 6. Test It! 🎉

1. Visit your local frontend (usually http://localhost:5173)
2. Go to any market page
3. Click the "Ask AI" button (bottom-right)
4. Try commands like:
   - "Analyze this market"
   - "Show my portfolio"
   - "Get floor price"

## 🎯 What Each Agent Does

### 📊 Market Analyst
**Command**: "Analyze this market"

**What it does**:
- Fetches current floor price from OpenSea
- Analyzes on-chain market sentiment
- Uses MeTTa to reason about trends
- Predicts future price movements
- Gives buy/sell/hold recommendations

**Example Output**:
```
Market Analysis
───────────────
Floor Price: 30.5 ETH
Predicted: 33.2 ETH
Sentiment: BULLISH
Recommendation: buy_yes
Confidence: 85%

Reasoning:
• Current floor price: 30.5000 ETH
• Market sentiment: 67.3% bullish
• Total volume: 125.00 ETH
• Number of trades: 23
• Analysis confidence: 85%
```

### 💼 Portfolio Advisor
**Command**: "Show my portfolio"

**What it does**:
- Analyzes all your market positions
- Calculates P&L and risk metrics
- Generates personalized advice
- Recommends diversification strategies
- Identifies portfolio weaknesses

**Example Output**:
```
Portfolio Analysis
──────────────────
Positions: 4
Invested: 2.5000 ETH
Realized P&L: +0.3420 ETH
Risk Score: 45%

Recommendations:
• ✅ Well-diversified portfolio across multiple markets
• 🟢 Good risk management
• 🎉 Positive realized P&L: 0.3420 ETH - great job!
• 🔄 Regularly review floor prices before resolution
```

### 🔮 Oracle
**Command**: "Get floor price"

**What it does**:
- Fetches prices from multiple sources
- Aggregates using median (outlier-resistant)
- Calculates confidence based on consensus
- Provides verified, trustworthy data

**Example Output**:
```
Verified Floor Price
────────────────────
Price: 30.5000 ETH
Sources: 1 (OpenSea)
Confidence: 70%
```

### ⚖️ Resolver
**Works automatically** - No user interaction needed

**What it does**:
- Monitors markets for resolution deadlines
- Fetches verified floor prices
- Executes on-chain resolution
- Settles markets trustlessly
- Runs every 10 minutes

**Logs**:
```
✅ Market resolved: 0x1234...
  Target Price: 30.0000 ETH
  Final Price: 30.5000 ETH
  Winner: YES
```

## 🧠 Understanding MeTTa Reasoning

Your agents use **MeTTa knowledge graphs** for structured reasoning. This makes their decisions:
- **Explainable** - You can see WHY they recommend something
- **Provable** - Logic is formally verified
- **Traceable** - Follow the reasoning chain
- **Updatable** - Knowledge evolves with new data

Example MeTTa rule:
```lisp
; If momentum > 0.7 and trend is bullish, recommend buying YES
(= (recommend_buy_yes $collection $confidence)
   (and
     (trend $collection "30d" Bullish)
     (momentum $collection $momentum)
     (> $momentum 0.7)
     (= $confidence 0.85)))
```

See `knowledge/nft_markets.metta` for all reasoning rules.

## 🔧 Troubleshooting

### "Agent not responding"
- ✅ Check agent is deployed on Agentverse
- ✅ Verify agent address in `.env.local`
- ✅ Check Agentverse dashboard for errors

### "Price fetch failed"
- ✅ Add OpenSea API key to `.env`
- ✅ Check collection slug is correct
- ✅ Verify network connectivity

### "Not authorized resolver"
- ✅ Set `RESOLVER_PRIVATE_KEY` in `.env`
- ✅ Ensure wallet is authorized on the market contract

### "GraphQL query failed"
- ✅ Check `GRAPHQL_ENDPOINT` is correct
- ✅ Ensure indexer is running
- ✅ Verify network/firewall settings

## 📱 Chat Commands

The AI chat widget understands natural language, but here are some helpful patterns:

**Market Analysis**:
- "analyze this market"
- "what do you think about this collection?"
- "should I buy?"
- "predict the price"

**Portfolio**:
- "show my portfolio"
- "how am I doing?"
- "analyze my positions"
- "give me advice"

**Price Check**:
- "get floor price"
- "what's the current price?"
- "check the value"
- "verify price"

## 🎯 Next Steps

### 1. Customize Your Agents

Edit agent files to add custom logic:
- `agents/market_analyst.py` - Add more data sources
- `agents/oracle_agent.py` - Integrate more price feeds
- `agents/portfolio_advisor.py` - Add custom strategies

### 2. Extend MeTTa Knowledge

Add new reasoning rules in `knowledge/nft_markets.metta`:
```lisp
; Your custom rule
(= (my_strategy $collection)
   (and
     (floor_price $collection $price)
     (volume_24h $collection $volume)
     ; ... your logic
   ))
```

### 3. Build New Agents

Create specialized agents for:
- Social sentiment analysis
- On-chain whale tracking
- Cross-collection correlations
- Automated trading strategies

### 4. Submit to Hackathon

You're ready for the ASI Alliance $10,000 hackathon! 🏆

See [HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md) for submission checklist.

## 📚 More Resources

- **Full README**: [README.md](./README.md)
- **MeTTa Knowledge Base**: [knowledge/nft_markets.metta](./knowledge/nft_markets.metta)
- **Deployment Script**: [scripts/deploy_to_agentverse.sh](./scripts/deploy_to_agentverse.sh)

- **Fetch.ai Docs**: https://innovationlab.fetch.ai/resources/docs/intro
- **MeTTa Tutorial**: https://metta-lang.dev/docs/learn/tutorials/python_use/metta_python_basics.html
- **Agentverse**: https://agentverse.ai/
- **ASI:One**: https://asi1.ai/

## 💬 Get Help

- **GitHub Issues**: Report bugs and request features
- **Discord**: Join our community for support
- **Documentation**: Check the full README

---

**🎉 Congratulations!** You're now running autonomous AI agents powered by the ASI Alliance. Welcome to the future of decentralized AI! 🚀

