/**
 * Payment Configuration
 * Centralized configuration for all payment-related settings
 * 
 * IMPORTANT: Update these price IDs after creating plans in PayMongo dashboard
 * See PAYMONGO_MIGRATION_GUIDE.md for instructions
 */

/**
 * PayMongo Plan Configuration
 * 
 * Steps to set up PayMongo recurring plans:
 * 1. Log into PayMongo Dashboard (https://dashboard.paymongo.com)
 * 2. Create three recurring products/plans:
 *    - Basic Plan: $20/month USD (or PHP equivalent)
 *    - Pro Plan: $30/month USD  
 *    - Premium Plan: $99/month USD
 * 3. Copy the generated plan/price IDs below
 * 
 * For now, we're using placeholder IDs for backward compatibility.
 * Replace them with PayMongo plan IDs once created.
 */

export interface PlanConfig {
  id: string;           // Price/Plan ID from PayMongo
  name: string;         // Display name
  price: number;        // Price in USD
  description: string;  // Plan description
  features: string[];   // Plan features
  interval: 'MONTH' | 'YEAR';
  intervalCount: number;
}

const PAYMONGO_BASIC_PLAN_ID = (typeof process !== 'undefined' && process.env?.PAYMONGO_BASIC_PLAN_ID)
  || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYMONGO_BASIC_PLAN_ID)
  || 'paymongo_basic_plan';
const PAYMONGO_PRO_PLAN_ID = (typeof process !== 'undefined' && process.env?.PAYMONGO_PRO_PLAN_ID)
  || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYMONGO_PRO_PLAN_ID)
  || 'paymongo_pro_plan';
const PAYMONGO_PREMIUM_PLAN_ID = (typeof process !== 'undefined' && process.env?.PAYMONGO_PREMIUM_PLAN_ID)
  || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYMONGO_PREMIUM_PLAN_ID)
  || 'paymongo_premium_plan';

/**
 * Available subscription plans
 * 
 * TODO: Replace these placeholders with PayMongo recurring plan IDs
 * Current IDs are temporary placeholders from the old Stripe integration
 */
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  [PAYMONGO_BASIC_PLAN_ID]: {
    id: PAYMONGO_BASIC_PLAN_ID,
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
  [PAYMONGO_PRO_PLAN_ID]: {
    id: PAYMONGO_PRO_PLAN_ID,
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
  [PAYMONGO_PREMIUM_PLAN_ID]: {
    id: PAYMONGO_PREMIUM_PLAN_ID,
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
 * Map legacy Stripe price ID to PayMongo plan (for migration period)
 * 
 * During migration, this helps maintain backward compatibility
 * with existing database records that store Stripe price IDs
 */
export const mapStripePriceToPaymongoPlan = (stripePriceId: string): string => {
  const mapping: Record<string, string> = {
    'price_1StWdZ8rNvlz2v0BtngMRUyS': PAYMONGO_BASIC_PLAN_ID,
    'price_1StWdZ8rNvlz2v0BV7sIV4A9': PAYMONGO_PRO_PLAN_ID,
    'price_1StWdZ8rNvlz2v0BSl7yx4v7': PAYMONGO_PREMIUM_PLAN_ID,
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
  PROVIDER: 'PayMongo',
  WEBHOOK_ENDPOINT: '/api/webhooks/paymongo',
  SUCCESS_URL: '/?payment=success',
  CANCEL_URL: '/?payment=canceled',
  
  // PayMongo API settings
  API_VERSION: '2023-08-01',
  API_BASE: 'https://api.paymongo.com/v1',
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Timeout settings (milliseconds)
  REQUEST_TIMEOUT: 30000,
  WEBHOOK_TIMEOUT: 5000
} as const;

export default PLAN_CONFIGS;
