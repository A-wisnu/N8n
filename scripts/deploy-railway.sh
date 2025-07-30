#!/bin/bash

# Masjid AI Agent - Railway Deployment Script
# This script helps deploy the n8n workflow and WhatsApp bot to Railway

set -e

echo "🚀 Starting Railway deployment for Masjid AI Agent..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI is not installed${NC}"
    echo -e "${YELLOW}Please install it from: https://docs.railway.app/develop/cli${NC}"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to Railway${NC}"
    echo -e "${BLUE}Please run: railway login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI is installed and you are logged in${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo -e "${BLUE}Please copy .env.example to .env and configure your variables${NC}"
    echo -e "${BLUE}cp .env.example .env${NC}"
    exit 1
fi

# Load environment variables from .env
source .env

# Validate required environment variables
required_vars=("OPENROUTER_API_KEY" "ADMIN_NUMBERS")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    echo -e "${BLUE}Please configure these variables in your .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Create or connect to Railway project
echo -e "${BLUE}🔗 Setting up Railway project...${NC}"

if [ ! -f ".railway" ]; then
    echo -e "${YELLOW}Creating new Railway project...${NC}"
    railway login
    railway init
else
    echo -e "${GREEN}✅ Railway project already exists${NC}"
fi

# Deploy n8n service
echo -e "${BLUE}🚀 Deploying n8n workflow service...${NC}"

# Set environment variables for n8n
echo -e "${YELLOW}Setting n8n environment variables...${NC}"

railway variables set N8N_BASIC_AUTH_ACTIVE=false
railway variables set N8N_HOST=0.0.0.0
railway variables set N8N_PORT=5678
railway variables set N8N_PROTOCOL=https
railway variables set N8N_EDITOR_BASE_URL=/
railway variables set N8N_DISABLE_UI=false
railway variables set N8N_METRICS=false
railway variables set EXECUTIONS_PROCESS=main
railway variables set EXECUTIONS_MODE=regular
railway variables set N8N_LOG_LEVEL=info
railway variables set N8N_LOG_OUTPUT=console
railway variables set GENERIC_TIMEZONE=Asia/Jakarta

# Set API keys and configuration
railway variables set OPENROUTER_API_KEY="$OPENROUTER_API_KEY"
railway variables set OPENROUTER_MODEL="${OPENROUTER_MODEL:-z-ai/glm-4.5-air:free}"
railway variables set PRAYER_API_BASE="${PRAYER_API_BASE:-https://api.aladhan.com/v1}"
railway variables set MYQURAN_API_BASE="${MYQURAN_API_BASE:-https://api.myquran.com/v2}"
railway variables set GOOGLE_SHEETS_API_KEY="$GOOGLE_SHEETS_API_KEY"
railway variables set GOOGLE_SHEETS_ID="$GOOGLE_SHEETS_ID"
railway variables set DEFAULT_CITY="${DEFAULT_CITY:-Jakarta}"
railway variables set DEFAULT_CITY_ID="${DEFAULT_CITY_ID:-1301}"
railway variables set ADMIN_NUMBERS="$ADMIN_NUMBERS"

echo -e "${GREEN}✅ Environment variables set${NC}"

# Deploy the service
echo -e "${BLUE}🚀 Deploying to Railway...${NC}"
railway up --detach

# Get the deployment URL
echo -e "${BLUE}🔍 Getting deployment URL...${NC}"
RAILWAY_URL=$(railway domain)

if [ -n "$RAILWAY_URL" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${BLUE}🌐 n8n URL: https://$RAILWAY_URL${NC}"
    echo -e "${BLUE}📡 Webhook URL: https://$RAILWAY_URL/webhook/wa${NC}"
    
    # Update local .env with the new webhook URL
    if [ -f ".env" ]; then
        sed -i.bak "s|N8N_WEBHOOK_URL=.*|N8N_WEBHOOK_URL=https://$RAILWAY_URL/webhook/wa|" .env
        echo -e "${GREEN}✅ Updated .env file with new webhook URL${NC}"
    fi
    
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "${BLUE}1. Update your WhatsApp bot configuration with the new webhook URL${NC}"
    echo -e "${BLUE}2. Test the webhook: curl -X POST https://$RAILWAY_URL/webhook/wa -H 'Content-Type: application/json' -d '{\"test\": \"message\"}'${NC}"
    echo -e "${BLUE}3. Start your WhatsApp bot locally or deploy it separately${NC}"
    
else
    echo -e "${RED}❌ Could not retrieve deployment URL${NC}"
    echo -e "${YELLOW}Please check Railway dashboard for deployment status${NC}"
fi

echo -e "${GREEN}🎉 Railway deployment script completed!${NC}"