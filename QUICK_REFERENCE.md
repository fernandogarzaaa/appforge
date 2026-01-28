# Quick Reference Guide

Fast lookup for common tasks and information.

---

## 📚 Documentation Index

| Document | Purpose | Best For |
|----------|---------|----------|
| [README.md](./README.md) | Project overview and setup | Getting started |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development guidelines | Contributing code |
| [docs/API.md](./docs/API.md) | API endpoint reference | Using payment APIs |
| [docs/ERROR_HANDLING.md](./docs/ERROR_HANDLING.md) | Error codes and solutions | Debugging issues |
| [docs/MONITORING.md](./docs/MONITORING.md) | Monitoring setup | Operations |
| [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) | Performance optimization | Improving speed |
| [.env.example](./.env.example) | Environment variables | Configuration |
| [XENDIT_MIGRATION_GUIDE.md](./XENDIT_MIGRATION_GUIDE.md) | Payment migration steps | Payment setup |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What was implemented | Overview of work |

---

## 🚀 Quick Start Commands

```bash
# Setup
npm install
cp .env.example .env.local
# Edit .env.local with your credentials

# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm test:integration # Run integration tests
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Check code style
npm run lint:fix     # Fix code style
npm run format       # Format code with Prettier

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:reset     # Reset database
```

---

## 💳 Payment Integration Checklist

### Prerequisites
- [ ] Xendit account created
- [ ] API keys obtained (Secret & Public)
- [ ] Webhook key configured
- [ ] Database ready
- [ ] Environment variables set

### Setup
- [ ] Add `XENDIT_SECRET_KEY` to `.env.local`
- [ ] Add `XENDIT_PUBLIC_KEY` to `.env.local`
- [ ] Add `XENDIT_WEBHOOK_KEY` to `.env.local`
- [ ] Create invoices table
- [ ] Set up webhook endpoint

### Testing
- [ ] Create test invoice
- [ ] Verify invoice status
- [ ] Test webhook signature
- [ ] Simulate payment
- [ ] Verify webhook receipt

### Production
- [ ] Switch to production API keys
- [ ] Enable HTTPS
- [ ] Configure production webhook URL
- [ ] Set up monitoring and alerts
- [ ] Test full payment flow

---

## 🔐 Environment Variables

### Required for Payments
```env
XENDIT_SECRET_KEY=xnd_xxx_xxx
XENDIT_PUBLIC_KEY=xnd_xxx_xxx
XENDIT_WEBHOOK_KEY=xnd_xxx_xxx
DATABASE_URL=postgresql://...
SESSION_SECRET=xxxxx
```

### Recommended for Production
```env
SENTRY_DSN=https://...
SLACK_WEBHOOK_URL=https://...
DATADOG_API_KEY=xxx
JWT_SECRET=xxxxx
```

---

## 🧪 Testing

### Run Specific Tests
```bash
npm run test -- payment  # Tests with "payment" in name
npm run test:integration -- webhook  # Integration tests
```

### Debug Tests
```bash
npm run test -- --inspect-brk
npm run test:ui  # Visual test runner
```

---

## 📊 Key Functions

### Create Invoice
```typescript
import { createInvoice } from '@/functions/utils/xenditClient';

const invoice = await createInvoice(
  'user123',
  2999,           // Amount in cents
  'Pro Plan',
  'user@example.com'
);

console.log(invoice.invoice_url); // Send to customer
```

### Check Invoice Status
```typescript
import { getInvoice } from '@/functions/utils/xenditClient';

const invoice = await getInvoice('inv_123');

if (invoice.status === 'PAID') {
  // Grant access
} else if (invoice.status === 'PENDING') {
  // Still waiting for payment
} else if (invoice.status === 'EXPIRED') {
  // Invoice expired, create new one
}
```

### Verify Webhook
```typescript
import { verifyWebhookSignature } from '@/functions/utils/xenditClient';

export function handleWebhook(req) {
  const signature = req.headers['x-xendit-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature)) {
    throw new Error('Invalid signature');
  }
  
  // Process webhook
}
```

---

## 🐛 Common Error Codes

| Code | Message | Fix |
|------|---------|-----|
| 401 | Unauthorized | Check authentication token |
| 501 | Missing field | Verify request body |
| 601 | Payment service unavailable | Retry after delay |
| 701 | No active subscription | Create subscription first |
| 901 | Missing API key | Set XENDIT_SECRET_KEY env var |

See [docs/ERROR_HANDLING.md](./docs/ERROR_HANDLING.md) for complete list.

---

## 📈 Monitoring Queries

