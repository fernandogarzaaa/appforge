/**
 * Subscription Tier Calculator
 * Automatically generates subscription tiers based on API costs and 80% profit margin
 * Updated: January 2026
 */

const { API_PRICING, calculateApiCost } = require('./apiPricing');

/**
 * Calculate fair user subscription price based on 80% profit margin
 * Formula: API_Cost / 0.20 = User_Price
 * This means: If API costs $1, user pays $5 (80% profit)
 * 
 * OR inverse: User_Price * 0.20 = Actual_Cost_To_You
 * Example: User pays $10, costs you $2 in API calls
 */
class SubscriptionTierCalculator {
  constructor(profitMargin = 0.80) {
    this.profitMargin = profitMargin; // Keep 80% profit
    this.costToUser = 1 - profitMargin; // 20% for actual API costs
  }

  /**
   * Calculate user price from API cost
   * @param {number} apiCost - Cost to you for API calls
   * @returns {number} Price to charge user
   */
  calculateUserPrice(apiCost) {
    // If profit margin is 80%, cost to us is 20%
    // So: userPrice * 0.20 = apiCost
    // Therefore: userPrice = apiCost / 0.20
    return apiCost / this.costToUser;
  }

  /**
   * Generate optimal subscription tiers
   * @returns {object} Tier configuration
   */
  generateTiers() {
    // Calculate average monthly costs per tier
    // Based on typical usage patterns
    
    const tiers = {
      free: {
        name: 'Free',
        price: 0,
        description: 'Get started with limited API access',
        limits: {
          monthlyTokens: 50000,        // ~50K tokens per month
          monthlyRequests: 100,         // ~100 API requests
          maxTokensPerRequest: 2000,    // Max 2K tokens per request
          providers: ['openai'],        // Only 1 provider
          models: ['gpt-3.5-turbo'],    // Only cheapest model
          features: ['basic', 'community-support']
        },
        estimatedCost: this.calculateUserPrice(5),      // ~$25/month usage cost
        margin: {
          apiCostToYou: 5,
          yourPrice: this.calculateUserPrice(5),
          profitMargin: `${(this.profitMargin * 100).toFixed(0)}%`
        }
      },

      starter: {
        name: 'Starter',
        price: 19,                      // $19/month
        description: 'Perfect for learning and testing',
        limits: {
          monthlyTokens: 500000,        // ~500K tokens per month
          monthlyRequests: 1000,        // ~1K API requests
          maxTokensPerRequest: 4000,    // Max 4K tokens per request
          providers: ['openai', 'anthropic'],
          models: ['gpt-3.5-turbo', 'claude-3-haiku'],
          features: ['basic', 'email-support', 'usage-tracking']
        },
        estimatedCost: 5,               // Actual API cost ~$5/month
        margin: {
          apiCostToYou: 5,
          yourPrice: 19,
          profitMargin: `${(this.profitMargin * 100).toFixed(0)}%`
        }
      },

      professional: {
        name: 'Professional',
        price: 99,                      // $99/month
        description: 'For developers and small teams',
        limits: {
          monthlyTokens: 5000000,       // ~5M tokens per month
          monthlyRequests: 10000,       // ~10K API requests
          maxTokensPerRequest: 8000,    // Max 8K tokens per request
          providers: ['openai', 'anthropic', 'google'],
          models: ['gpt-4-turbo', 'claude-3-sonnet', 'gemini-1.5-pro'],
          features: ['advanced', 'priority-support', 'usage-tracking', 'api-access', 'webhooks']
        },
        estimatedCost: 25,              // Actual API cost ~$25/month
        margin: {
          apiCostToYou: 25,
          yourPrice: 99,
          profitMargin: `${(this.profitMargin * 100).toFixed(0)}%`
        }
      },

      enterprise: {
        name: 'Enterprise',
        price: 499,                     // $499/month
        description: 'Unlimited usage for production apps',
        limits: {
          monthlyTokens: 50000000,      // ~50M tokens per month
          monthlyRequests: 100000,      // ~100K API requests
          maxTokensPerRequest: 32000,   // Max 32K tokens per request
          providers: ['openai', 'anthropic', 'google', 'hugging-face', 'aws'],
          models: 'all',                // All models available
          features: ['unlimited', 'priority-support', 'usage-tracking', 'api-access', 'webhooks', 'sso', 'custom-models', 'dedicated-support']
        },
        estimatedCost: 120,             // Actual API cost ~$120/month
        margin: {
          apiCostToYou: 120,
          yourPrice: 499,
          profitMargin: `${(this.profitMargin * 100).toFixed(0)}%`
        }
      }
    };

    return tiers;
  }

