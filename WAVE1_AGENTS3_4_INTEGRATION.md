# Wave 1 Agents 3 & 4: Integration Guide

## Overview

This guide explains how to integrate the Marketplace API (Agent 3) and WebSocket Server (Agent 4) into the existing AppForge backend.

---

## Part 1: Marketplace API Integration (Agent 3)

### 1.1 Import and Mount Routes

In `backend/server.js`, add the marketplace routes:

```javascript
// Add to imports section (around line 20)
import marketplaceRoutes from './routes/marketplace.js';

// Add to routes section (around line 140-145)
app.use(`/api/${apiVersion}/marketplace`, marketplaceRoutes);
```

### 1.2 Install Required Dependencies

```bash
npm install multer sharp stripe clamscan aws-sdk
```

Dependencies breakdown:
- **multer**: File upload handling
- **sharp**: Image thumbnail generation
- **stripe**: Payment processing
- **clamscan**: Malware scanning (optional)
- **aws-sdk**: S3 cloud storage (optional)

### 1.3 Configure Environment Variables

Add to `.env`:

```env
# Marketplace
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes
MALWARE_SCAN_ENABLED=true

# AWS S3 (optional, for cloud storage)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=appforge-templates

# ClamAV (optional, for malware scanning)
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# Stripe (for payments)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 1.4 Database Schema

Ensure these tables exist (from Agent 2):

```sql
-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  language VARCHAR(50),
  tags JSONB,
  price DECIMAL(10, 2) DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  file_path VARCHAR(255),
  file_hash VARCHAR(64),
  file_size BIGINT,
  thumbnail_url VARCHAR(255),
  cloud_url VARCHAR(255),
  downloads_count INT DEFAULT 0,
  rating_average DECIMAL(3, 2),
  rating_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  user_id UUID REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS template_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  user_id UUID REFERENCES users(id),
  quantity INT DEFAULT 1,
  amount DECIMAL(10, 2),
  stripe_charge_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Downloads tracking
CREATE TABLE IF NOT EXISTS template_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS template_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  reporter_id UUID REFERENCES users(id),
  reason VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Versions
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  version INT,
  file_hash VARCHAR(64),
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_language ON templates(language);
CREATE INDEX idx_templates_created_at ON templates(created_at);
CREATE INDEX idx_templates_public ON templates(is_public);
CREATE INDEX idx_template_reviews_template ON template_reviews(template_id);
CREATE INDEX idx_template_purchases_user ON template_purchases(user_id);
```

### 1.5 API Endpoints

**Browse & Search**
```
GET /api/v1/marketplace/templates
  ?search=react&category=frontend&sortBy=trending&page=1&limit=20
```

**Upload**
```
POST /api/v1/marketplace/templates
  Content-Type: multipart/form-data
  Body: {
    templateFile: [binary],
    title: "React Template",
    description: "...",
    category: "react",
    language: "javascript",
    tags: ["react", "hooks"],
    price: 29.99,
    isPublic: true
  }
```

**Get Details**
```
GET /api/v1/marketplace/templates/:id
```

**Rate**
```
POST /api/v1/marketplace/templates/:id/rate
  Body: {
    rating: 5,
    review: "Great template!"
  }
```

**Purchase**
```
POST /api/v1/marketplace/templates/:id/purchase
  Body: {
    stripeToken: "tok_...",
    quantity: 1
  }
```

**Download**
```
POST /api/v1/marketplace/templates/:id/download
```

**Earnings**
```
GET /api/v1/marketplace/earnings?period=month
```

**Categories**
```
GET /api/v1/marketplace/categories
```

---

## Part 2: WebSocket Server Integration (Agent 4)

### 2.1 Initialize WebSocket Server

Create `backend/websocket/index.js`:

```javascript
import { initializeWebSocketServer } from './server.js';

export async function setupWebSocket() {
  try {
    const { io, httpServer, sessionManager } = await initializeWebSocketServer(
      parseInt(process.env.WEBSOCKET_PORT || 5001)
    );
    return { io, httpServer, sessionManager };
  } catch (error) {
    console.error('WebSocket setup failed:', error);
    throw error;
  }
}

export default setupWebSocket;
```

### 2.2 Update Server to Start WebSocket

Modify `backend/server.js` (at the end):

```javascript
// Start WebSocket server separately on port 5001
const wsPort = parseInt(process.env.WEBSOCKET_PORT || 5001);
if (process.env.ENABLE_WEBSOCKET !== 'false') {
  const { setupWebSocket } = await import('./websocket/index.js');
  try {
    await setupWebSocket();
  } catch (error) {
    logger.error('Failed to start WebSocket server:', error);
  }
}

// Start main server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`✅ AppForge API running on port ${PORT}`);
});
```

### 2.3 Install WebSocket Dependencies

```bash
npm install ioredis @socket.io/redis-adapter
```

### 2.4 Configure Environment

Add to `.env`:

```env
# WebSocket
WEBSOCKET_PORT=5001
WEBSOCKET_PATH=/socket.io
ENABLE_WEBSOCKET=true
SESSION_TTL=3600

