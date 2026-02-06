/**
 * Payment Configuration
 * Centralized configuration for Solana (Phantom) payments
 */

export interface PlanConfig {
  id: string;           // Plan ID for Solana pricing
  name: string;         // Display name
  price: number;        // Price in SOL
  description: string;  // Plan description
  features: string[];   // Plan features
  interval: 'MONTH' | 'YEAR';
  intervalCount: number;
}

const SOLANA_BASIC_PLAN_ID = (typeof process !== 'undefined' && process.env?.SOLANA_BASIC_PLAN_ID)
  || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOLANA_BASIC_PLAN_ID)
  || 'solana_basic_plan';
const SOLANA_PRO_PLAN_ID = (typeof process !== 'undefined' && process.env?.SOLANA_PRO_PLAN_ID)
  || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOLANA_PRO_PLAN_ID)
  || 'solana_pro_plan';
const SOLANA_PREMIUM_PLAN_ID = (typeof process !== 'undefined' && process.env?.SOLANA_PREMIUM_PLAN_ID)
  || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOLANA_PREMIUM_PLAN_ID)
  || 'solana_premium_plan';

/**
 * Available subscription plans (Solana)
 */
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  [SOLANA_BASIC_PLAN_ID]: {
    id: SOLANA_BASIC_PLAN_ID,
    name: 'Basic',
    price: 0.2,
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
  [SOLANA_PRO_PLAN_ID]: {
    id: SOLANA_PRO_PLAN_ID,
    name: 'Pro',
    price: 0.3,
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
  [SOLANA_PREMIUM_PLAN_ID]: {
    id: SOLANA_PREMIUM_PLAN_ID,
    name: 'Premium',
    price: 0.99,
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
 * Map legacy Stripe price IDs to Solana plans (migration safety)
 */
export const mapStripePriceToPaymongoPlan = (stripePriceId: string): string => {
  const mapping: Record<string, string> = {
    'price_1StWdZ8rNvlz2v0BtngMRUyS': SOLANA_BASIC_PLAN_ID,
    'price_1StWdZ8rNvlz2v0BV7sIV4A9': SOLANA_PRO_PLAN_ID,
    'price_1StWdZ8rNvlz2v0BSl7yx4v7': SOLANA_PREMIUM_PLAN_ID,
  };
  
  return mapping[stripePriceId] || stripePriceId;
};

/**
 * Determine plan name from amount (fallback method)
 * Used when price ID is not recognized
 */
export const getPlanNameByAmount = (amount: number): string => {
  if (amount === 0.2) return 'Basic';
  if (amount === 0.3) return 'Pro';
  if (amount === 0.99) return 'Premium';
  return 'Unknown';
};

/**
 * Payment configuration constants
 */
export const PAYMENT_CONFIG = {
  CURRENCY: 'SOL',
  PROVIDER: 'Solana',
  WEBHOOK_ENDPOINT: '/functions/phantomWebhook',
  SUCCESS_URL: '/?payment=success',
  CANCEL_URL: '/?payment=canceled',

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Timeout settings (milliseconds)
  REQUEST_TIMEOUT: 30000,
  WEBHOOK_TIMEOUT: 5000
} as const;

export default PLAN_CONFIGS;
