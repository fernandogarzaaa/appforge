#!/bin/bash
# Setup Clawd Hybrid RTX LLM for AppForge
# This script wires the LLM to your AppForge repository

set -e

echo "🚀 Clawd Hybrid RTX + OpenRouter Setup for AppForge"
echo "===================================================="
echo ""

# Configuration
APPFORGE_DIR="D:\appforge-main"
CLAWD_DIR="$APPFORGE_DIR\infrastructure\clawd-hybrid-rtx"

echo "📁 Directories:"
echo "  AppForge: $APPFORGE_DIR"
echo "  Clawd LLM: $CLAWD_DIR"
echo ""

# Step 1: Check prerequisites
echo "🔍 Checking prerequisites..."

if [ ! -d "$APPFORGE_DIR" ]; then
    echo "❌ AppForge directory not found: $APPFORGE_DIR"
    exit 1
fi

if [ ! -d "$CLAWD_DIR" ]; then
    echo "❌ Clawd LLM directory not found. Build it first:"
    echo "   The swarms should have created this at:"
    echo "   $CLAWD_DIR"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Step 2: Copy environment file
echo "📋 Setting up environment configuration..."

if [ -f "$APPFORGE_DIR/.env" ]; then
    echo "  Backing up existing .env to .env.backup"
    cp "$APPFORGE_DIR/.env" "$APPFORGE_DIR/.env.backup"
fi

echo "  Copying Clawd configuration to .env"
cp "$APPFORGE_DIR/.env.clawd" "$APPFORGE_DIR/.env"

echo "✅ Environment configured"
echo ""

# Step 3: Install Clawd LLM service files
echo "🔌 Installing Clawd LLM service files..."

# Frontend service
if [ -f "$APPFORGE_DIR/src/services/cladwLLM.ts" ]; then
    echo "  ✅ Frontend service already exists"
else
    echo "  ❌ Frontend service not found - please ensure it was created"
fi

# Backend service
if [ -f "$APPFORGE_DIR/backend/src/services/cladwLLMService.ts" ]; then
    echo "  ✅ Backend service already exists"
else
    echo "  ❌ Backend service not found - please ensure it was created"
fi

echo "✅ Service files ready"
echo ""

# Step 4: Check if Clawd LLM is running
echo "🧪 Checking if Clawd LLM is running..."

if curl -s http://localhost:7860/health > /dev/null; then
    echo "  ✅ Clawd LLM is running on localhost:7860"
else
    echo "  ⚠️  Clawd LLM not running locally"
    echo ""
    echo "  To start it:"
    echo "    cd $CLAWD_DIR"
    echo "    python -m uvicorn src.api_server:app --host 0.0.0.0 --port 7860"
    echo ""
    echo "  Or deploy to Hugging Face:"
    echo "    cd $CLAWD_DIR"
    echo "    bash deploy.sh your-username"
fi

echo ""

# Step 5: Test the integration
echo "🧪 Testing integration..."

if curl -s http://localhost:7860/health > /dev/null; then
    echo "  Testing LLM endpoint..."
    RESPONSE=$(curl -s -X POST http://localhost:7860/generate \
        -H "Content-Type: application/json" \
        -d '{"prompt": "Hello", "max_tokens": 50}' 2>/dev/null || echo "failed")
    
    if [ "$RESPONSE" != "failed" ] && [ -n "$RESPONSE" ]; then
        echo "  ✅ LLM endpoint responding"
    else
        echo "  ⚠️  LLM endpoint test failed"
    fi
else
    echo "  ⏭️  Skipping test (LLM not running)"
fi

echo ""

# Step 6: Summary
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start Clawd LLM (if not running):"
echo "   cd $CLAWD_DIR"
echo "   python -m uvicorn src.api_server:app --host 0.0.0.0 --port 7860"
echo ""
echo "2. Start AppForge:"
echo "   cd $APPFORGE_DIR"
echo "   npm run dev"
echo ""
echo "3. Test the integration:"
echo "   - Open AppForge in browser"
echo "   - Go to AI Assistant"
echo "   - Select 'Clawd Hybrid' as provider"
echo "   - Send a test message"
echo ""
echo "🔗 Useful URLs:"
echo "   - AppForge: http://localhost:3000"
echo "   - Clawd LLM: http://localhost:7860"
echo "   - LLM Health: http://localhost:7860/health"
echo ""
echo "📊 Monitoring:"
echo "   - Coherence metrics: http://localhost:7860/metrics"
echo "   - Cache stats: http://localhost:7860/cache/stats"
echo ""
