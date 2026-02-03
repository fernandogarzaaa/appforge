#!/bin/bash
set -e

echo "🔧 Setting up production environment"

# Generate secure secrets
echo "🔐 Generating secure secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MONGO_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
REDIS_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Create .env.production file
cat > .env.production << EOF
# Auto-generated production environment variables
# Generated on: $(date)

# Server Configuration
NODE_ENV=production
PORT=5000
BACKEND_PORT=5000
FRONTEND_PORT=5173
WS_PORT=5001

# URLs (UPDATE THESE)
API_URL=https://api.yourdomain.com/api
FRONTEND_URL=https://yourdomain.com
WS_URL=wss://api.yourdomain.com

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Encryption Configuration
ENCRYPTION_KEY=$ENCRYPTION_KEY

# MongoDB Configuration
MONGO_USER=admin
MONGO_PASSWORD=$MONGO_PASSWORD
MONGO_PORT=27017

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
EOF

echo "✅ Generated .env.production with secure secrets"
echo ""
echo "⚠️  IMPORTANT: Update the following in .env.production:"
echo "   - API_URL"
echo "   - FRONTEND_URL"
echo "   - WS_URL"
echo "   - CORS_ORIGIN"
echo ""
echo "📝 Secrets have been generated securely"
echo "🔒 Keep .env.production file secure and never commit it to version control"
