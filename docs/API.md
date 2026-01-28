# API Documentation

Complete reference for AppForge API endpoints, payment processing, and webhook events.

---

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Payment Endpoints](#payment-endpoints)
- [Subscription Endpoints](#subscription-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔗 Base URL

All endpoints are relative to your application root:
```
https://yourdomain.com/api/
```

For local development:
```
http://localhost:5173/api/
```

---

## 🔐 Authentication

All endpoints require user authentication via Base44 SDK. The authentication is handled automatically through session cookies.

**Headers:**
```
Content-Type: application/json
Cookie: [session-cookie]
```

---

## 💳 Payment Endpoints

### Create Checkout Session
Creates a Xendit payment invoice and returns the payment link.

**Endpoint:** `POST /createCheckoutSession`

**Request Body:**
```json
{
  "planName": "Pro",
  "amount": 2999,
  "description": "Monthly Pro Plan Subscription",
  "metadata": {
    "planId": "plan_pro_monthly",
    "userId": "user123"
  }
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "invoiceId": "inv_1234567890",
  "paymentUrl": "https://app.xendit.co/web/invoices/invoice_url",
  "amount": 2999,
  "currency": "USD"
}
```

**Error Response:** (400/500)
```json
{
  "error": "Failed to create invoice",
  "details": "Xendit API error message"
}
```

**Example Usage:**
```javascript
const response = await fetch('/api/createCheckoutSession', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planName: 'Pro',
    amount: 2999,
    description: 'Monthly Pro Plan'
  })
});

const { paymentUrl, invoiceId } = await response.json();
window.location.href = paymentUrl;
```

---

### Get Checkout Session
Retrieve details of a previously created checkout session.

**Endpoint:** `POST /getCheckoutSession`

**Request Body:**
```json
{
  "invoiceId": "inv_1234567890"
}
```

**Response:** (200 OK)
```json
{
  "id": "inv_1234567890",
  "status": "PAID",
  "amount": 2999,
  "currency": "USD",
  "description": "Monthly Pro Plan",
  "customer_email": "user@example.com",
  "created": "2026-01-28T10:30:00Z",
  "paid_at": "2026-01-28T10:35:00Z"
}
```

---

### Get Subscription Info
Retrieve current subscription and billing information for the authenticated user.

**Endpoint:** `GET /getSubscriptionInfo`

**Response:** (200 OK)
```json
{
  "success": true,
  "subscription": {
    "id": "inv_1234567890",
    "status": "PAID",
    "planName": "Pro",
    "amount": 2999,
    "currency": "USD",
    "created": "2026-01-01T00:00:00Z",
    "expiresAt": "2026-02-01T00:00:00Z"
  },
  "nextBillingDate": "2026-02-01"
}
```

**Response (No Subscription):** (200 OK)
```json
{
  "success": true,
  "subscription": null,
  "message": "No active subscription"
}
```

---

## 📅 Subscription Endpoints

### Cancel Subscription
Cancel all active subscriptions for the current user.

**Endpoint:** `POST /cancelSubscription`

**Request Body:**
```json
{}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "cancelled_invoices": 1,
  "invoice_ids": ["inv_1234567890"]
}
```

**Error Response:** (404)
```json
{
  "error": "No active invoices found"
}
```

**Example Usage:**
```javascript
const response = await fetch('/api/cancelSubscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

if (response.ok) {
  const data = await response.json();
  console.log(`Cancelled ${data.cancelled_invoices} subscription(s)`);
}
```

---

### Get Billing History
Retrieve invoice history for the current user.

**Endpoint:** `GET /getBillingHistory`

**Response:** (200 OK)
```json
[
  {
    "id": "inv_1234567890",
    "created": 1706432400,
    "amount": 2999,
    "status": "PAID",
    "description": "Monthly Pro Plan",
    "invoice_url": "https://dashboard.xendit.co/invoices/inv_1234567890"
  },
  {
    "id": "inv_0987654321",
    "created": 1703840400,
    "amount": 2999,
    "status": "PAID",
    "description": "Monthly Pro Plan",
    "invoice_url": "https://dashboard.xendit.co/invoices/inv_0987654321"
  }
]
```

---

## 👨‍💼 Admin Endpoints

### Get Subscription Metrics
Retrieve subscription analytics (admin only).

**Endpoint:** `GET /getSubscriptionMetrics`

**Required Role:** `admin`

**Response:** (200 OK)
```json
{
  "total_subscribers": 150,
  "active_subscriptions": 145,
  "expired_subscriptions": 5,
  "mrr": 435000,
  "churn_rate": 3.33,
  "growth_rate": 0
}
```

---

### Get All Subscribers
Retrieve list of all subscribers (admin only).

**Endpoint:** `GET /getAllSubscribers`

**Required Role:** `admin`

**Response:** (200 OK)
```json
[
  {
    "id": "inv_1234567890",
    "customer_email": "user@example.com",
    "plan_name": "Pro",
    "price": 29.99,
    "status": "PAID",
    "created_at": "2026-01-01T00:00:00Z",
    "expires_at": "2026-02-01T00:00:00Z",
    "amount": 2999
  }
]
```

---

### Change Plan (Admin)
Change user subscription plan (admin only).

**Endpoint:** `POST /adminChangePlan`

**Required Role:** `admin`

**Request Body:**
```json
{
  "recurring_charge_id": "rc_1234567890",
  "new_plan_amount": 9999
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "recurring_charge_id": "rc_0987654321",
  "amount": 9999
}
```

---

### Cancel Subscription (Admin)
Cancel a user's subscription (admin only).

**Endpoint:** `POST /adminCancelSubscription`

**Required Role:** `admin`

**Request Body:**
```json
{
  "recurring_charge_id": "rc_1234567890"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "recurring_charge_id": "rc_1234567890"
}
```

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    "key": "value"
  }
}
```

### Error Response
```json
{
  "error": "Human-readable error message",
  "details": "Optional technical details",
  "code": "ERROR_CODE"
}
```

### Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Not admin/no permission |
| 404 | Not Found | Invoice not found |
| 500 | Server Error | Xendit API error |

---

## ⚠️ Error Handling

### Common Errors

**Missing Authentication:**
```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```
*Fix: Ensure user is logged in*

**Invalid Plan:**
```json
{
  "error": "Invalid plan",
  "code": "INVALID_PLAN"
}
```
*Fix: Check plan name exists*

**Payment API Error:**
```json
{
  "error": "Failed to create invoice",
  "details": "Xendit API: Invalid amount"
}
```
*Fix: Verify amount is in cents (e.g., 2999 = $29.99)*

**Network Error:**
```json
{
  "error": "Payment service not configured",
  "code": "CONFIG_ERROR"
}
```
*Fix: Check XENDIT_SECRET_KEY environment variable*

---

## 🔄 Webhook Events

### Event: payment.successful
Triggered when payment is successfully processed.

**Event Data:**
```json
{
  "event": "payment.successful",
  "data": {
    "invoice_id": "inv_1234567890",
    "customer_email": "user@example.com",
    "amount": 2999,
    "currency": "USD",
    "status": "PAID"
  }
}
```

**Handler:** `src/functions/stripeWebhook.ts`

---

### Event: invoice.created
Triggered when a new invoice is created.

**Event Data:**
```json
{
  "event": "invoice.created",
  "data": {
    "invoice_id": "inv_1234567890",
    "customer_email": "user@example.com",
    "amount": 2999,
    "status": "PENDING",
    "invoice_url": "https://..."
  }
}
```

---

### Event: recurring_charge.canceled
Triggered when recurring charge is cancelled.

**Event Data:**
```json
{
  "event": "recurring_charge.canceled",
  "data": {
    "recurring_charge_id": "rc_1234567890",
    "customer_email": "user@example.com"
  }
}
```

---

### Event: payment.failed
Triggered when payment processing fails.

**Event Data:**
```json
{
  "event": "payment.failed",
  "data": {
    "invoice_id": "inv_1234567890",
    "customer_email": "user@example.com",
    "amount": 2999,
    "failure_reason": "Insufficient funds"
  }
}
```

---

## ⏱️ Rate Limiting

Current limits:
- **Payment endpoints:** 10 requests/minute per user
- **Webhook endpoints:** Unlimited (server-to-server)
- **Admin endpoints:** 100 requests/minute per user

Rate limit headers:
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 598
X-RateLimit-Reset: 1706432460
```

When limit exceeded:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## 🔗 Quick Links

- **[Xendit API Docs](https://xendit.co/api-documentation/)**
- **[XENDIT_MIGRATION_GUIDE.md](../XENDIT_MIGRATION_GUIDE.md)**
- **[ERROR_HANDLING.md](./ERROR_HANDLING.md)**

---

**Last Updated:** January 28, 2026
