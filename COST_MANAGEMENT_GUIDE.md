# 💰 Cost Management & Subscription System

**Advanced Credit System with 80% Profit Margin**

> Users pay → Credits added to account → Credits deducted per API usage → You keep 80% profit

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [API Pricing Analysis](#api-pricing-analysis)
3. [Subscription Tiers](#subscription-tiers)
4. [Cost Calculations](#cost-calculations)
5. [Implementation Guide](#implementation-guide)
6. [API Endpoints](#api-endpoints)
7. [Webhook Setup](#webhook-setup)
8. [Usage Examples](#usage-examples)

---

## 🎯 System Overview

### The Business Model

```
User Subscription ($19-$499/month)
         ↓
Stripe charges user's card
         ↓
Credits added to user account
(amount = monthly_price × 0.20)
         ↓
User makes API request (costs $0.0005 - $0.075)
         ↓
Credits deducted from balance
         ↓
You keep 80% of payment ($0.80 per $1.00)
API cost is paid from 20% margin ($0.20 per $1.00)
```

### Key Components

| Component | Purpose |
|-----------|---------|
| **apiPricing.js** | Real API pricing for all providers |
| **subscriptionTierCalculator.js** | Auto-generates tiers with 80% margin |
| **UserCredits Model** | Tracks user credits & usage |
| **CreditManager Service** | Manages credits & deductions |
| **StripeService** | Handles payments & subscriptions |
| **costProtection Middleware** | Protects endpoints & deducts credits |
| **creditsRoutes** | API endpoints for credit management |

---

## 💵 API Pricing Analysis

### Supported Providers & Current Pricing (Jan 2026)

#### **OpenAI**
```
GPT-4o:
  - Input:  $0.005 per 1K tokens
  - Output: $0.015 per 1K tokens
  
GPT-4 Turbo:
  - Input:  $0.01 per 1K tokens
  - Output: $0.03 per 1K tokens

GPT-3.5 Turbo:
  - Input:  $0.0005 per 1K tokens
  - Output: $0.0015 per 1K tokens
```

#### **Anthropic**
```
Claude 3 Opus:
  - Input:  $15 per 1M tokens
  - Output: $75 per 1M tokens

Claude 3 Sonnet:
  - Input:  $3 per 1M tokens
  - Output: $15 per 1M tokens

Claude 3 Haiku:
  - Input:  $0.8 per 1M tokens
  - Output: $4 per 1M tokens
```

#### **Google Gemini**
```
Gemini 2.0 Flash:
  - Input:  $0.075 per 1M tokens
  - Output: $0.3 per 1M tokens

Gemini 1.5 Pro:
  - Input:  $1.25 per 1M tokens
  - Output: $5 per 1M tokens

Gemini 1.5 Flash:
  - Input:  $0.075 per 1M tokens
  - Output: $0.3 per 1M tokens
```

#### **Hugging Face**
```
Text Generation: ~$0.0001-0.0002 per token
Image Generation: ~$0.01 per image
```

#### **AWS Bedrock**
```
Claude Opus:
  - Input:  $15 per 1M tokens
  - Output: $75 per 1M tokens

Claude Sonnet:
  - Input:  $3 per 1M tokens
  - Output: $15 per 1M tokens
```

#### **Stripe Fees**
```
- 2.9% per transaction
- + $0.30 fixed fee per transaction
```

---

## 🎁 Subscription Tiers

### Tier Breakdown (80% Margin)

#### **Free Tier**
```
Price: $0/month (FREE)
Monthly Allowance: 50,000 tokens
API Requests: 100/month
Providers: OpenAI (GPT-3.5 only)
Models: gpt-3.5-turbo only
Cost to You: ~$5/month
Your Profit: $0 (promotional tier)
```

#### **Starter Tier** ⭐ Popular
```
Price: $19/month
Monthly Allowance: 500,000 tokens
API Requests: 1,000/month
Max Tokens/Request: 4,000
Providers: OpenAI, Anthropic
Models: gpt-3.5-turbo, claude-3-haiku
Cost to You: ~$3.80 (20% of $19)
Your Profit: ~$15.20 (80% of $19)
```

#### **Professional Tier** 🚀 Best Value
```
Price: $99/month
Monthly Allowance: 5,000,000 tokens
API Requests: 10,000/month
Max Tokens/Request: 8,000
Providers: OpenAI, Anthropic, Google
Models: gpt-4-turbo, claude-3-sonnet, gemini-1.5-pro
Cost to You: ~$19.80 (20% of $99)
Your Profit: ~$79.20 (80% of $99)
```

#### **Enterprise Tier** 🏆 Premium
```
Price: $499/month
Monthly Allowance: 50,000,000 tokens
API Requests: 100,000/month
Max Tokens/Request: 32,000
Providers: ALL (OpenAI, Anthropic, Google, HuggingFace, AWS)
Models: ALL available models
Cost to You: ~$99.80 (20% of $499)
Your Profit: ~$399.20 (80% of $499)
Includes: Dedicated support, custom integration, SLA
```

### Monthly Revenue Potential

```
If you acquire:
- 100 Starter users:    100 × $19  = $1,900/month
- 50 Professional:      50  × $99  = $4,950/month
- 10 Enterprise:        10  × $499 = $4,990/month
                        ───────────────────────
Total Revenue:                    = $11,840/month

Your Profit (80%):                = $9,472/month
Actual API Costs (20%):           = $2,368/month
```

---

## 🧮 Cost Calculations

### Formula

```
User Payment: $X per month
Your API Budget: $X × 0.20 = API_COST
Your Profit: $X × 0.80 = PROFIT

Example:
User pays $99 (Professional)
Your API budget = $99 × 0.20 = $19.80 maximum per user
Your profit = $99 × 0.80 = $79.20

If user actually uses $15 of API:
You keep: $79.20 + ($19.80 - $15) = $84
Margin on actual use: 85.7%
```

### Cost Calculation Method

```javascript
const { calculateApiCost } = require('./config/apiPricing');

// Cost for a GPT-4 request
const cost = calculateApiCost(
  'openai',           // provider
  'gpt-4-turbo',      // model
  500,                // input tokens
  1000                // output tokens
);
// Result: $0.025 (500/1K × $0.01 + 1000/1K × $0.03)
```

---

## 🛠️ Implementation Guide

### Step 1: Initialize Stripe Account

```bash
# Create Stripe account at https://stripe.com
# Get API keys from Dashboard → API Keys

# Add to .env
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 2: Create Stripe Products

```javascript
const { StripeService } = require('./backend/src/services/stripeService');

// Create products and prices in Stripe
const prices = await StripeService.createStripePrices();
// Returns: { starter: 'price_xxx', professional: 'price_yyy', ... }
```

### Step 3: Setup User Subscription

```javascript
const { StripeService } = require('./backend/src/services/stripeService');
const { CreditManager } = require('./backend/src/models/UserCredits');

// 1. Create Stripe customer
const customer = await StripeService.createCustomer(
  userId,
  'user@example.com',
  'John Doe'
);

// 2. Create subscription
const subscription = await StripeService.createSubscription(
  customer.id,
  'price_xxx',  // Price ID from Stripe
  'professional'
);

// 3. When payment succeeds, add credits
await CreditManager.addCredits(
  userId,
  1980,  // $19.80 × 100 = 1980 credits (1 credit = $0.01)
  'professional',
  subscription.id
);
```

### Step 4: Protect API Endpoints

```javascript
const express = require('express');
const {
  checkCreditsMiddleware,
  deductCreditsMiddleware,
  checkTierLimitsMiddleware,
  checkProviderAccessMiddleware
} = require('./backend/src/middleware/costProtection');

const app = express();

// OpenAI endpoint
app.post('/api/ai/openai', 
  checkCreditsMiddleware,
  checkTierLimitsMiddleware,
  checkProviderAccessMiddleware('openai'),
  deductCreditsMiddleware('openai', 'gpt-4-turbo'),
  async (req, res) => {
    // Your OpenAI API call here
  }
);

// Anthropic endpoint
app.post('/api/ai/anthropic',
  checkCreditsMiddleware,
  checkTierLimitsMiddleware,
  checkProviderAccessMiddleware('anthropic'),
  deductCreditsMiddleware('anthropic', 'claude-3-sonnet'),
  async (req, res) => {
    // Your Anthropic API call here
  }
);
```

### Step 5: Setup Webhook Handler

```javascript
const express = require('express');
const { handleStripeWebhook } = require('./backend/src/services/stripeService');

app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
```

---

## 📡 API Endpoints

### Credit Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/credits/balance` | GET | Get current credit balance |
| `/api/credits/usage` | GET | Get monthly usage statistics |
| `/api/credits/tiers` | GET | Get all available tiers |
| `/api/credits/tier-details/:tier` | GET | Get specific tier details |
| `/api/credits/current-tier` | GET | Get user's current tier |
| `/api/credits/upgrade` | POST | Upgrade to a new tier |
| `/api/credits/overage` | GET | Get overage charges |
| `/api/credits/recommendations` | GET | Get tier recommendations |

### Example Requests

#### Get Balance
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.appforge.dev/api/credits/balance

# Response
{
  "success": true,
  "data": {
    "totalCredits": 1980,
    "usedCredits": 450,
    "remainingCredits": 1530,
    "tier": "professional",
    "monthlyTokensUsed": 250000,
    "monthlyRequestsUsed": 450,
    "percentUsed": "22.73%"
  }
}
```

#### Get Usage
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.appforge.dev/api/credits/usage

# Response
{
  "success": true,
  "data": {
    "month": "2026-01-01T00:00:00.000Z",
    "totalTokens": 250000,
    "totalRequests": 450,
    "totalCost": 4.50,
    "byProvider": {
      "openai": {
        "tokens": 150000,
        "requests": 300,
        "cost": 2.50
      },
      "anthropic": {
        "tokens": 100000,
        "requests": 150,
        "cost": 2.00
      }
    }
  }
}
```

#### Get Tiers
```bash
curl https://api.appforge.dev/api/credits/tiers

# Response
{
  "success": true,
  "profitMargin": "80%",
  "data": {
    "free": { ... },
    "starter": {
      "name": "Starter",
      "price": 19,
      "limits": { ... },
      "margin": {
        "apiCostToYou": 3.80,
        "yourPrice": 19,
        "profitMargin": "80%"
      }
    },
    ...
  }
}
```

#### Upgrade Tier
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier":"professional"}' \
  https://api.appforge.dev/api/credits/upgrade

# Response
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_xxxxx"
}
```

---

## 🔗 Webhook Setup

### Stripe Webhook Events Handled

1. **customer.subscription.created** - New subscription started
2. **customer.subscription.updated** - Subscription changed
3. **customer.subscription.deleted** - Subscription cancelled
4. **invoice.payment_succeeded** - Payment received
5. **invoice.payment_failed** - Payment failed

### Setup Instructions

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/webhook/stripe`
3. Select events: Subscription + Invoice events
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 💡 Usage Examples

### Example 1: User Subscribes to Professional

```javascript
// User clicks "Upgrade to Professional"
const session = await StripeService.createCheckoutSession(userId, 'professional');

// Redirect to session.url for payment

// After payment, webhook triggers:
// 1. Stripe calls your webhook
// 2. handleStripeWebhook processes it
// 3. CreditManager.addCredits() adds $19.80 × 100 = 1980 credits
// 4. User can now make requests up to 5M tokens/month
```

### Example 2: User Makes API Request

```javascript
// User sends: "Write a 500-word article"
// GPT-4 response: 500 input tokens, 2000 output tokens

POST /api/ai/openai
Authorization: Bearer $TOKEN
{
  "model": "gpt-4-turbo",
  "messages": [...]
}

// Middleware:
// 1. checkCreditsMiddleware: ✅ User has 1530 credits remaining
// 2. checkTierLimitsMiddleware: ✅ Used 250K/5M tokens
// 3. checkProviderAccessMiddleware: ✅ Professional tier has OpenAI
// 4. Request processed
// 5. deductCreditsMiddleware: Calculates cost
//    Cost = (500/1K × $0.01) + (2000/1K × $0.03) = $0.065
// 6. Credits deducted: 1530 - 6 (credits) = 1524 remaining
// 7. Usage logged to ApiUsageLog

// Response includes:
{
  "content": "...",
  "credits": {
    "deducted": 6,
    "remaining": 1524,
    "monthlyUsage": {
      "tokens": 250500,
      "requests": 451,
      "cost": 4.565
    }
  }
}
```

### Example 3: User Approaches Limit

```javascript
// User has used 4.5M tokens (90% of 5M limit)

GET /api/credits/recommendations
Authorization: Bearer $TOKEN

// Response
{
  "success": true,
  "data": {
    "currentTier": "professional",
    "currentSpend": 18.50,
    "projectedMonthlySpend": 20.55,
    "recommendedTier": {
      "name": "Enterprise",
      "price": 499,
      "limits": { ... }
    }
  }
}

// UI shows: "You're approaching your limit. Consider upgrading to Enterprise."
```

---

## 📊 Monitoring & Analytics

### Dashboard Metrics

Track these metrics in your admin dashboard:

```javascript
// Monthly revenue
const monthlyRevenue = activeTiers.map(t => t.price).reduce((a, b) => a + b);

// Actual API costs
const actualApiCosts = users.reduce((sum, u) => sum + u.monthlyApiCost, 0);

// Profit
const profit = monthlyRevenue - actualApiCosts;

// Margin
const actualMargin = (profit / monthlyRevenue) * 100;

// Per-user metrics
const avgCostPerUser = actualApiCosts / totalUsers;
const avgRevenuePerUser = monthlyRevenue / totalUsers;
```

---

## 🎯 Best Practices

### For You (Provider)

1. ✅ Monitor actual API costs vs projected budget
2. ✅ Alert when user approaching limits (offer upgrade)
3. ✅ Track which providers/models are most popular
4. ✅ Adjust tier pricing quarterly based on actual costs
5. ✅ Offer yearly plans for better margins

### For Your Users

1. ✅ Show clear usage tracking
2. ✅ Warn at 80% of limits
3. ✅ Suggest upgrades based on usage
4. ✅ Provide usage history & analytics
5. ✅ Offer rollover or banking of unused tokens

---

## ⚠️ Important Notes

1. **Update Pricing**: Keep apiPricing.js updated as provider costs change
2. **Margin Adjustment**: Change the profitMargin parameter in SubscriptionTierCalculator if needed
3. **Overage Policy**: Currently $0.001 per 1K tokens - adjust based on your needs
4. **Stripe Rate**: Account for Stripe's 2.9% + $0.30 fee in your margin calculations
5. **Testing**: Use Stripe test keys during development

---

**Status**: ✅ Ready for Production Implementation

