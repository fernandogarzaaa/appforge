# Quick Start Guide - Queue Infrastructure

## Prerequisites Check

Before starting, verify you have these installed:

```powershell
# Check Node.js (need v18+)
node --version

# Check npm
npm --version

# Check if Redis is available (any method)
# Option 1: Docker
docker --version

# Option 2: WSL2
wsl redis-server --version

# Option 3: Native Windows
redis-server --version

# Check MongoDB
mongod --version
```

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `bullmq` - Queue library
- `ioredis` - Redis client
- `@bull-board/api` - Queue dashboard
- `@bull-board/express` - Bull Board Express adapter

## Step 2: Start Redis

### Option A: Docker (Recommended)
```powershell
.\setup-redis.ps1
```

Or manually:
```bash
docker run -d --name appforge-redis -p 6379:6379 redis:7-alpine
```

### Option B: WSL2
```bash
wsl
sudo service redis-server start
```

### Option C: Native Windows (Chocolatey)
```powershell
choco install redis-64
redis-server
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

## Step 3: Start MongoDB

### Docker
```bash
docker run -d --name appforge-mongo -p 27017:27017 mongo:7
```

### Or use existing MongoDB
Just ensure it's running on `mongodb://localhost:27017`

## Step 4: Configure Environment

Copy and update `.env` file:

```bash
cp .env.example .env
```

Required variables:
```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MongoDB
MONGODB_URI=mongodb://localhost:27017/appforge

# Workers
WORKER_CONCURRENCY=5

# Server
PORT=5000
NODE_ENV=development
```

## Step 5: Start the Server

```bash
npm run dev
```

You should see:
```
✓ Redis client connected
✓ MongoDB connected: mongodb://localhost:27017/appforge
✓ Custom plugins loaded
✓ Batch worker started (concurrency: 5)
✓ Scheduled jobs worker started
✓ Queue monitoring dashboard enabled at /admin/queues
🚀 AppForge Backend Server
📍 Running on http://localhost:5000
🌍 Environment: development
```

## Step 6: Test the Infrastructure

### Test 1: Run Test Script
```bash
node scripts/test-queue.js
```

This will:
1. Create a batch job
2. Register a webhook
3. Schedule recurring and delayed jobs
4. Verify MongoDB and Redis connectivity

### Test 2: Open Bull Board
Navigate to: http://localhost:5000/admin/queues

You should see:
- Jobs queue dashboard
- Waiting/Active/Completed/Failed tabs
- Real-time job counts

### Test 3: Create a Job via API

```bash
# First, get a JWT token by logging in
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "yourpassword"}'

# Then create a job
curl -X POST http://localhost:5000/api/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quantum-analysis",
    "payload": {
      "codeSnippet": "function test() { return 42; }"
    }
  }'
```

### Test 4: Check Job Status

```bash
curl http://localhost:5000/api/batch/:jobId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 7: Verify Everything Works

✅ **Redis Connected**: Check server logs for "✓ Redis client connected"  
✅ **MongoDB Connected**: Check server logs for "✓ MongoDB connected"  
✅ **Workers Running**: Check logs for "✓ Batch worker started"  
✅ **Bull Board**: Access http://localhost:5000/admin/queues  
✅ **Jobs Processing**: Create job and watch progress in Bull Board  

## Common Issues & Solutions

### Issue: "Redis connection refused"

**Solution:**
```bash
# Check Redis is running
redis-cli ping

# If not, start Redis
docker start appforge-redis
# OR
wsl sudo service redis-server start
```

### Issue: "MongoDB connection failed"

**Solution:**
```bash
# Check MongoDB is running
mongosh --eval "db.stats()"

# If not, start MongoDB
docker start appforge-mongo
# OR
sudo systemctl start mongod
```

### Issue: "Jobs not processing"

**Solution:**
1. Check `WORKER_CONCURRENCY > 0` in `.env`
2. Restart server: `npm run dev`
3. Check worker logs for errors
4. Verify Redis connection

### Issue: "Bull Board not loading"

**Solution:**
1. Ensure server is running: `npm run dev`
2. Navigate to http://localhost:5000/admin/queues (not /admin/queue)
3. Check browser console for errors
4. Verify Redis is connected

### Issue: "Webhooks not delivering"

**Solution:**
1. Check webhook URL is accessible
2. Verify webhook events match job type
3. Check `isActive: true` in webhook document
4. Look at `lastError` field in MongoDB

## What's Next?

### 1. Create More Job Types

Edit `backend/src/workers/batchWorker.js`:

```javascript
const processors = {
  'your-custom-job': async (job) => {
    const { params } = job.data;
    
    // Your logic here
    await job.updateProgress(50);
    
    return { success: true, result: 'Done!' };
  },
};
```

### 2. Add More Scheduled Jobs

Edit `backend/src/workers/scheduledWorker.js`:

```javascript
const scheduledProcessors = {
  'your-cron-job': async (job) => {
    console.log('Running your cron job...');
    
    // Your logic here
    
    return { completed: true };
  },
};
```

### 3. Customize Webhook Events

Emit custom events from anywhere:

```javascript
import { emitWebhook } from './services/webhookService.js';

await emitWebhook('user.signup', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});
```

### 4. Monitor Production

Add health checks:

```javascript
app.get('/health', async (req, res) => {
  const queue = getQueue();
  const waiting = await queue.getWaitingCount();
  const active = await queue.getActiveCount();
  
  res.json({
    status: 'ok',
    redis: 'connected',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    queue: { waiting, active },
  });
});
```

### 5. Scale for Production

See [PRODUCTION_QUEUE_INFRASTRUCTURE.md](PRODUCTION_QUEUE_INFRASTRUCTURE.md) for:
- AWS ElastiCache setup
- Worker process separation
- PM2 configuration
- Monitoring best practices

## Support

If you encounter issues:
1. Check server logs: `npm run dev`
2. Check Redis logs: `docker logs appforge-redis`
3. Check MongoDB logs: `docker logs appforge-mongo`
4. Review [PRODUCTION_QUEUE_INFRASTRUCTURE.md](PRODUCTION_QUEUE_INFRASTRUCTURE.md)
5. Run test script: `node scripts/test-queue.js`

---

**Happy queue processing! 🚀**
