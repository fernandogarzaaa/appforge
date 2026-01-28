# Performance Optimization Guide

Guidelines for optimizing payment processing, API performance, and overall application efficiency.

---

## 📋 Table of Contents

- [Payment Processing Optimization](#payment-processing-optimization)
- [API Performance](#api-performance)
- [Database Optimization](#database-optimization)
- [Frontend Performance](#frontend-performance)
- [Caching Strategies](#caching-strategies)
- [Monitoring Performance](#monitoring-performance)
- [Performance Benchmarks](#performance-benchmarks)

---

## 💳 Payment Processing Optimization

### Invoice Creation Optimization

**Problem:** Creating Xendit invoices takes 500-800ms per request.

**Solution - Async Queue Processing:**

```typescript
// src/lib/invoice-queue.ts

import PQueue from 'p-queue';

class InvoiceQueue {
  private queue = new PQueue({
    concurrency: 5, // Process 5 invoices concurrently
    interval: 1000, // Per 1 second
    intervalCap: 50 // Max 50 invoices/second
  });
  
  async createInvoice(data: InvoiceData): Promise<Invoice> {
    return this.queue.add(() => {
      return xendit.Invoice.create(data);
    });
  }
  
  async createBatch(invoices: InvoiceData[]): Promise<Invoice[]> {
    return Promise.all(
      invoices.map(data => this.createInvoice(data))
    );
  }
}

export const invoiceQueue = new InvoiceQueue();
```

**Usage:**
```typescript
// Instead of sequential
for (const data of invoices) {
  await createInvoice(data); // Slow! 2.5 seconds for 5 invoices
}

// Use queue
await invoiceQueue.createBatch(invoices); // 500ms for 5 invoices
```

---

### Webhook Processing Optimization

**Problem:** Processing webhook events can block other requests.

**Solution - Message Queue (Bull):**

```typescript
// src/lib/webhook-queue.ts

import Bull from 'bull';

const webhookQueue = new Bull('webhook-events', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// Process webhooks in background
webhookQueue.process(10, async (job) => {
  const { event, data } = job.data;
  
  try {
    switch (event) {
      case 'invoice.paid':
        await handlePaymentSuccess(data);
        break;
      case 'invoice.expired':
        await handlePaymentExpired(data);
        break;
    }
  } catch (err) {
    // Retry on failure
    throw err;
  }
});

// Add event to queue
export function enqueueWebhookEvent(event: string, data: any) {
  return webhookQueue.add(
    { event, data },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  );
}
```

**Webhook Handler:**
```typescript
// functions/stripeWebhook.ts

export async function handleWebhook(req: Request, res: Response) {
  try {
    // Verify signature
    if (!isValidSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { event, data } = req.body;
    
    // Queue the event (return immediately)
    await enqueueWebhookEvent(event, data);
    
    // Return success to Xendit
    res.json({ status: 'received' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Failed to process' });
  }
}
```

---

### Caching Invoice Data

**Problem:** Repeated invoice lookups hit the database.

**Solution - Redis Cache:**

```typescript
// src/lib/invoice-cache.ts

import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

const CACHE_TTL = 3600; // 1 hour

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  // Check cache first
  const cached = await redis.get(`invoice:${invoiceId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const invoice = await db.invoices.findOne({ id: invoiceId });
  
  if (invoice) {
    // Cache for 1 hour
    await redis.setex(
      `invoice:${invoiceId}`,
      CACHE_TTL,
      JSON.stringify(invoice)
    );
  }
  
  return invoice;
}

export async function invalidateInvoiceCache(invoiceId: string) {
  await redis.del(`invoice:${invoiceId}`);
}

export async function invalidateUserCache(userId: string) {
  // Clear user invoices cache
  const pattern = `invoice:user:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## ⚡ API Performance

### Request Optimization

**Problem:** Large API responses slow down the client.

**Solution - Pagination & Filtering:**

```typescript
// functions/getBillingHistory.ts

import { z } from 'zod';

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).default('10'),
  status: z.enum(['PAID', 'PENDING', 'EXPIRED']).optional(),
  sortBy: z.enum(['created', 'amount', 'status']).default('created')
});

export async function getBillingHistory(req: Request, res: Response) {
  try {
    const query = querySchema.parse(req.query);
    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 100); // Max 100
    const offset = (page - 1) * limit;
    
    // Build filters
    const filters: any = { user_id: req.user.id };
    if (query.status) {
      filters.status = query.status;
    }
    
    // Get count
    const total = await db.invoices.count(filters);
    
    // Get page
    const invoices = await db.invoices.find(filters, {
      skip: offset,
      limit,
      sort: { [query.sortBy]: -1 }
    });
    
    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
```

### Connection Pooling

**Problem:** Creating new database connections is expensive.

**Solution - Connection Pool:**

```typescript
// src/lib/database.ts

import { Pool } from 'pg';

const pool = new Pool({
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export function getPool() {
  return pool;
}

export async function query(
  text: string,
  values?: any[]
) {
  return pool.query(text, values);
}

// Close on shutdown
process.on('SIGTERM', async () => {
  await pool.end();
});
```

---

## 📊 Database Optimization

### Index Strategy

**Payment-related indexes:**

```sql
-- Speed up invoice lookups
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Speed up user lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id_status ON users(id, subscription_status);

-- Speed up subscription lookups
CREATE INDEX idx_subscriptions_user_id_status 
  ON subscriptions(user_id, status);

-- Speed up webhook event lookups
CREATE INDEX idx_webhook_events_invoice_id 
  ON webhook_events(invoice_id);
CREATE INDEX idx_webhook_events_created_at 
  ON webhook_events(created_at DESC);
```

**Verify indexes:**
```sql
-- See index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
JOIN pg_stat_user_indexes USING (indexrelname)
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Query Optimization

**Before - N+1 Query Problem:**
```typescript
// ❌ Slow: O(N+1) queries
const users = await db.users.find({ status: 'active' });
for (const user of users) {
  user.invoices = await db.invoices.find({ user_id: user.id });
}
```

**After - Single Join Query:**
```typescript
// ✅ Fast: O(1) query
const users = await db.query(`
  SELECT 
    u.*,
    json_agg(json_build_object(
      'id', i.id,
      'amount', i.amount,
      'status', i.status
    )) as invoices
  FROM users u
  LEFT JOIN invoices i ON i.user_id = u.id
  WHERE u.status = 'active'
  GROUP BY u.id
`);
```

---

## 🎨 Frontend Performance

### Code Splitting

```typescript
// src/pages/Payment.jsx

import { lazy, Suspense } from 'react';

// Lazy load heavy payment component
const PaymentForm = lazy(() => import('../components/PaymentForm'));
const PaymentHistory = lazy(() => import('../components/PaymentHistory'));

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentForm />
      <PaymentHistory />
    </Suspense>
  );
}
```

### Image Optimization

```jsx
// Use Next.js Image component
import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="AppForge Logo"
      width={200}
      height={100}
      priority // Load above the fold
      onLoad={() => console.log('Image loaded')}
    />
  );
}
```

### Bundle Size Monitoring

```bash
# Check bundle size
npm run build -- --analyzeBundle

# Optimize large dependencies
npm install -D bundle-analyzer

# Monitor over time
npx bundlesize
```

---

## 💾 Caching Strategies

### HTTP Caching

```typescript
// src/middleware/cache.ts

export function setCacheHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Static assets: 1 year
  if (req.path.match(/\.(js|css|png|jpg|gif|woff)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // API endpoints: no cache
  else if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store');
  }
  // HTML: 5 minutes
  else {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  
  next();
}
```

### Application Caching Patterns

```typescript
// Cache-aside pattern
async function getUser(userId: string) {
  const key = `user:${userId}`;
  
  // Try cache
  let user = await cache.get(key);
  if (user) return user;
  
  // Cache miss, fetch from DB
  user = await db.users.findById(userId);
  
  // Store in cache
  await cache.set(key, user, 3600);
  
  return user;
}

// Write-through pattern
async function updateUser(userId: string, data: any) {
  // Update DB first
  const user = await db.users.update(userId, data);
  
  // Then update cache
  await cache.set(`user:${userId}`, user, 3600);
  
  return user;
}
```

---

## 📈 Monitoring Performance

### Performance Metrics

```typescript
// src/lib/monitoring/performance.ts

export interface PerformanceMetrics {
  // Payment metrics
  invoiceCreationTime: number; // ms
  paymentSuccessRate: number; // %
  avgProcessingTime: number; // ms
  
  // API metrics
  avgResponseTime: number; // ms
  p95ResponseTime: number; // ms
  p99ResponseTime: number; // ms
  errorRate: number; // %
  
  // Database metrics
  avgQueryTime: number; // ms
  slowQueryCount: number;
  
  // Frontend metrics
  pageLoadTime: number; // ms
  timeToInteractive: number; // ms
  cumulativeLayoutShift: number;
}

export async function collectMetrics(): Promise<PerformanceMetrics> {
  return {
    invoiceCreationTime: await getMetric('invoice.creation_time'),
    paymentSuccessRate: await getMetric('payment.success_rate'),
    avgProcessingTime: await getMetric('payment.processing_time'),
    avgResponseTime: await getMetric('api.response_time'),
    p95ResponseTime: await getMetric('api.response_time_p95'),
    p99ResponseTime: await getMetric('api.response_time_p99'),
    errorRate: await getMetric('api.error_rate'),
    avgQueryTime: await getMetric('db.query_time'),
    slowQueryCount: await getMetric('db.slow_queries'),
    pageLoadTime: await getMetric('frontend.page_load'),
    timeToInteractive: await getMetric('frontend.tti'),
    cumulativeLayoutShift: await getMetric('frontend.cls')
  };
}
```

### Performance Reporting

```typescript
// src/lib/monitoring/perf-reporter.ts

export function reportPerformance(metrics: PerformanceMetrics) {
  // Send to monitoring service
  fetch('https://monitoring.example.com/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics
    })
  });
}

// Report on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const metrics = performance.getEntriesByType('navigation')[0];
    reportPerformance({
      pageLoadTime: metrics.loadEventEnd - metrics.fetchStart,
      timeToInteractive: metrics.domInteractive - metrics.fetchStart,
      cumulativeLayoutShift: 0
    });
  });
}
```

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Warning |
|--------|--------|-----------|---------|
| Invoice Creation | <300ms | <500ms | >800ms |
| Payment Processing | <2s | <3s | >5s |
| API Response (p95) | <100ms | <200ms | >500ms |
| API Response (p99) | <200ms | <500ms | >1000ms |
| Database Query | <50ms | <100ms | >200ms |
| Page Load | <2s | <3s | >5s |
| Time to Interactive | <3s | <4s | >6s |
| Error Rate | <0.1% | <1% | >5% |
| Payment Success Rate | >99.5% | >99% | <95% |

### Load Testing

```bash
# Install Apache Bench
npm install -g apache2-utils

# Test endpoint
ab -n 1000 -c 10 http://localhost:3000/api/invoices

# Test with data
ab -n 1000 -c 10 -p data.json -T application/json \
  http://localhost:3000/api/createCheckoutSession
```

### Performance Testing with k6

```javascript
// performance-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['<5%']
  }
};

export default function () {
  const url = 'http://localhost:3000/api/createCheckoutSession';
  const payload = JSON.stringify({
    planName: 'Pro',
    amount: 2999,
    description: 'Test subscription'
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_token'
    }
  };
  
  const response = http.post(url, payload, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has invoiceId': (r) => JSON.parse(r.body).invoiceId !== undefined
  });
  
  sleep(1);
}
```

---

## ✅ Performance Checklist

- [ ] Implement payment queue for concurrent processing
- [ ] Use Redis for caching invoice data
- [ ] Add database connection pooling
- [ ] Create indexes on frequently queried columns
- [ ] Implement pagination for list endpoints
- [ ] Use lazy loading for UI components
- [ ] Monitor API response times
- [ ] Set up alert for slow queries (>200ms)
- [ ] Profile payment processing regularly
- [ ] Track and report performance metrics

---

**Last Updated:** January 28, 2026
**Related:** [XENDIT_MIGRATION_GUIDE.md](./XENDIT_MIGRATION_GUIDE.md) | [docs/MONITORING.md](./docs/MONITORING.md)
