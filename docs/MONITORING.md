# Monitoring & Analytics Documentation

Setup and usage guide for monitoring payment processing, performance, and application health.

---

## 📋 Table of Contents

- [Monitoring Setup](#monitoring-setup)
- [Key Metrics](#key-metrics)
- [Dashboard Setup](#dashboard-setup)
- [Alerting](#alerting)
- [Performance Monitoring](#performance-monitoring)
- [Analytics Queries](#analytics-queries)
- [Health Checks](#health-checks)

---

## 🔧 Monitoring Setup

### Environment Variables

```env
# Monitoring Services
SENTRY_DSN=https://key@sentry.io/project-id
DATADOG_API_KEY=your_datadog_api_key
DATADOG_APP_KEY=your_datadog_app_key

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxx

# Health Check
HEALTH_CHECK_INTERVAL=300000
HEALTH_CHECK_TIMEOUT=10000
```

### Initialize Sentry (Error Tracking)

```typescript
// src/lib/monitoring/sentry.ts

import * as Sentry from '@sentry/node';

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Database({ knex: true })
    ]
  });
}

export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}
```

### Initialize PostHog (Product Analytics)

```typescript
// src/lib/monitoring/posthog.ts

import PostHog from 'posthog-node';

const client = new PostHog(process.env.POSTHOG_API_KEY, {
  host: 'https://api.posthog.com'
});

export function trackEvent(userId: string, event: string, properties?: any) {
  client.capture({
    distinctId: userId,
    event,
    properties: {
      timestamp: new Date().toISOString(),
      ...properties
    }
  });
}

export function trackPayment(userId: string, invoiceId: string, amount: number, planName: string) {
  trackEvent(userId, 'payment_created', {
    invoice_id: invoiceId,
    amount,
    plan_name: planName,
    currency: 'USD'
  });
}

export function trackSubscription(userId: string, status: 'created' | 'cancelled' | 'renewed', planName: string) {
  trackEvent(userId, `subscription_${status}`, {
    plan_name: planName
  });
}
```

---

## 📊 Key Metrics

### Payment Metrics

```typescript
// src/lib/monitoring/metrics.ts

interface PaymentMetrics {
  // Conversion
  checkoutCreated: number;
  checkoutAbandoned: number;
  paymentSuccessful: number;
  paymentFailed: number;
  conversionRate: number; // successful / created
  
  // Revenue
  totalRevenue: number; // in cents
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  aov: number; // Average Order Value
  
  // Subscriptions
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  churnRate: number; // (cancelled / active) * 100
  
  // Performance
  avgCheckoutTime: number; // ms
  avgPaymentProcessingTime: number; // ms
  paymentSuccessRate: number; // %
}

export async function getPaymentMetrics(period: 'today' | 'week' | 'month' = 'month'): Promise<PaymentMetrics> {
  const startDate = getStartDate(period);
  const endDate = new Date();
  
  const [
    checkouts,
    payments,
    subscriptions,
    timings
  ] = await Promise.all([
    db.query(`
      SELECT COUNT(*) as created, COUNT(CASE WHEN paid_at IS NULL THEN 1 END) as abandoned
      FROM invoices
      WHERE created_at BETWEEN $1 AND $2
    `, [startDate, endDate]),
    
    db.query(`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
      FROM invoices
      WHERE created_at BETWEEN $1 AND $2
    `, [startDate, endDate]),
    
    db.query(`
      SELECT COUNT(*) as active FROM invoices WHERE status = 'PAID'
    `),
    
    db.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (paid_at - created_at))) * 1000 as avg_time
      FROM invoices
      WHERE status = 'PAID' AND paid_at IS NOT NULL
    `)
  ]);
  
  const created = parseInt(checkouts[0].created);
  const abandoned = parseInt(checkouts[0].abandoned);
  const successful = parseInt(payments[0].successful);
  const revenue = parseInt(payments[0].total_revenue) || 0;
  
  return {
    checkoutCreated: created,
    checkoutAbandoned: abandoned,
    paymentSuccessful: successful,
    paymentFailed: parseInt(payments[0].failed),
    conversionRate: created > 0 ? (successful / created) * 100 : 0,
    totalRevenue: revenue,
    mrr: revenue,
    arr: revenue * 12,
    aov: successful > 0 ? revenue / successful : 0,
    activeSubscriptions: parseInt(subscriptions[0].active),
    expiredSubscriptions: 0,
    cancelledSubscriptions: 0,
    churnRate: 0,
    avgCheckoutTime: parseFloat(timings[0].avg_time) || 0,
    avgPaymentProcessingTime: parseFloat(timings[0].avg_time) || 0,
    paymentSuccessRate: created > 0 ? (successful / created) * 100 : 0
  };
}
```

---

## 📈 Dashboard Setup

### Datadog Dashboard

Create a dashboard in Datadog to visualize metrics:

```yaml
# Datadog Dashboard Configuration
title: AppForge Payment Analytics
description: Real-time payment processing and subscription metrics

widgets:
  - name: "Payment Success Rate"
    type: gauge
    query: "avg:custom.payment.success_rate{*}"
    thresholds:
      warning: 95
      critical: 90
  
  - name: "Monthly Recurring Revenue"
    type: big_number
    query: "sum:custom.revenue.mrr{*}"
  
  - name: "Churn Rate"
    type: gauge
    query: "avg:custom.subscriptions.churn_rate{*}"
    thresholds:
      warning: 5
      critical: 10
  
  - name: "Payment Processing Time"
    type: timeseries
    query: "avg:custom.payment.processing_time{*}"
  
  - name: "Active Subscriptions"
    type: big_number
    query: "avg:custom.subscriptions.active{*}"
  
  - name: "Failed Payments (24h)"
    type: timeseries
    query: "sum:custom.payment.failures{*}"
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Payment Metrics",
    "panels": [
      {
        "title": "Payment Success Rate",
        "targets": [
          {
            "expr": "rate(payment_successful_total[5m]) / rate(payment_created_total[5m]) * 100"
          }
        ]
      },
      {
        "title": "Revenue (MRR)",
        "targets": [
          {
            "expr": "sum(increase(payment_amount_total[30d])) / 100"
          }
        ]
      },
      {
        "title": "Average Payment Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, payment_processing_seconds)"
          }
        ]
      }
    ]
  }
}
```

---

## 🚨 Alerting

### Alert Conditions

```typescript
// src/lib/monitoring/alerts.ts

