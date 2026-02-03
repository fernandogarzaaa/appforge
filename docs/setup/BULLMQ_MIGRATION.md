# BullMQ + Redis Migration Complete ✅

The batch queue system has been migrated from in-memory to **BullMQ with Redis persistence**.

## What Changed

### 1. **Dependencies Added**
- `bullmq` - Modern Redis-based queue library
- `ioredis` - High-performance Redis client

### 2. **New Files Created**
- `backend/src/config/redis.js` - Redis connection configuration
- `backend/src/workers/batchWorker.js` - Background worker to process jobs
- `backend/setup-redis.ps1` - PowerShell script to start Redis quickly
- `backend/REDIS_SETUP.md` - Comprehensive Redis setup guide

### 3. **Files Modified**
- `backend/src/services/batchQueue.js` - Replaced in-memory Map with BullMQ Queue
- `backend/src/routes/batchRoutes.js` - Updated to async/await for Redis operations
- `backend/src/graphql/index.js` - Updated batch mutation to async
- `backend/src/server.js` - Added worker startup and graceful shutdown
- `backend/.env.example` - Added Redis configuration variables

## Production Features

### ✅ **Job Persistence**
Jobs survive server restarts - stored in Redis, not memory

### ✅ **Automatic Retry**
Failed jobs retry 3 times with exponential backoff (2s, 4s, 8s)

### ✅ **Priority Queue**
Higher priority jobs processed first

### ✅ **Concurrency Control**
Process 5 jobs simultaneously (configurable via `WORKER_CONCURRENCY`)

### ✅ **Rate Limiting**
Max 100 jobs per minute to prevent resource exhaustion

### ✅ **Progress Tracking**
Real-time job progress updates (0% → 100%)

### ✅ **Job Cleanup**
Auto-remove completed jobs after 24 hours, keep last 1000

### ✅ **Multiple Job Types**
- `quantum-analysis` - AI code analysis
- `security-scan` - Vulnerability detection
- `code-review` - Automated code review
- `custom` - Generic processing

## Quick Start

### 1. **Start Redis** (choose one method):

**Option A - Docker (recommended):**
```powershell
.\setup-redis.ps1
```

**Option B - Manual Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option C - WSL2:**
```bash
wsl
sudo service redis-server start
```

### 2. **Update Environment**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
WORKER_CONCURRENCY=5
```

### 3. **Start Server**
```bash
cd backend
npm run dev
```

You should see:
```
✓ Redis client connected
✓ Batch worker started (concurrency: 5)
🚀 Server running on port 5000
```

## Testing

### Create a Job
```bash
curl -X POST http://localhost:5000/api/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quantum-analysis",
    "payload": {
      "codeSnippet": "function test() { return 42; }",
      "priority": 5
    }
  }'
```

Response:
```json
{
  "id": "quantum-analysis_user123_1738568400000",
  "type": "quantum-analysis",
  "status": "waiting",
  "progress": 0,
  "createdAt": "2026-02-03T12:00:00.000Z"
}
```

### Check Job Status
```bash
curl http://localhost:5000/api/batch/:jobId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "id": "quantum-analysis_user123_1738568400000",
  "type": "quantum-analysis",
  "status": "completed",
  "progress": 100,
  "result": {
    "message": "Quantum analysis completed",
    "analyzed": 30,
    "findings": [...]
  }
}
```

### List All Jobs
```bash
curl http://localhost:5000/api/batch \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cancel a Job
```bash
curl -X POST http://localhost:5000/api/batch/:jobId/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │─────▶│  API Server │─────▶│    Redis    │
│             │      │  (Express)  │      │   (Queue)   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │                     │
                            │                     │
                            ▼                     ▼
                     ┌─────────────┐      ┌─────────────┐
                     │   Worker    │◀─────│  BullMQ     │
                     │  (Process)  │      │  Consumer   │
                     └─────────────┘      └─────────────┘
```

## Monitoring (Optional)

Install Bull Board for queue dashboard:

```bash
npm install @bull-board/express @bull-board/api
```

Add to `server.js`:
```javascript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueue } from './services/batchQueue.js';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(getQueue())],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Navigate to `http://localhost:5000/admin/queues`

## Production Deployment

### AWS ElastiCache
```env
REDIS_HOST=your-cluster.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### Azure Cache for Redis
```env
REDIS_HOST=your-cache.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-access-key
```

### Redis Cloud
```env
REDIS_HOST=redis-12345.c123.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

## Troubleshooting

**Connection refused:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

**Jobs not processing:**
- Check worker logs: `npm run dev` and look for "[Worker]" messages
- Verify `WORKER_CONCURRENCY > 0` in `.env`
- Restart worker

**Memory issues:**
```bash
# Check Redis memory
redis-cli info memory

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Next Steps

1. ✅ **Redis setup complete** - Queue infrastructure ready
2. 🔜 **Add more job types** - Extend `processors` in `batchWorker.js`
3. 🔜 **Job webhooks** - Notify on completion via webhook service
4. 🔜 **Scheduled jobs** - Use BullMQ repeatable jobs for cron-like tasks
5. 🔜 **Queue monitoring** - Install Bull Board dashboard

---

**Migration Status:** ✅ Complete  
**Breaking Changes:** None - API remains compatible  
**Performance Impact:** Improved - jobs persist across restarts, better concurrency
