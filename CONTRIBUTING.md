# Contributing to AppForge

Guidelines for developers contributing to AppForge, including code standards, testing, and payment integration best practices.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Payment Integration Guidelines](#payment-integration-guidelines)
- [Testing Requirements](#testing-requirements)
- [Git Workflow](#git-workflow)
- [Reporting Bugs](#reporting-bugs)
- [Security Guidelines](#security-guidelines)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (check with `node --version`)
- npm or yarn
- Git
- Xendit account (for payment testing)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/appforge.git
cd appforge

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Environment Setup

Create `.env.local` in the project root:

---

## 🔄 Development Workflow

### Branch Naming

```
feature/description          # New features
bugfix/issue-number          # Bug fixes
chore/description            # Maintenance
docs/description             # Documentation
test/description             # Tests
payment/description          # Payment-related changes
```

### Example

```bash
# Create a branch for payment feature
git checkout -b feature/recurring-subscriptions
git push -u origin feature/recurring-subscriptions
```

### Commit Messages

Follow conventional commits:

```
type(scope): subject

Body explaining what and why.

Fixes #issue_number
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(payments): add recurring subscription support

Implements recurring charges through Xendit API.
Adds invoice tracking and renewal notifications.

Fixes #42

---

fix(webhook): validate signature before processing

Ensures webhook signature verification prevents
unauthorized API calls.

Fixes #89

---

docs(api): update payment endpoint documentation

Added examples and error codes for payment endpoints.
```

---

## 📝 Code Standards

### JavaScript/TypeScript

**Format with Prettier:**
```bash
npm run format
```

**Lint with ESLint:**
```bash
npm run lint
npm run lint:fix
```

### File Organization

```
src/
  components/          # Reusable UI components
  pages/              # Page components
  api/                # API client functions
  lib/                # Utilities and helpers
  hooks/              # Custom React hooks
  functions/          # Backend cloud functions
  utils/              # Utility functions
```

### TypeScript Best Practices

✅ **DO:**
```typescript
// Type annotations
function createInvoice(data: InvoiceData): Promise<Invoice> {
  // Implementation
}

// Explicit interfaces
interface User {
  id: string;
  email: string;
  planName: string;
}

// Error handling
try {
  await processPayment(data);
} catch (err) {
  if (err instanceof ValidationError) {
    // Handle validation
  }
  throw err;
}
```

❌ **DON'T:**
```typescript
// Avoid 'any'
function createInvoice(data: any): any { }

// Avoid implicit types
const user = {
  id: "123",
  email: "test@example.com"
};

// Avoid silent errors
try {
  await processPayment(data);
} catch (err) {
  console.log('Error:', err);
}
```

### Naming Conventions

- **Files:** kebab-case (`payment-handler.ts`)
- **Functions:** camelCase (`createInvoice()`)
- **Classes:** PascalCase (`PaymentService`)
- **Constants:** UPPER_SNAKE_CASE (`WEBHOOK_TIMEOUT`)
- **Private methods:** `_privateMethod()`
- **Boolean getters:** `is*`, `has*`, `can*` (`isActive`, `hasPaid`)

### Comments & Documentation

```typescript
/**
 * Creates a Xendit invoice for user subscription.
 * 
 * @param email - Customer email address
 * @param amount - Amount in cents (e.g., 2999 = $29.99)
 * @param planName - Subscription plan name
 * @returns Invoice ID and payment URL
 * 
 * @throws {ValidationError} If email or amount is invalid
 * @throws {PaymentError} If Xendit API request fails
 * 
 * @example
 * const invoice = await createInvoice('user@example.com', 2999, 'Pro');
 * window.location.href = invoice.paymentUrl;
 */
export async function createInvoice(
  email: string,
  amount: number,
  planName: string
): Promise<{ invoiceId: string; paymentUrl: string }> {
  // Implementation
}
```

---

## 💳 Payment Integration Guidelines

### Working with Xendit

**Never commit secrets:**
```bash
# ✅ Use environment variables
const apiKey = process.env.XENDIT_SECRET_KEY;

# ❌ Don't hardcode keys
const apiKey = 'xnd_xxx_xxx';
```

**Test with sandbox:**
```bash
# Use Xendit sandbox for testing
XENDIT_BASE_URL=https://api.xendit.co
XENDIT_SECRET_KEY=xnd_development_xxx  # Sandbox key
```

**Payment Flow:**

```
User → Payment Page
        ↓
    Create Invoice (POST /api/createCheckoutSession)
        ↓
    Redirect to Xendit
        ↓
    User Pays
        ↓
    Xendit → Webhook (POST /webhook/xendit)
        ↓
    Update Database
        ↓
    Grant Access
```

### API Endpoint Structure

```typescript
// functions/createCheckoutSession.ts

import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

// Validate input
const createCheckoutSchema = z.object({
  planName: z.string().min(1),
  amount: z.number().int().positive(),
  description: z.string().optional()
});

export async function createCheckoutSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Validate request
    const data = createCheckoutSchema.parse(req.body);
    
    // 2. Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 3. Call Xendit API
    const invoice = await xendit.Invoice.create({
      external_id: `${req.user.id}_${Date.now()}`,
      amount: data.amount,
      email: req.user.email,
      description: data.description || data.planName,
      customer: {
        given_names: req.user.name,
        email: req.user.email
      }
    });
    
    // 4. Save to database
    await db.invoices.create({
      external_id: invoice.id,
      user_id: req.user.id,
      amount: data.amount,
      status: 'PENDING'
    });
    
    // 5. Return response
    res.json({
      success: true,
      invoiceId: invoice.id,
      paymentUrl: invoice.invoice_url,
      amount: data.amount
    });
  } catch (err) {
    next(err);
  }
}
```

### Webhook Handling

```typescript
// functions/stripeWebhook.ts

import crypto from 'crypto';

export async function handleWebhook(req: Request, res: Response) {
  try {
    // 1. Verify webhook signature
    const signature = req.headers['x-xendit-token'] as string;
    const computed = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body) + process.env.XENDIT_WEBHOOK_KEY)
      .digest('hex');
    
    if (signature !== computed) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // 2. Process event
    const { event, data } = req.body;
    
    switch (event) {
      case 'invoice.paid':
        await handlePaymentSuccess(data);
        break;
      case 'invoice.expired':
        await handlePaymentExpired(data);
        break;
      default:
        console.warn('Unknown event:', event);
    }
    
    // 3. Return success
    res.json({ status: 'received' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Processing failed' });
  }
}
```

---

## ✅ Testing Requirements

### Unit Tests

```bash
npm run test
```

**Test file structure:**
```
src/
  utils/
    helper.ts
    helper.test.ts
```

**Example test:**
```typescript
// src/lib/payments.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInvoice } from './payments';
import * as xendit from './xendit';

vi.mock('./xendit');

describe('createInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should create invoice with valid data', async () => {
    const mockInvoice = {
      id: 'inv_123',
      invoice_url: 'https://...'
    };
    vi.mocked(xendit.Invoice.create).mockResolvedValue(mockInvoice);
    
    const result = await createInvoice('user@example.com', 2999, 'Pro');
    
    expect(result.invoiceId).toBe('inv_123');
    expect(xendit.Invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2999,
        email: 'user@example.com'
      })
    );
  });
  
  it('should throw on invalid amount', async () => {
    await expect(
      createInvoice('user@example.com', -100, 'Pro')
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```bash
npm run test:integration
```

**Example:**
```typescript
// functions/createCheckoutSession.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import * as db from '../lib/database';

describe('POST /api/createCheckoutSession', () => {
  it('should create checkout session for authenticated user', async () => {
    const response = await request(app)
      .post('/api/createCheckoutSession')
      .set('Authorization', 'Bearer token_user123')
      .send({
        planName: 'Pro',
        amount: 2999,
        description: 'Monthly subscription'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoiceId');
    expect(response.body).toHaveProperty('paymentUrl');
  });
  
  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/createCheckoutSession')
      .send({ planName: 'Pro', amount: 2999 });
    
    expect(response.status).toBe(401);
  });
});
```

### Coverage Requirements

- **Minimum:** 80% code coverage
- **Critical functions:** 100% coverage
- **View coverage:** `npm run test:coverage`

---

## 🌳 Git Workflow

### Creating a Pull Request

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... edit files ...

# 3. Commit changes
git commit -m "feat(payments): add description"

# 4. Push to remote
git push -u origin feature/new-feature

# 5. Create PR on GitHub
# - Write description
# - Link related issues
# - Request reviewers
```

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issues
Fixes #123

## How to Test
1. Step 1
2. Step 2

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Code follows style guidelines
```

### Code Review Process

1. **Author** submits PR with tests and documentation
2. **Reviewers** check:
   - Code quality and standards
   - Test coverage
   - Security (especially for payment code)
   - Documentation
3. **Approvals** required: 2 for payment changes, 1 for others
4. **CI** must pass
5. **Merge** when approved

---

## 🐛 Reporting Bugs

### Bug Report Format

**Title:** `[BUG] Brief description`

**Description:**
```markdown
## Description
Detailed description of the bug.

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.0.0]

## Screenshots/Logs
[Add relevant screenshots or error logs]

## Additional Context
[Any other relevant information]
```

### Payment Bug Special Handling

For bugs related to payments:
1. **DO NOT include** test payment details
2. **Include** invoice IDs and timestamps
3. **Report to** security team first if it affects money
4. **Tag as** `payment-sensitive`

---

## 🔐 Security Guidelines

### Payment Security Checklist

- [ ] Never log sensitive data (keys, tokens, card details)
- [ ] Always validate webhook signatures
- [ ] Use environment variables for all secrets
- [ ] Implement rate limiting on payment endpoints
- [ ] Use HTTPS for all payment URLs
- [ ] Implement CSRF protection
- [ ] Validate all user inputs
- [ ] Log all payment transactions
- [ ] Implement idempotency for payment operations

### Code Security

```typescript
// ✅ DO: Use environment variables
const apiKey = process.env.XENDIT_SECRET_KEY;

// ✅ DO: Validate and sanitize input
const email = z.string().email().parse(userInput);

// ✅ DO: Use prepared statements
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ✅ DO: Implement rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// ❌ DON'T: Hardcode secrets
const apiKey = 'xnd_production_abc123';

// ❌ DON'T: String concatenation for SQL
const result = await db.query(
  `SELECT * FROM users WHERE id = '${userId}'`
);

// ❌ DON'T: Expose error details to users
res.status(500).json(error);  // Contains stack trace!
```

---

## 📚 Resources

- **[Xendit API Docs](https://xendit.co/api-documentation/)**
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**
- **[Express.js Guide](https://expressjs.com/)**
- **[docs/API.md](./docs/API.md)**
- **[docs/ERROR_HANDLING.md](./docs/ERROR_HANDLING.md)**
- **[XENDIT_MIGRATION_GUIDE.md](./XENDIT_MIGRATION_GUIDE.md)**

---

## ❓ Questions?

- **Issues:** Create an issue on GitHub
- **Discussions:** Use GitHub Discussions
- **Security:** Email security@appforge.dev
- **Team:** Check our [organization page](https://github.com/yourusername)

---

**Last Updated:** January 28, 2026
**Version:** 2.0.0

## ❓ Questions?

- Check existing documentation
- Search closed issues and PRs
- Create a discussion or issue
- Reach out to maintainers

---

## 🙏 Thank You!

Your contributions help make AppForge better for everyone. We appreciate your effort and dedication!

---

**Last Updated:** January 28, 2026
