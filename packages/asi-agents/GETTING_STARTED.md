# 🚀 Getting Started with ASI Alliance Agents

**Complete setup guide for MCG.FUN autonomous AI agents**

## 📋 What You'll Build

By following this guide, you'll have:
- ✅ 4 fully functional AI agents
- ✅ Real-time market analysis
- ✅ Automated market resolution
- ✅ Portfolio management advice
- ✅ Verified price oracles
- ✅ FREE deployment on Agentverse

**Estimated time**: 15-30 minutes

---

## 🎯 Step-by-Step Setup

### Step 1: Install Dependencies (5 minutes)

```bash
cd packages/asi-agents

# Install Python dependencies
pip install -r requirements.txt
```

**What you installed**:
- `uagents` - Fetch.ai agent framework
- `hyperon` - MeTTa knowledge graph engine
- `web3` - Blockchain interaction
- `requests` - API calls

### Step 2: Configure Environment (5 minutes)

```bash
# Copy the template
cp .env.example .env

# Edit with your favorite editor
nano .env
```

**Required configuration**:

```bash
# Generate unique seeds (any random text)
MARKET_ANALYST_SEED="my-secret-seed-1"
RESOLVER_SEED="my-secret-seed-2"
PORTFOLIO_ADVISOR_SEED="my-secret-seed-3"
ORACLE_SEED="my-secret-seed-4"

# Your GraphQL endpoint (from indexer)
GRAPHQL_ENDPOINT="http://localhost:8080/v1/graphql"

# Optional but recommended
OPENSEA_API_KEY="your-opensea-api-key"
```

**Where to get keys**:
- Seeds: Any random text works
- OpenSea API: https://docs.opensea.io/reference/api-keys (free)
- GraphQL: Should be running from your indexer setup

### Step 3: Test Locally (5 minutes)

```bash
# Test all agents
python run_all_agents.py
```

**What to expect**:
```
============================================================
🚀 MCG.FUN ASI Alliance Agents
============================================================

Starting all 4 autonomous agents...

📊 Market Analyst:    agent1q7j4k...
⚖️  Resolver:          agent1q9s2m...
💼 Portfolio Advisor: agent1q3h8n...
🔮 Oracle:            agent1q6f1p...

✨ All agents running!
💬 Agents are discoverable via Agentverse
⏹️  Press Ctrl+C to stop
============================================================
```

Press `Ctrl+C` to stop after confirming they start successfully.

### Step 4: Deploy to Agentverse (10 minutes)

```bash
# Run deployment helper
bash scripts/deploy_to_agentverse.sh
```

This will:
1. ✅ Test all agents locally
2. ✅ Show you agent addresses
3. ✅ Provide deployment instructions

**Manual deployment steps**:

1. Go to https://agentverse.ai/
2. Create a free account
3. Click "Create Agent" 4 times (one for each agent)

For each agent:
- **Name**: `mcg_market_analyst`, `mcg_resolver`, etc.
- **Code**: Upload Python file from `agents/` directory
- **Environment**: Add variables from your `.env`
- Click **Deploy** ✅

### Step 5: Update Frontend (5 minutes)

```bash
cd ../frontend

# Create environment file
cat > .env.local << EOF
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
VITE_ASI_MARKET_ANALYST=agent1q...
VITE_ASI_RESOLVER=agent1q...
VITE_ASI_PORTFOLIO_ADVISOR=agent1q...
VITE_ASI_ORACLE=agent1q...
EOF

# Start frontend
npm run dev
```

**Copy agent addresses from Agentverse dashboard**

### Step 6: Test the Integration! 🎉

1. Open http://localhost:5173
2. Go to any market page
3. Click the **"Ask AI"** button (bottom-right)
4. Try these commands:
   - "analyze this market"
   - "show my portfolio"
   - "get floor price"

**Expected behavior**:
- Chat widget opens ✅
- You can type messages ✅
- Agents respond with analysis ✅
- Recommendations are shown ✅

---

## 🧪 Testing Your Agents

### Test Market Analyst

```bash
cd packages/asi-agents
python -c "
from agents.market_analyst import agent
print(f'Market Analyst Address: {agent.address}')
"
```

In chat widget: **"analyze this market"**

**Expected response**:
```
Market Analysis
───────────────
Floor Price: 30.5000 ETH
Predicted: 33.2000 ETH
Sentiment: BULLISH
Recommendation: buy_yes
Confidence: 85%

Reasoning:
• Current floor price: 30.5000 ETH
• Market sentiment: 67.3% bullish
• Total volume: 125.00 ETH
```

### Test Portfolio Advisor

In chat widget: **"show my portfolio"**

**Expected response**:
```
Portfolio Analysis
──────────────────
Positions: 3
Invested: 1.2500 ETH
Realized P&L: +0.1200 ETH
Risk Score: 45%

Recommendations:
• ✅ Well-diversified portfolio
• 🟢 Good risk management
• 💰 Consider taking profits
```