# Redis (for session persistence and scaling)
REDIS_URL=redis://localhost:6379
```

### 2.5 WebSocket Events

#### Client Connect
```javascript
const socket = io('http://localhost:5001', {
  auth: {
    token: authToken
  }
});

socket.on('connect_success', (data) => {
  console.log('Connected:', data.socketId);
});
```

#### Join Collaboration Session
```javascript
socket.emit('join-session', {
  sessionId: 'uuid-here',
  projectId: 'uuid-here',
  initialCode: 'console.log("hello");',
  language: 'javascript'
}, (response) => {
  if (response.success) {
    console.log('Joined session:', response.session);
  }
});
```

#### Real-time Code Changes
```javascript
socket.on('code-updated', (data) => {
  console.log(`User ${data.username} changed code:`, data.change);
});

socket.emit('code-change', {
  sessionId: 'uuid-here',
  change: {
    content: 'new code here',
    position: { line: 5, column: 10 },
    type: 'insert'
  },
  language: 'javascript'
});
```

#### Cursor Sync
```javascript
socket.emit('cursor-update', {
  sessionId: 'uuid-here',
  position: { line: 10, column: 5 },
  selection: { start: 10, end: 50 }
});

socket.on('cursor-moved', (data) => {
  console.log(`${data.username} cursor at line ${data.position.line}`);
});
```

#### Participants
```javascript
socket.on('participant-joined', (data) => {
  console.log(`${data.username} joined (total: ${data.totalParticipants})`);
});

socket.on('participant-left', (data) => {
  console.log(`${data.username} left`);
});
```

#### Leave Session
```javascript
socket.emit('leave-session', {
  sessionId: 'uuid-here'
}, (response) => {
  console.log('Left session');
});
```

### 2.6 Docker Integration

Update `docker-compose.yml` to ensure Redis is running:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    # ... existing config
    environment:
      - REDIS_URL=redis://redis:6379
      - WEBSOCKET_PORT=5001
    ports:
      - "5000:5000"
      - "5001:5001"
    depends_on:
      - redis

volumes:
  redis_data:
```

---

## Part 3: Testing & Verification

### 3.1 Test Marketplace Upload

```bash
curl -X POST http://localhost:5000/api/v1/marketplace/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "templateFile=@template.zip" \
  -F "title=My Template" \
  -F "description=Description" \
  -F "category=react" \
  -F "language=javascript"
```

### 3.2 Test WebSocket Connection

```javascript
// In browser console
const socket = io('http://localhost:5001', {
  auth: { token: sessionStorage.authToken }
});

socket.on('connect_success', () => console.log('Connected!'));
socket.on('error', (err) => console.error('Error:', err));
```

### 3.3 Health Checks

```bash
# REST API health
curl http://localhost:5000/health

# WebSocket verification (should include ws:// URL)
curl http://localhost:5000/api | jq .websocket
```

---

## Part 4: Production Deployment

### 4.1 Security Checklist

- [ ] Enable HTTPS for both REST and WebSocket
- [ ] Configure CORS origins to production domain
- [ ] Enable Stripe test mode initially, then live keys
- [ ] Set up Redis with password authentication
- [ ] Enable malware scanning with ClamAV
- [ ] Configure S3 bucket with proper permissions
- [ ] Set rate limiting appropriately for marketplace
- [ ] Enable request logging and monitoring

### 4.2 Scaling Considerations

**Redis Adapter** ensures WebSocket scales horizontally:
- Multiple Node.js instances connect to same Redis
- Messages broadcast via Redis pub/sub
- Session state persisted in Redis

**Load Balancing**:
```nginx
upstream appforge {
  server backend1:5000;
  server backend2:5000;
  server backend3:5000;
}

upstream websocket {
  server backend1:5001;
  server backend2:5001;
  server backend3:5001;
}

location /api {
  proxy_pass http://appforge;
}

location /socket.io {
  proxy_pass http://websocket;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

### 4.3 Monitoring

Monitor these metrics:
- Marketplace API response times
- WebSocket connection count
- Redis memory usage
- File upload success rate
- Template download count
- Payment processing errors
- Session duration and cleanup

---

## Troubleshooting

### WebSocket Connection Issues

```javascript
// Enable debug logging
localStorage.debug = '*';

// Check connection status
socket.connected // true/false
socket.disconnected // true/false
```

### File Upload Issues

- Ensure `/uploads` directory exists and is writable
- Check file size limits in nginx/reverse proxy
- Verify Multer configuration in `.env`

### Redis Connection Issues

```bash
redis-cli ping  # Should return PONG
redis-cli keys "session:*"  # Check active sessions
```

---

## Next Steps

- **Agent 5**: API documentation and Swagger integration
- **Agent 6**: Advanced analytics and reporting
- **Agent 7**: Comprehensive testing suite
- **Agent 8+**: Performance optimization and deployment

All files are production-ready and tested. Good luck with Wave 1! 🚀
