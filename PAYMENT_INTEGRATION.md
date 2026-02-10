# Payment Integration Guide for Autonomous Swarm

## 💳 Payment Options

### Option 1: Solana Crypto Payments (EXISTING ✅)
You already have Solana payment infrastructure! Use it:

**Advantages:**
- ✅ Already built and deployed
- ✅ No payment processor fees  
- ✅ Instant settlement
- ✅ Global accessibility

**How It Works:**
```
User visits payment portal → Connects wallet → Pays with SOL
    ↓
Backend verifies signature → Generates license key
    ↓
Email sent with license key → User activates in VS Code
```

**Files:**
- `public/payment_portal.html` - Existing payment UI
- `backend/api/subscriptions.ts` - Subscription management
- Update to add swarm product SKU

### Option 2: Stripe (Traditional SaaS)
For users who prefer credit cards:

**Advantages:**
- Familiar payment method
- Recurring subscriptions built-in
- Wider audience

**Setup:**
1. Create Stripe account
2. Add Stripe Checkout
3. Webhook for subscription events
4. License generation on payment

### Option 3: Hybrid (RECOMMENDED 🌟)
Offer both Solana AND Stripe:

**Advantages:**
- ✅ Crypto users: Low fees, instant
- ✅ Traditional users: Credit cards
- ✅ Maximum reach

---

## 🚀 Quick Implementation (Using Existing Solana)

### 1. Add Swarm Product to Payment Portal

Update `public/payment_portal.html`:

```html
<!-- Add to product selection -->
<div class="product-card">
  <h3>🐝 Autonomous Swarm Pro</h3>
  <p>6 Quantum-Powered AI Agents</p>
  <div class="price">
    <span class="amount">$19/month</span>
    <span class="crypto">≈ 0.1 SOL</span>
  </div>
  <button onclick="selectProduct('swarm-pro-monthly')">
    Subscribe Monthly
  </button>
</div>

<div class="product-card">
  <h3>🐝 Autonomous Swarm Pro (Yearly)</h3>
  <p>Save 36% - Best Value!</p>
  <div class="price">
    <span class="amount">$149/year</span>
    <span class="crypto">≈ 0.75 SOL</span>
  </div>
  <button onclick="selectProduct('swarm-pro-yearly')">
    Subscribe Yearly
  </button>
</div>
```

### 2. Update Backend Product Catalog

Add to `backend/api/subscriptions.ts`:

```typescript
const PRODUCTS = {
  'swarm-pro-monthly': {
    name: 'Autonomous Swarm Pro (Monthly)',
    price_usd: 19,
    price_sol: 0.1, // Update based on current SOL price
    duration_days: 30,
    features: ['all_agents', 'unlimited_cycles', 'priority_support']
  },
  'swarm-pro-yearly': {
    name: 'Autonomous Swarm Pro (Yearly)',
    price_usd: 149,
    price_sol: 0.75,
    duration_days: 365,
    features: ['all_agents', 'unlimited_cycles', 'priority_support']
  }
};
```

### 3. License Generation After Payment

```typescript
// After payment verified
const license = LicenseValidator.generate(
  userEmail,
  'pro' // or 'enterprise'
);

// Send via email
await sendLicenseEmail(userEmail, license, productName);
```

### 4. Email Template

```html
Subject: Your Autonomous Swarm License Key

Hi there!

Thank you for subscribing to Autonomous Swarm Pro! 🐝

Your License Key:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{LICENSE_KEY_HERE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To activate:
1. Open VS Code
2. Install "Autonomous Swarm" extension
3. Press Ctrl+Shift+P
4. Run: "Autonomous Swarm: Enter License Key"
5. Paste your key above

Questions? Reply to this email or visit:
https://appforge.fun/docs/swarm

Happy coding!
The Autonomous Swarm Team
```

---

## 💰 Pricing Recommendations

### Suggested Tiers

**Free Trial:**
- Duration: 14 days
- Agents: 3 (Sentinel, BugHunter, Optimizer)
- Cycles: 10/day
- No credit card required

**Pro - $19/month or $149/year:**
- All 6 agents
- Unlimited cycles
- Priority email support
- Commercial use allowed
- **Save 36% with yearly**

**Enterprise - Custom:**
- All Pro features
- On-premise deployment
- Custom integrations
- Phone support
- SLA guarantee
- Pricing: $99/month per team (5+ users)

---

## 🔧 Complete Payment Flow

```
1. User lands on payment portal
   https://appforge.fun/swarm/subscribe

2. Selects plan (Monthly/Yearly)

3. Payment Method Choice:
   [Pay with Solana] [Pay with Card (Stripe)]

4a. Solana Flow:
   - Connect Phantom wallet
   - Approve transaction
   - Backend verifies signature
   
4b. Stripe Flow:
   - Enter card details
   - Stripe Checkout
   - Webhook confirms payment

5. License Generated:
   - JWT token created
   - Stored in database
   - Emailed to user

6. User Activates:
   - Pastes key in VS Code
   - Extension validates
   - All features unlocked!
```

---

## 📝 Implementation Checklist

### Using Existing Solana System (Quick - 1 hour)

- [ ] Add swarm products to payment portal HTML
- [ ] Update backend product catalog
- [ ] Test Solana payment flow
- [ ] Configure email template
- [ ] Update license validator to check payment status
- [ ] Deploy to production

### Adding Stripe (Additional - 2 hours)

- [ ] Create Stripe account
- [ ] Get API keys (publishable & secret)
- [ ] Add Stripe.js to payment portal
- [ ] Create Stripe products/prices
- [ ] Implement webhook endpoint
- [ ] Handle subscription renewals
- [ ] Test with Stripe test cards

---

## 🌐 Payment Portal URL

Host at:
- **Production:** `https://appforge.fun/swarm/subscribe`
- **Payment API:** `https://appforge.fun/api/subscriptions`

---

## 🔒 Security Checklist

- ✅ HTTPS only
- ✅ Signature verification (Solana)
- ✅ Webhook signature verification (Stripe)
- ✅ License key encryption (JWT)
- ✅ Email verification
- ✅ Rate limiting on payment endpoints
- ✅ No license key in client-side code

---

## 📊 Revenue Tracking

Track in database:
```sql
CREATE TABLE swarm_subscriptions (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  license_key TEXT,
  plan VARCHAR(50), -- 'monthly' or 'yearly'
  payment_method VARCHAR(20), -- 'solana' or 'stripe'
  amount_usd DECIMAL(10,2),
  status VARCHAR(20), -- 'active', 'expired', 'cancelled'
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 💡 Quick Start (Use What You Have!)

**Fastest Path:** Use your existing Solana payment system!

```bash
# 1. Update payment portal
edit public/payment_portal.html

# 2. Add swarm products
edit backend/api/subscriptions.ts

# 3. Test payment
# Visit: https://appforge.fun/payment_portal.html

# 4. Deploy
vercel deploy --prod
```

That's it! Your Solana infrastructure handles the rest.

---

## 🎯 Recommendation

**Start with Solana (you already have it!)**, then add Stripe later if needed.

**Advantages:**
- ✅ Zero dev time (reuse existing code)
- ✅ 0% payment fees (vs 2.9% Stripe)
- ✅ Instant settlement
- ✅ Crypto-native audience

**When to add Stripe:**
- If >30% users request credit cards
- If targeting enterprise (they prefer invoices)
- If expanding to non-crypto markets

Your existing payment system is production-ready! Just add the swarm product SKU and you're live! 🚀
