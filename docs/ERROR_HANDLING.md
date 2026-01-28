# Error Handling Documentation

Comprehensive guide for handling errors in payment processing, webhooks, and API calls.

---

## 📋 Table of Contents

- [Error Categories](#error-categories)
- [Payment Processing Errors](#payment-processing-errors)
- [Webhook Errors](#webhook-errors)
- [API Response Errors](#api-response-errors)
- [Error Recovery Strategies](#error-recovery-strategies)
- [Logging & Debugging](#logging--debugging)
- [User-Facing Messages](#user-facing-messages)

---

## 🏷️ Error Categories

### 1. **Configuration Errors** (900-999)
Missing or invalid environment variables and configuration.

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 901 | Missing XENDIT_SECRET_KEY | Env var not set | Add to .env.local |
| 902 | Invalid XENDIT configuration | Malformed config | Verify API credentials |
| 903 | Database connection failed | DB not running | Start database service |

---

### 2. **Authentication Errors** (400-499)
User not authenticated or insufficient permissions.

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 401 | Unauthorized | Not logged in | Redirect to login |
| 403 | Forbidden | User role insufficient | Check admin status |
| 405 | Invalid session | Session expired | Re-authenticate |

---

### 3. **Validation Errors** (500-599)
Request data validation failed.

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 501 | Missing required field | Incomplete request | Check API docs |
| 502 | Invalid plan name | Non-existent plan | Use valid plan |
| 503 | Invalid amount | Wrong format | Use cents (e.g., 2999) |
| 504 | Invalid email format | Bad email | Provide valid email |

---

### 4. **Payment Processing Errors** (600-699)
Xendit API or payment service errors.

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 601 | Payment service unavailable | Xendit down | Retry after 5s |
| 602 | Failed to create invoice | API error | Check API key |
| 603 | Invoice already exists | Duplicate | Verify unique IDs |
| 604 | Insufficient funds | Payment failed | User retries |
| 605 | Recurring charge failed | Subscription issue | Manual review |

---

### 5. **Business Logic Errors** (700-799)
State inconsistencies and business rule violations.

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 701 | No active subscription | Not subscribed | Create subscription |
| 702 | Subscription already exists | Duplicate | Use existing |
| 703 | Cannot cancel paid invoice | Business rule | Update logic |
| 704 | Plan change requires upgrade | Business rule | Accept change |

---

### 6. **System Errors** (800-899)
Unexpected runtime errors.

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 801 | Database error | Query failed | Check logs |
| 802 | Network timeout | Connection lost | Retry with backoff |
| 803 | JSON parse error | Invalid JSON | Validate data |
| 999 | Unknown error | Uncaught exception | Check logs |

---

## 💳 Payment Processing Errors

### Creating an Invoice

**Scenario:** User clicks "Subscribe"

```javascript
try {
  const response = await fetch('/api/createCheckoutSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planName: 'Pro',
      amount: 2999,
      description: 'Monthly Pro Plan'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    
    // Handle specific errors
    if (error.code === 901) {
      // Configuration error - show admin message
      console.error('Payment system not configured');
      showUserMessage('Payment system is temporarily unavailable');
    } else if (error.code === 601) {
      // Service unavailable - retry
      setTimeout(() => retryCreateCheckout(), 5000);
    } else {
      // Generic error
      showUserMessage('Failed to create payment: ' + error.error);
    }
    return;
  }

  const { paymentUrl } = await response.json();
  window.location.href = paymentUrl;
} catch (err) {
  console.error('Network error:', err);
  showUserMessage('Network error. Please try again.');
}
```

---

### Handling Failed Payments

**Scenario:** Payment gateway rejects payment

```javascript
// In webhook handler (src/functions/stripeWebhook.ts)

async function handlePaymentFailed(invoiceData) {
  try {
    const { invoice_id, customer_email, failure_reason } = invoiceData;
    
    // Log failure
    logger.warn('Payment failed', {
      invoice_id,
      customer_email,
      failure_reason
    });
    
    // Notify user
    await sendEmail(customer_email, {
      subject: 'Payment Failed - Action Required',
      template: 'payment-failed',
      data: {
        invoice_id,
        retry_url: `/api/retry-payment?invoice_id=${invoice_id}`
      }
    });
    
    // Don't grant access to premium features
    // Wait for retry or admin intervention
  } catch (err) {
    logger.error('Error handling payment failure', err);
    // Alert admin
    notifyAdminSlack('Payment failure handler error', err);
  }
}
```

---

## 🪝 Webhook Errors

### Webhook Processing

**Scenario:** Xendit sends payment confirmation webhook

```typescript
// src/functions/stripeWebhook.ts

async function processWebhook(event: any) {
  try {
    // 1. Validate webhook signature
    if (!isValidXenditSignature(event)) {
      throw new Error('Invalid webhook signature');
    }
    
    // 2. Process based on event type
    switch (event.event) {
      case 'payment.successful':
        await handlePaymentSuccess(event.data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;
      case 'recurring_charge.canceled':
        await handleRecurringChargeCanceled(event.data);
        break;
      default:
        logger.warn('Unknown event type', event.event);
    }
    
    // 3. Return success to Xendit
    return { status: 'received' };
  } catch (err) {
    logger.error('Webhook processing error', {
      error: err.message,
      event: event.event,
      eventId: event.id
    });
    
    // Return error but don't retry
    return { 
      status: 'error',
      message: err.message 
    };
  }
}
```

**Error Recovery:**
- **Invalid signature:** Log and ignore (potential security issue)
- **Database error:** Return error, Xendit will retry
- **Missing user:** Create placeholder invoice record, notify admin
- **Unknown event:** Log and ignore, don't error

---

## 🔌 API Response Errors

### Standard Error Response

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": 602,
  "details": "Technical details for debugging",
  "timestamp": "2026-01-28T10:30:00Z",
  "requestId": "req_1234567890"
}
```

### Handling in Frontend

```javascript
async function makeAPICall(endpoint, options = {}) {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const data = await response.json();
    
    // Check response status
    if (!response.ok) {
      // Handle based on HTTP status
      switch (response.status) {
        case 400: // Bad request
          console.error('Invalid request:', data.error);
          showFormError(data.error);
          break;
        case 401: // Unauthorized
          console.error('Not authenticated');
          redirectToLogin();
          break;
        case 403: // Forbidden
          console.error('Permission denied');
          showMessage('You don\'t have permission for this action');
          break;
        case 404: // Not found
          console.error('Resource not found');
          showMessage('Resource not found');
          break;
        case 500: // Server error
          console.error('Server error:', data.details);
          notifyAdminSlack('API Error', data);
          showMessage('Server error. Please contact support.');
          break;
      }
      
      throw new APIError(data.error, response.status, data.code);
    }
    
    return data;
  } catch (err) {
    if (err instanceof APIError) {
      throw err;
    }
    
    // Network or JSON parse error
    console.error('Request failed:', err);
    showMessage('Network error. Please try again.');
    throw new NetworkError(err.message);
  }
}
```

---

## 🔄 Error Recovery Strategies

### Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      
      // Don't retry on client errors (4xx)
      if (err.statusCode >= 400 && err.statusCode < 500) {
        throw err;
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usage
const result = await retryWithBackoff(
  () => createXenditInvoice(data),
  3, // max retries
  1000 // initial delay ms
);
```

### Circuit Breaker Pattern

```typescript
class PaymentCircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime: number = 0;
  
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if enough time has passed
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= 2) {
          this.state = 'CLOSED';
          this.failureCount = 0;
        }
      }
      
      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        logger.error('Circuit breaker opened due to failures', {
          failureCount: this.failureCount
        });
      }
      
      throw err;
    }
  }
}
```

---

## 📝 Logging & Debugging

### Structured Logging

```typescript
// src/lib/logger.ts

interface LogContext {
  userId?: string;
  invoiceId?: string;
  email?: string;
  requestId?: string;
  [key: string]: any;
}

function logError(message: string, error: Error, context: LogContext) {
  console.error(JSON.stringify({
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    message,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  }, null, 2));
  
  // Send to monitoring service (e.g., Sentry)
  captureException(error, { extra: context });
}

function logWarning(message: string, context: LogContext) {
  console.warn(JSON.stringify({
    level: 'WARN',
    timestamp: new Date().toISOString(),
    message,
    context
  }, null, 2));
}

function logInfo(message: string, context: LogContext) {
  console.log(JSON.stringify({
    level: 'INFO',
    timestamp: new Date().toISOString(),
    message,
    context
  }, null, 2));
}
```

### Usage

```typescript
import { logError, logInfo } from '@/lib/logger';

try {
  const invoice = await createXenditInvoice(data);
  logInfo('Invoice created', {
    invoiceId: invoice.id,
    email: data.email,
    amount: data.amount
  });
} catch (err) {
  logError('Failed to create invoice', err, {
    email: data.email,
    amount: data.amount,
    planName: data.planName
  });
  throw err;
}
```

---

## 👤 User-Facing Messages

### Error Messages Template

| Situation | User Message | Tech Details |
|-----------|--------------|--------------|
| Payment failed | "Payment failed. Please try again or contact support." | Check payment gateway logs |
| Network error | "Network error. Please check your connection and try again." | Timeout or DNS error |
| Invalid input | "Please check your input and try again." | Validation failed |
| Server error | "Something went wrong. We've been notified. Please try again later." | 500 error, escalate |
| Service down | "Payment service temporarily unavailable. Please try again." | Xendit API down |
| Not authenticated | "Please log in to continue." | Session expired |
| Not authorized | "You don't have permission to perform this action." | Role check failed |

### Error Message Best Practices

✅ **DO:**
- Be specific about what went wrong
- Provide actionable next steps
- Use friendly, non-technical language
- Include support contact if applicable

❌ **DON'T:**
- Expose sensitive information
- Use cryptic error codes for users
- Blame the user ("You did something wrong")
- Leave user without options

---

## 🔍 Debugging Checklist

When payment errors occur:

- [ ] Check `XENDIT_SECRET_KEY` environment variable
- [ ] Verify Xendit account is active
- [ ] Check API rate limits haven't been exceeded
- [ ] Review webhook event logs in Xendit dashboard
- [ ] Verify user authentication status
- [ ] Check database connectivity
- [ ] Review server logs for stack traces
- [ ] Test with Xendit sandbox credentials
- [ ] Verify request data format (amounts in cents)
- [ ] Check webhook signature validation

---

**Last Updated:** January 28, 2026
**Related:** [API Documentation](./API.md) | [XENDIT_MIGRATION_GUIDE.md](../XENDIT_MIGRATION_GUIDE.md)