### Check Payment Success Rate
```sql
SELECT 
  ROUND(COUNT(CASE WHEN status = 'PAID' THEN 1 END)::numeric / 
        COUNT(*) * 100, 2) as success_rate
FROM invoices
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

### Find Unpaid Invoices
```sql
SELECT * FROM invoices
WHERE status = 'PENDING'
AND created_at < NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Get Revenue This Month
```sql
SELECT SUM(amount) / 100.0 as monthly_revenue
FROM invoices
WHERE status = 'PAID'
AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
```

---

## 🔒 Security Checklist

### Before Commit
- [ ] No API keys in code
- [ ] No passwords in files
- [ ] `.env.local` in `.gitignore`
- [ ] Secrets in environment variables

### Before Deploy
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Error messages sanitized
- [ ] Logs don't contain secrets
- [ ] Webhook signature verified

### During Development
- [ ] Use sandbox credentials
- [ ] Validate all inputs
- [ ] Use prepared statements
- [ ] Handle errors gracefully
- [ ] Log important events

---

## 🚨 Alert Configuration

### Setup Slack Alerts
```typescript
// In .env.local
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_ERROR_CHANNEL=#payment-errors
```

### Key Alerts to Enable
1. Payment success rate < 95%
2. Average processing time > 5s
3. Database connection failed
4. Xendit API down
5. Churn rate > 5%

---

## 📱 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/createCheckoutSession` | POST | Create invoice |
| `/api/getCheckoutSession` | POST | Get invoice details |
| `/api/getSubscriptionInfo` | GET | Check subscription |
| `/api/cancelSubscription` | POST | Cancel subscription |
| `/api/getBillingHistory` | GET | Invoice history |
| `/api/getSubscriptionMetrics` | GET | Admin metrics |
| `/api/getAllSubscribers` | GET | Admin subscribers |
| `/webhook/xendit` | POST | Receive webhooks |

See [docs/API.md](./docs/API.md) for detailed documentation.

---

## 🎯 Developer Workflow

1. **Create branch:** `git checkout -b feature/description`
2. **Make changes:** Edit files and add tests
3. **Format code:** `npm run lint:fix`
4. **Run tests:** `npm run test`
5. **Commit:** `git commit -m "feat(scope): description"`
6. **Push:** `git push -u origin feature/description`
7. **Create PR:** On GitHub with description
8. **Review:** Wait for 2+ approvals
9. **Merge:** Squash and merge to main

---

## 📞 Getting Help

### Documentation
- API Reference: [docs/API.md](./docs/API.md)
- Errors & Solutions: [docs/ERROR_HANDLING.md](./docs/ERROR_HANDLING.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Migration: [XENDIT_MIGRATION_GUIDE.md](./XENDIT_MIGRATION_GUIDE.md)

### External Resources
- [Xendit API Docs](https://xendit.co/api-documentation/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Node.js Docs](https://nodejs.org/docs/)

### Team
- Issues: GitHub Issues
- Discussion: GitHub Discussions
- Security: security@appforge.dev

---

## 🔄 Database Schema

### Key Tables
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  name VARCHAR,
  subscription_status VARCHAR,
  created_at TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
  id VARCHAR PRIMARY KEY,
  user_id UUID REFERENCES users,
  amount INTEGER,
  status VARCHAR,
  created_at TIMESTAMP,
  paid_at TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  plan_name VARCHAR,
  status VARCHAR,
  amount INTEGER,
  created_at TIMESTAMP
);
```

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Linting passes
- [ ] Build succeeds
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security scan passed
- [ ] Monitoring configured
- [ ] Alerts enabled
- [ ] Rollback plan ready

---

## 📝 Code Review Checklist

When reviewing payment changes:

- [ ] Tests added/updated
- [ ] Error handling present
- [ ] No hardcoded secrets
- [ ] Documentation updated
- [ ] JSDoc comments added
- [ ] Inputs validated
- [ ] SQL injection prevented
- [ ] Rate limiting checked
- [ ] HTTPS enforced
- [ ] Webhook signature verified

---

## 🎓 Learning Path

### Beginner
1. Read [README.md](./README.md)
2. Follow [XENDIT_MIGRATION_GUIDE.md](./XENDIT_MIGRATION_GUIDE.md)
3. Review [docs/API.md](./docs/API.md)

### Intermediate
1. Study [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Read [docs/ERROR_HANDLING.md](./docs/ERROR_HANDLING.md)
3. Review integration tests

### Advanced
1. Read [docs/PERFORMANCE.md](./docs/PERFORMANCE.md)
2. Study [docs/MONITORING.md](./docs/MONITORING.md)
3. Review security guidelines

---

**Last Updated:** January 28, 2026
**Version:** 1.0.0