interface AlertRule {
  name: string;
  condition: () => Promise<boolean>;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  channels: string[]; // ['slack', 'email', 'pagerduty']
}

const alertRules: AlertRule[] = [
  {
    name: 'Payment Success Rate Low',
    condition: async () => {
      const metrics = await getPaymentMetrics('today');
      return metrics.paymentSuccessRate < 90;
    },
    message: 'Payment success rate fell below 90%',
    severity: 'critical',
    channels: ['slack', 'pagerduty']
  },
  {
    name: 'High Payment Processing Time',
    condition: async () => {
      const metrics = await getPaymentMetrics('today');
      return metrics.avgPaymentProcessingTime > 5000; // 5 seconds
    },
    message: 'Average payment processing time exceeded 5 seconds',
    severity: 'warning',
    channels: ['slack']
  },
  {
    name: 'Xendit API Down',
    condition: async () => {
      try {
        await testXenditConnection();
        return false;
      } catch {
        return true;
      }
    },
    message: 'Xendit API is unreachable',
    severity: 'critical',
    channels: ['slack', 'pagerduty', 'email']
  },
  {
    name: 'High Churn Rate',
    condition: async () => {
      const metrics = await getPaymentMetrics('month');
      return metrics.churnRate > 5; // 5%
    },
    message: 'Monthly churn rate exceeded 5%',
    severity: 'warning',
    channels: ['slack']
  }
];

// Check alerts periodically
export async function checkAlerts() {
  for (const rule of alertRules) {
    try {
      const triggered = await rule.condition();
      if (triggered) {
        await sendAlert(rule);
      }
    } catch (err) {
      console.error(`Alert check failed: ${rule.name}`, err);
    }
  }
}

// Start alert checker
setInterval(checkAlerts, 60000); // Check every minute
```

### Slack Integration

```typescript
// src/lib/monitoring/slack.ts

