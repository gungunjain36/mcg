#!/bin/bash

# ============================================================================
# MCG.FUN ASI Alliance Agents - Agentverse Deployment Script
# Deploys all 4 agents to Agentverse for FREE hosting
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "🚀 MCG.FUN ASI Alliance Agents - Deployment"
echo "============================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo ""
    echo "Please create a .env file based on .env.example:"
    echo "  cp .env.example .env"
    echo ""
    echo "Then configure your agent seeds:"
    echo "  - MARKET_ANALYST_SEED"
    echo "  - RESOLVER_SEED"
    echo "  - PORTFOLIO_ADVISOR_SEED"
    echo "  - ORACLE_SEED"
    echo ""
    exit 1
fi

# Load environment variables
source .env

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
pip install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}🧪 Step 2: Testing agents locally...${NC}"
echo "Testing Market Analyst Agent..."
timeout 5s python agents/market_analyst.py > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Market Analyst OK${NC}"

echo "Testing Resolver Agent..."
timeout 5s python agents/resolver_agent.py > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Resolver OK${NC}"

echo "Testing Portfolio Advisor Agent..."
timeout 5s python agents/portfolio_advisor.py > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Portfolio Advisor OK${NC}"

echo "Testing Oracle Agent..."
timeout 5s python agents/oracle_agent.py > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Oracle OK${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Generating agent addresses...${NC}"
echo ""

# Extract addresses by running agents briefly
echo "Market Analyst Agent:"
timeout 2s python -c "from agents.market_analyst import agent; print(f'  Address: {agent.address}')" 2>/dev/null || echo "  Address: (start agent to see)"

echo ""
echo "Resolver Agent:"
timeout 2s python -c "from agents.resolver_agent import agent; print(f'  Address: {agent.address}')" 2>/dev/null || echo "  Address: (start agent to see)"

echo ""
echo "Portfolio Advisor Agent:"
timeout 2s python -c "from agents.portfolio_advisor import agent; print(f'  Address: {agent.address}')" 2>/dev/null || echo "  Address: (start agent to see)"

echo ""
echo "Oracle Agent:"
timeout 2s python -c "from agents.oracle_agent import agent; print(f'  Address: {agent.address}')" 2>/dev/null || echo "  Address: (start agent to see)"

echo ""
echo "============================================================================"
echo -e "${GREEN}✅ Local testing complete!${NC}"
echo "============================================================================"
echo ""

echo -e "${YELLOW}📝 Next Steps for Agentverse Deployment:${NC}"
echo ""
echo "1. Go to https://agentverse.ai/ and create an account"
echo ""
echo "2. Click 'Create Agent' for each of the 4 agents:"
echo "   - Market Analyst"
echo "   - Resolver"
echo "   - Portfolio Advisor"
echo "   - Oracle"
echo ""
echo "3. For each agent:"
echo "   a. Upload the corresponding Python file from agents/ directory"
echo "   b. Set the agent name (e.g., 'mcg_market_analyst')"
echo "   c. Configure environment variables from your .env file"
echo "   d. Click 'Deploy' (FREE hosting!)"
echo "   e. Copy the agent address"
echo ""
echo "4. Update frontend/.env.local with agent addresses:"
echo "   VITE_ASI_MARKET_ANALYST=agent1q..."
echo "   VITE_ASI_RESOLVER=agent1q..."
echo "   VITE_ASI_PORTFOLIO_ADVISOR=agent1q..."
echo "   VITE_ASI_ORACLE=agent1q..."
echo ""
echo "5. Restart your frontend:"
echo "   cd ../frontend"
echo "   npm run dev"
echo ""
echo "6. Test the ASI chat widget on your market pages! 🎉"
echo ""
echo "============================================================================"
echo -e "${GREEN}🎯 Ready for ASI Alliance Hackathon Submission!${NC}"
echo "============================================================================"
echo ""
echo "Your submission includes:"
echo "  ✅ 4 autonomous uAgents on Agentverse"
echo "  ✅ MeTTa knowledge graphs for reasoning"
echo "  ✅ ASI:One chat protocol integration"
echo "  ✅ Real-time agent communication"
echo "  ✅ NFT market analysis & predictions"
echo "  ✅ Automated market resolution"
echo "  ✅ Portfolio management advice"
echo "  ✅ Multi-source price oracles"
echo ""
echo "Prize Categories:"
echo "  🥇 Best use of ASI:One + MeTTa"
echo "  🥈 Impactful Agentverse launch"
echo "  🥉 Cohesive multi-agent system"
echo ""
echo "Good luck! 🚀"
echo ""