### Test Oracle

In chat widget: **"get floor price"**

**Expected response**:
```
Verified Floor Price
────────────────────
Price: 30.5000 ETH
Sources: 1 (OpenSea)
Confidence: 70%
```

### Test Resolver (Automatic)

Check logs every 10 minutes:
```bash
tail -f agents.log
```

Look for:
```
🔄 Checking for markets ready for resolution...
Found 0 markets ready for resolution
```

---

## 🐛 Troubleshooting

### "Module not found"
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### "Connection refused"
```bash
# Check GraphQL is running
curl http://localhost:8080/v1/graphql

# Check Agentverse agents are deployed
# Visit https://agentverse.ai/dashboard
```

### "OpenSea rate limit"
```bash
# Add API key to .env
OPENSEA_API_KEY=your-key-here

# Get free key at:
# https://docs.opensea.io/reference/api-keys
```

### "Agent not responding in chat"
1. Check agent addresses in frontend `.env.local`
2. Verify agents are deployed on Agentverse
3. Check browser console for errors (F12)
4. Ensure collection slug is correct

### "GraphQL query failed"
1. Check indexer is running (`cd packages/indexer && pnpm dev`)
2. Verify endpoint in `.env`
3. Check network connectivity

---

## 📊 Monitoring Your Agents

### Agentverse Dashboard

Visit: https://agentverse.ai/dashboard

You can see:
- 🟢 Agent status (online/offline)
- 📨 Message history
- 📈 Performance metrics
- ❌ Error logs
- 💰 Token balance (testnet)

### Local Logs

```bash
# Watch logs in real-time
tail -f agents.log

# Search for errors
grep ERROR agents.log

# Filter by agent
grep "Market Analyst" agents.log
```

### Frontend Console

Press `F12` in browser → Console tab

Look for:
- Agent requests
- Response data
- Error messages
- Network calls

---

## 🎓 Learning Path

### Beginner
1. ✅ Follow this guide
2. ✅ Test all 4 agents
3. ✅ Read [README.md](./README.md)
4. ✅ Explore MeTTa knowledge base

### Intermediate
1. Modify agent logic in Python files
2. Add new MeTTa reasoning rules
3. Customize recommendations
4. Add more data sources

### Advanced
1. Build new specialized agents
2. Implement cross-agent coordination
3. Add multi-chain support
4. Create custom knowledge graphs

---

## 📚 Next Steps

### For Hackathon Submission

1. ✅ Complete this setup
2. ✅ Test all features
3. ✅ Record demo video
4. ✅ Read [HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md)
5. ✅ Submit to ASI Alliance

### For Production

1. ✅ Deploy to mainnet
2. ✅ Add more price sources (Blur, LooksRare)
3. ✅ Expand MeTTa knowledge
4. ✅ Build analytics dashboard
5. ✅ Add monitoring/alerting

### For Development

1. ✅ Read [ASI_INTEGRATION_SUMMARY.md](./ASI_INTEGRATION_SUMMARY.md)
2. ✅ Study agent code
3. ✅ Learn MeTTa syntax
4. ✅ Explore Fetch.ai docs
5. ✅ Join ASI community

---

## 🆘 Getting Help

### Documentation
- [README.md](./README.md) - Complete reference
- [QUICKSTART.md](./QUICKSTART.md) - Fast setup
- [ASI_INTEGRATION_SUMMARY.md](./ASI_INTEGRATION_SUMMARY.md) - Technical details
- [HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md) - Submission guide

### External Resources
- [Fetch.ai Docs](https://innovationlab.fetch.ai/resources/docs/intro)
- [MeTTa Tutorial](https://metta-lang.dev/docs/learn/tutorials/python_use/metta_python_basics.html)
- [Agentverse](https://agentverse.ai/)
- [ASI:One](https://asi1.ai/)

### Community
- GitHub Issues
- Discord
- Twitter

---

## ✅ Completion Checklist

Before you're done, verify:

- [ ] All 4 agents start without errors
- [ ] Agents are deployed on Agentverse
- [ ] Frontend shows "Ask AI" button
- [ ] Chat widget opens and responds
- [ ] Market analysis works
- [ ] Portfolio advice works
- [ ] Floor price fetching works
- [ ] MeTTa knowledge base is loaded
- [ ] Environment variables are set
- [ ] Documentation is read

**Once all checked, you're ready! 🎉**

---

## 🏆 You're Ready for the Hackathon!

Your MCG.FUN project now includes:
- ✅ 4 autonomous AI agents
- ✅ MeTTa knowledge graphs
- ✅ ASI:One chat protocol
- ✅ Agentverse deployment
- ✅ Real-world utility
- ✅ Beautiful UX

**Good luck with your submission!** 🚀

---

*Need help? Check the [troubleshooting](#-troubleshooting) section or open a GitHub issue.*

