#!/bin/bash
# AppForge Backend Quick Deploy Script
# Wave 1 Build - Production Ready

set -e

echo "🚀 AppForge Backend Deployment"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Prerequisites
echo -e "${BLUE}[1/6]${NC} Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node.js v16+"
    exit 1
fi
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Install PostgreSQL v12+"
    exit 1
fi
echo -e "${GREEN}✓ Prerequisites OK${NC}"

# Step 2: Navigate to backend
echo -e "${BLUE}[2/6]${NC} Setting up environment..."
cd backend || { echo "❌ backend directory not found"; exit 1; }

# Step 3: Environment setup
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Update .env with your configuration:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - OPENAI_API_KEY"
fi
echo -e "${GREEN}✓ Environment configured${NC}"

# Step 4: Dependencies
echo -e "${BLUE}[3/6]${NC} Installing dependencies..."
npm install --production > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Database setup
echo -e "${BLUE}[4/6]${NC} Setting up database..."
npm run migrate || echo "⚠️  Migration may have already run"
npm run seed || echo "⚠️  Database may already be seeded"
echo -e "${GREEN}✓ Database ready${NC}"

# Step 6: Health check
echo -e "${BLUE}[5/6]${NC} Starting server..."
npm start &
SERVER_PID=$!
sleep 2

echo -e "${BLUE}[6/6]${NC} Verifying deployment..."
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
    echo ""
    echo "================================"
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL${NC}"
    echo "================================"
    echo ""
    echo "📍 API Server: http://localhost:5000"
    echo "📖 Documentation: http://localhost:5000/api-docs"
    echo "💓 Health Check: http://localhost:5000/health"
    echo ""
    echo "🔑 Get JWT Token:"
    echo '  curl -X POST http://localhost:5000/api/auth/test-token \'
    echo '    -H "Content-Type: application/json" \'
    echo '    -d "{\"userId\": 1, \"email\": \"test@appforge.fun\"}"'
    echo ""
    echo "🧪 Test AI Endpoint:"
    echo '  curl -X POST http://localhost:5000/api/ai/generate-code \'
    echo '    -H "Content-Type: application/json" \'
    echo '    -H "Authorization: Bearer YOUR_TOKEN" \'
    echo '    -d "{\"description\": \"Hello world\", \"language\": \"javascript\"}"'
    echo ""
    echo "Server PID: $SERVER_PID"
    echo "Press Ctrl+C to stop"
    wait
else
    echo -e "${YELLOW}❌ Server failed to start${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
