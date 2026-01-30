/**
 * API Cost Protection Middleware
 * Protects API endpoints and deducts credits before allowing requests
 * Updated: January 2026
 */

import { CreditManager } from '../models/UserCredits.js';
import { calculateApiCost } from '../config/apiPricing.js';
import SubscriptionTierCalculator from '../services/subscriptionTierCalculator.js';

const calculator = new SubscriptionTierCalculator(0.80);

/**
 * Middleware to check user credits before API call
 */
const checkCreditsMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user credits
    const creditsInfo = await CreditManager.getCredits(userId);

    // Check if user has any credits or is within limits
    if (creditsInfo.remainingCredits <= 0) {
      return res.status(403).json({
        error: 'Insufficient credits',
        remainingCredits: 0,
        tier: creditsInfo.tier,
        message: `Your ${creditsInfo.tier} tier has run out of credits. Upgrade your subscription to continue.`,
        upgradeUrl: '/upgrade'
      });
    }

    // Attach credits info to request
    req.userCredits = creditsInfo;

    next();
  } catch (error) {
    console.error('Credit check error:', error);
    res.status(500).json({ error: 'Credit check failed' });
  }
};

/**
 * Middleware to deduct credits after successful API call
 */
const deductCreditsMiddleware = (provider, model) => {
  return async (req, res, next) => {
    // Wrap res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = async function(data) {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return originalJson(data);
        }

        // Extract token information from response
        const inputTokens = data.usage?.prompt_tokens || data.inputTokens || 0;
        const outputTokens = data.usage?.completion_tokens || data.outputTokens || 0;

        // Calculate cost
        const cost = calculateApiCost(provider, model, inputTokens, outputTokens);

        // Deduct credits
        if (cost > 0) {
          const result = await CreditManager.deductCredits(
            userId,
            provider,
            model,
            inputTokens,
            outputTokens,
            cost
          );

          // Log usage
          await CreditManager.logUsage(
            userId,
            provider,
            model,
            inputTokens,
            outputTokens,
            cost,
            data.responseTime || 0
          );

          // Add credit info to response
          data.credits = {
            deducted: result.deducted,
            remaining: result.remaining,
            monthlyUsage: result.monthlyUsage
          };
        }

        return originalJson(data);
      } catch (error) {
        console.error('Credit deduction error:', error);
        // Still return response even if credit deduction fails
        return originalJson(data);
      }
    };

    next();
  };
};

/**
 * Middleware to check tier-based request limits
 */
const checkTierLimitsMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const creditsInfo = await CreditManager.getCredits(userId);
    const tierConfig = calculator.generateTiers()[creditsInfo.tier];

    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Check if user exceeded limits
    const limitCheck = calculator.checkLimits(
      creditsInfo.tier,
      creditsInfo.monthlyTokensUsed,
      creditsInfo.monthlyRequestsUsed
    );

    if (!limitCheck.tokensValid || !limitCheck.requestsValid) {
      return res.status(429).json({
        error: 'Tier limit exceeded',
        message: limitCheck.message,
        limits: {
          monthlyTokens: tierConfig.limits.monthlyTokens,
          monthlyRequests: tierConfig.limits.monthlyRequests,
          tokensUsed: creditsInfo.monthlyTokensUsed,
          requestsUsed: creditsInfo.monthlyRequestsUsed
        },
        tier: creditsInfo.tier,
        upgradeUrl: '/upgrade'
      });
    }

    // Warn if approaching limits
    if (limitCheck.tokenWarning || limitCheck.requestWarning) {
      res.setHeader('X-Usage-Warning', limitCheck.message);
    }

    // Attach limit info to request
    req.tierLimits = limitCheck;

    next();
  } catch (error) {
    console.error('Tier limit check error:', error);
    res.status(500).json({ error: 'Tier limit check failed' });
  }
};

/**
 * Middleware to check specific provider access
 */
const checkProviderAccessMiddleware = (requiredProvider) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const creditsInfo = await CreditManager.getCredits(userId);
      const tierConfig = calculator.generateTiers()[creditsInfo.tier];

      if (!tierConfig) {
        return res.status(400).json({ error: 'Invalid subscription tier' });
      }

      // Check if provider is available for this tier
      if (!tierConfig.limits.providers.includes(requiredProvider)) {
        return res.status(403).json({
          error: 'Provider not available',
          message: `${requiredProvider} is not available in your ${creditsInfo.tier} tier`,
          availableProviders: tierConfig.limits.providers,
          tier: creditsInfo.tier,
          upgradeUrl: '/upgrade'
        });
      }

      next();
    } catch (error) {
      console.error('Provider access check error:', error);
      res.status(500).json({ error: 'Provider access check failed' });
    }
  };
};

/**
 * Middleware to rate limit based on tier
 */
const rateLimitByTierMiddleware = (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get rate limit headers
    const tier = req.userCredits?.tier || 'free';
    const limits = {
      free: { requestsPerMinute: 10, requestsPerHour: 100 },
      starter: { requestsPerMinute: 30, requestsPerHour: 500 },
      professional: { requestsPerMinute: 100, requestsPerHour: 5000 },
      enterprise: { requestsPerMinute: 1000, requestsPerHour: 50000 }
    };

    const tierLimit = limits[tier];

    // These would need Redis implementation for actual rate limiting
    res.setHeader('X-RateLimit-Limit', tierLimit.requestsPerMinute);
    res.setHeader('X-RateLimit-Remaining', tierLimit.requestsPerMinute);
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    res.status(500).json({ error: 'Rate limit check failed' });
  }
};

export {
  checkCreditsMiddleware,
  deductCreditsMiddleware,
  checkTierLimitsMiddleware,
  checkProviderAccessMiddleware,
  rateLimitByTierMiddleware
};