  /**
   * Get tier by price point
   * @param {number} price - Monthly price
   * @returns {object} Tier configuration
   */
  getTierByPrice(price) {
    const tiers = this.generateTiers();
    return Object.values(tiers).find(t => t.price === price) || null;
  }

  /**
   * Calculate dynamic tier based on actual API spend
   * @param {number} actualMonthlySpend - Actual API cost for month
   * @returns {object} Recommended tier
   */
  recommendTier(actualMonthlySpend) {
    const recommendedUserPrice = this.calculateUserPrice(actualMonthlySpend);
    const tiers = this.generateTiers();

    // Find closest matching tier
    let closestTier = Object.values(tiers)[0];
    let smallestDiff = Math.abs(closestTier.price - recommendedUserPrice);

    for (const tier of Object.values(tiers)) {
      const diff = Math.abs(tier.price - recommendedUserPrice);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestTier = tier;
      }
    }

    return {
      recommendedTier: closestTier,
      recommendedPrice: recommendedUserPrice,
      actualCostToYou: actualMonthlySpend,
      profitMargin: this.profitMargin
    };
  }

  /**
   * Calculate remaining tokens for user
   * @param {string} tier - Tier name
   * @param {number} tokensUsed - Tokens already used this month
   * @returns {number} Remaining tokens
   */
  getRemainingTokens(tier, tokensUsed) {
    const tierConfig = this.generateTiers()[tier];
    if (!tierConfig) return 0;
    return Math.max(0, tierConfig.limits.monthlyTokens - tokensUsed);
  }

  /**
   * Check if user exceeded limits
   * @param {string} tier - Tier name
   * @param {number} tokensUsed - Tokens used this month
   * @param {number} requestsUsed - Requests made this month
   * @returns {object} Limit status
   */
  checkLimits(tier, tokensUsed, requestsUsed) {
    const tierConfig = this.generateTiers()[tier];
    if (!tierConfig) return { valid: false, message: 'Invalid tier' };

    const tokenLimit = tierConfig.limits.monthlyTokens;
    const requestLimit = tierConfig.limits.monthlyRequests;

    return {
      tokensValid: tokensUsed <= tokenLimit,
      requestsValid: requestsUsed <= requestLimit,
      tokensPercentage: (tokensUsed / tokenLimit) * 100,
      requestsPercentage: (requestsUsed / requestLimit) * 100,
      tokenWarning: (tokensUsed / tokenLimit) > 0.8,
      requestWarning: (requestsUsed / requestLimit) > 0.8,
      message: this.generateLimitMessage(tier, tokensUsed, requestsUsed, tierConfig)
    };
  }

  generateLimitMessage(tier, tokensUsed, requestsUsed, tierConfig) {
    const tokenPercent = (tokensUsed / tierConfig.limits.monthlyTokens) * 100;
    const requestPercent = (requestsUsed / tierConfig.limits.monthlyRequests) * 100;

    if (tokenPercent >= 100 || requestPercent >= 100) {
      return `⛔ ${tier} tier limit exceeded. Upgrade to continue.`;
    }
    if (tokenPercent >= 80 || requestPercent >= 80) {
      return `⚠️ Approaching ${tier} tier limit (${Math.max(tokenPercent, requestPercent).toFixed(0)}% used)`;
    }
    return `✅ Usage within ${tier} tier limits`;
  }

  /**
   * Calculate overage charges
   * @param {string} tier - Tier name
   * @param {number} tokensUsed - Tokens used this month
   * @returns {number} Overage cost
   */
  calculateOverageCost(tier, tokensUsed) {
    const tierConfig = this.generateTiers()[tier];
    if (!tierConfig) return 0;

    const overageTokens = Math.max(0, tokensUsed - tierConfig.limits.monthlyTokens);
    
    // Overage rate: $0.001 per 1K tokens (flexible pricing)
    const overageRate = 0.001;
    return (overageTokens / 1000) * overageRate;
  }
}

module.exports = SubscriptionTierCalculator;