import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendSlackAlert(rule: AlertRule) {
  const color = {
    info: '#36a64f',
    warning: '#ffa500',
    critical: '#ff0000'
  }[rule.severity];
  
  await slack.chat.postMessage({
    channel: '#payment-alerts',
    attachments: [
      {
        color,
        title: rule.name,
        text: rule.message,
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  });
}
```

---

## ⚡ Performance Monitoring

### API Endpoint Monitoring

```typescript
// src/middleware/monitoring.ts

export function monitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memoryDelta = process.memoryUsage().heapUsed - startMemory;
    
    // Track metrics
    const endpoint = `${req.method} ${req.path}`;
    
    // Send to monitoring
    trackMetric('request.duration', duration, {
      endpoint,
      status: res.statusCode,
      method: req.method,
      path: req.path
    });
    
    trackMetric('request.memory', memoryDelta, {
      endpoint
    });
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${endpoint} took ${duration}ms`);
    }
  });
  
  next();
}
```

### Database Query Performance

```typescript
// src/lib/database.ts

export async function trackQuery<T>(
  name: string,
  query: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await query();
    const duration = Date.now() - startTime;
    
    // Track successful query
    trackMetric('db.query.duration', duration, {
      query_name: name,
      status: 'success'
    });
    
    if (duration > 500) {
      console.warn(`Slow query: ${name} took ${duration}ms`);
    }
    
    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    
    // Track failed query
    trackMetric('db.query.duration', duration, {
      query_name: name,
      status: 'error'
    });
    
    throw err;
  }
}
```

---

## 📊 Analytics Queries

### Revenue by Plan

```sql
SELECT 
  plan_name,
  COUNT(*) as subscriptions,
  SUM(amount) / 100.0 as total_revenue,
  AVG(amount) / 100.0 as avg_revenue,
  COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count
FROM invoices
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY plan_name
ORDER BY total_revenue DESC;
```

### Churn Analysis

```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(DISTINCT customer_email) as new_subscriptions,
  COUNT(DISTINCT CASE 
    WHEN status = 'CANCELLED' THEN customer_email 
  END) as cancelled_subscriptions,
  ROUND(
    COUNT(DISTINCT CASE WHEN status = 'CANCELLED' THEN customer_email END)::numeric
    / NULLIF(COUNT(DISTINCT customer_email), 0) * 100, 2
  ) as churn_rate
FROM invoices
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Payment Failure Reasons

```sql
SELECT
  failure_reason,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM failed_payments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY failure_reason
ORDER BY count DESC;
```

---

## 🏥 Health Checks

### API Health Endpoint

```typescript
// src/functions/checkSystemHealth.ts

export async function checkSystemHealth() {
  const checks = {
    database: await checkDatabase(),
    xendit: await checkXendit(),
    redis: await checkRedis(),
    diskSpace: await checkDiskSpace(),
    memory: checkMemory(),
    uptime: process.uptime()
  };
  
  const allHealthy = Object.values(checks).every(
    check => check.status === 'healthy'
  );
  
  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  };
}

async function checkDatabase() {
  try {
    const start = Date.now();
    await db.query('SELECT 1');
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: duration
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message
    };
  }
}

async function checkXendit() {
  try {
    const balance = await xendit.Balance.get();
    return {
      status: 'healthy',
      balance
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message
    };
  }
}
```

### Periodic Health Monitoring

```typescript
// src/lib/monitoring/health.ts

export function startHealthMonitoring() {
  setInterval(async () => {
    try {
      const health = await checkSystemHealth();
      
      if (health.status !== 'healthy') {
        logger.warn('System health degraded', health);
        await sendAlert({
          name: 'System Health Degraded',
          severity: 'warning',
          message: JSON.stringify(health, null, 2)
        });
      }
    } catch (err) {
      logger.error('Health check failed', err);
    }
  }, process.env.HEALTH_CHECK_INTERVAL || 300000);
}
```

---

**Last Updated:** January 28, 2026
**Related:** [API Documentation](./API.md) | [XENDIT_MIGRATION_GUIDE.md](../XENDIT_MIGRATION_GUIDE.md)
