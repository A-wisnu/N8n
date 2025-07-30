#!/bin/bash

# Masjid AI Agent - Local Development Setup Script
# This script sets up the local development environment

set -e

echo "🏠 Setting up Masjid AI Agent for local development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js from: https://nodejs.org/${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old${NC}"
    echo -e "${YELLOW}Please install Node.js version $REQUIRED_VERSION or higher${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version $NODE_VERSION is compatible${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    echo -e "${BLUE}Docker is optional but recommended for running n8n locally${NC}"
    echo -e "${BLUE}Install from: https://docs.docker.com/get-docker/${NC}"
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${BLUE}Please edit .env file and configure your API keys and settings${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p sessions
mkdir -p logs
mkdir -p data

echo -e "${GREEN}✅ Directories created${NC}"

# Check if .env is properly configured
echo -e "${BLUE}🔍 Checking .env configuration...${NC}"

source .env

required_vars=("OPENROUTER_API_KEY" "ADMIN_NUMBERS")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_openrouter_api_key_here" ] || [ "${!var}" = "628123456789,628987654321" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Please configure these variables in your .env file:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    echo -e "${BLUE}Edit .env file and set proper values${NC}"
else
    echo -e "${GREEN}✅ Environment variables are configured${NC}"
fi

# Display next steps
echo -e "${GREEN}🎉 Local setup completed!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo ""
echo -e "${YELLOW}1. Configure your .env file:${NC}"
echo -e "   ${BLUE}nano .env${NC}"
echo ""
echo -e "${YELLOW}2. Start n8n (choose one option):${NC}"
echo -e "   ${BLUE}Option A - Docker: docker-compose up n8n${NC}"
echo -e "   ${BLUE}Option B - Local: npx n8n start${NC}"
echo ""
echo -e "${YELLOW}3. Import the workflow:${NC}"
echo -e "   ${BLUE}- Open n8n at http://localhost:5678${NC}"
echo -e "   ${BLUE}- Import n8n/workflows/wa_ai_agent_flow.json${NC}"
echo ""
echo -e "${YELLOW}4. Test the WhatsApp bot:${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo -e "${YELLOW}5. For production deployment:${NC}"
echo -e "   ${BLUE}./scripts/deploy-railway.sh${NC}"
echo ""
echo -e "${GREEN}📚 Check README.md for detailed instructions${NC}"