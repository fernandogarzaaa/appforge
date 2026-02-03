# Redis Setup for BullMQ

## Local Development

### Windows (using Chocolatey)
```powershell
choco install redis-64
redis-server
```

### Windows (using WSL2)
```bash
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

### macOS
```bash
brew install redis
brew services start redis
```

### Docker (all platforms)
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

## Configuration

Update your `.env` file:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
WORKER_CONCURRENCY=5
```

## Production Setup

### AWS ElastiCache
1. Create Redis cluster in AWS Console
2. Update environment variables:
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

## Verify Connection

```bash
redis-cli ping
# Should return: PONG
```

## Monitoring Queues

Install Bull Board for queue monitoring:
```bash
npm install @bull-board/express @bull-board/api
```

Then add to server.js:
```javascript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(getQueue())],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Navigate to `http://localhost:5000/admin/queues` to view queue dashboard.

## Queue Features

- ✅ **Persistence**: Jobs survive server restarts
- ✅ **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- ✅ **Priority**: Higher priority jobs processed first
- ✅ **Progress Tracking**: Real-time job progress updates
- ✅ **Concurrency**: Process 5 jobs simultaneously (configurable)
- ✅ **Rate Limiting**: Max 100 jobs per minute
- ✅ **Job Cleanup**: Auto-remove completed jobs after 24h

## Testing

Create a batch job:
```bash
curl -X POST http://localhost:5000/api/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quantum-analysis",
    "params": {
      "codeSnippet": "function test() { return 42; }"
    },
    "priority": 5
  }'
```

Check job status:
```bash
curl http://localhost:5000/api/batch/:jobId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

**Connection refused:**
- Ensure Redis is running: `redis-cli ping`
- Check firewall rules
- Verify REDIS_HOST and REDIS_PORT

**Jobs not processing:**
- Check worker logs for errors
- Verify WORKER_CONCURRENCY > 0
- Restart worker: `npm run dev`

**Memory issues:**
- Monitor Redis memory: `redis-cli info memory`
- Adjust job retention in `batchQueue.js`
- Enable Redis eviction policy: `maxmemory-policy allkeys-lru`
