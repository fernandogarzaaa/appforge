/**
 * Payment Configuration
 * Centralized configuration for all payment-related settings
 * 
 * IMPORTANT: Update these price IDs after creating plans in Xendit dashboard
 * See XENDIT_MIGRATION_GUIDE.md for instructions
 */

/**
 * Xendit Plan Configuration
 * 
 * Steps to set up Xendit plans:
 * 1. Log into Xendit Dashboard (https://dashboard.xendit.co)
 * 2. Navigate to Products > Recurring Plans
 * 3. Create three recurring plans:
 *    - Basic Plan: $20/month USD
 *    - Pro Plan: $30/month USD  
 *    - Premium Plan: $99/month USD
 * 4. Copy the generated price IDs below
 * 
 * For now, we're using Stripe price IDs as placeholders for backward compatibility.
 * These will be replaced with Xendit recurring plan IDs once created.
 */

export interface PlanConfig {
  id: string;           // Price/Plan ID from Xendit
  name: string;         // Display name
  price: number;        // Price in USD
  description: string;  // Plan description
  features: string[];   // Plan features
  interval: 'MONTH' | 'YEAR';
  intervalCount: number;
}

/**
 * Available subscription plans
 * 
 * TODO: Replace these Stripe IDs with Xendit recurring plan IDs
 * Current IDs are temporary placeholders from the old Stripe integration
 */
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': {
    id: 'price_1StWdZ8rNvlz2v0BtngMRUyS',
    name: 'Basic',
    price: 20,
    description: 'Perfect for small projects',
    features: [
      'Up to 5 projects',
      'Basic analytics',
      'Email support',
      '1GB storage'
    ],
    interval: 'MONTH',
    intervalCount: 1
  },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': {
    id: 'price_1StWdZ8rNvlz2v0BV7sIV4A9',
    name: 'Pro',
    price: 30,
    description: 'For growing teams',
    features: [
      'Up to 20 projects',
      'Advanced analytics',
      'Priority email support',
      '10GB storage',
      'Team collaboration'
    ],
    interval: 'MONTH',
    intervalCount: 1
  },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': {
    id: 'price_1StWdZ8rNvlz2v0BSl7yx4v7',
    name: 'Premium',
    price: 99,
    description: 'For enterprises',
    features: [
      'Unlimited projects',
      'Enterprise analytics',
      '24/7 phone support',
      'Unlimited storage',
      'Team collaboration',
      'Custom integrations',
      'SLA guarantee'
    ],
    interval: 'MONTH',
    intervalCount: 1
  }
};

/**
 * Get plan configuration by ID
 */
export const getPlanById = (priceId: string): PlanConfig | null => {
  return PLAN_CONFIGS[priceId] || null;
};

/**
 * Get all available plans
 */
export const getAllPlans = (): PlanConfig[] => {
  return Object.values(PLAN_CONFIGS);
};

/**
 * Map legacy Stripe price ID to Xendit plan (for migration period)
 * 
 * During migration, this helps maintain backward compatibility
 * with existing database records that store Stripe price IDs
 */
export const mapStripePriceToXenditPlan = (stripePriceId: string): string => {
  // For now, return the same ID since we're using placeholders
  // Once Xendit plans are created, update this mapping:
  const mapping: Record<string, string> = {
    'price_1StWdZ8rNvlz2v0BtngMRUyS': 'XENDIT_BASIC_PLAN_ID',    // TODO: Replace
    'price_1StWdZ8rNvlz2v0BV7sIV4A9': 'XENDIT_PRO_PLAN_ID',      // TODO: Replace  
    'price_1StWdZ8rNvlz2v0BSl7yx4v7': 'XENDIT_PREMIUM_PLAN_ID'   // TODO: Replace
  };
  
  return mapping[stripePriceId] || stripePriceId;
};

/**
 * Determine plan name from amount (fallback method)
 * Used when price ID is not recognized
 */
export const getPlanNameByAmount = (amount: number): string => {
  if (amount === 20) return 'Basic';
  if (amount === 30) return 'Pro';
  if (amount === 99) return 'Premium';
  return 'Unknown';
};

/**
 * Payment configuration constants
 */
export const PAYMENT_CONFIG = {
  CURRENCY: 'USD',
  PROVIDER: 'Xendit',
  WEBHOOK_ENDPOINT: '/api/webhooks/xendit',
  SUCCESS_URL: '/?payment=success',
  CANCEL_URL: '/?payment=canceled',
  
  // Xendit API settings
  API_VERSION: '2020-02-14',
  API_BASE: 'https://api.xendit.co/v4',
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Timeout settings (milliseconds)
  REQUEST_TIMEOUT: 30000,
  WEBHOOK_TIMEOUT: 5000
} as const;

export default PLAN_CONFIGS;
