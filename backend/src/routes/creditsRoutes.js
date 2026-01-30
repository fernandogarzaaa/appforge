/**
 * Credits & Usage API Routes
 * Endpoints for managing user credits and tracking API usage
 * Updated: January 2026
 */

const express = require('express');
const router = express.Router();
const { CreditManager } = require('../models/UserCredits');
const { StripeService } = require('../services/stripeService');
const SubscriptionTierCalculator = require('../services/subscriptionTierCalculator');
const { checkCreditsMiddleware } = require('../middleware/costProtection');

const calculator = new SubscriptionTierCalculator(0.80);

/**
 * GET /api/credits/balance
 * Get user's current credit balance
 */
router.get('/balance', checkCreditsMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await CreditManager.getCredits(userId);

    res.json({
      success: true,
      data: {
        ...credits,
        tier: credits.tier,
        percentUsed: (credits.usedCredits / credits.totalCredits * 100).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credits/usage
 * Get detailed usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.query.month ? new Date(req.query.month) : new Date();

    const usage = await CreditManager.getMonthlyUsage(userId, month);
    const tiers = calculator.generateTiers();

    res.json({
      success: true,
      data: {
        ...usage,
        byProvider: Object.fromEntries(usage.byProvider || new Map())
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credits/tiers
 * Get all available subscription tiers with pricing
 */
router.get('/tiers', async (req, res) => {
  try {
    const tiers = calculator.generateTiers();

    res.json({
      success: true,
      profitMargin: '80%',
      data: tiers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credits/tier-details/:tier
 * Get detailed information about a specific tier
 */
router.get('/tier-details/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    const tiers = calculator.generateTiers();
    const tierData = tiers[tier];

    if (!tierData) {
      return res.status(404).json({
        success: false,
        error: 'Tier not found'
      });
    }

    // Calculate per-day allowances
    const perDayTokens = (tierData.limits.monthlyTokens / 30).toFixed(0);
    const perDayRequests = (tierData.limits.monthlyRequests / 30).toFixed(0);

    res.json({
      success: true,
      data: {
        ...tierData,
        dailyAllowances: {
          tokens: perDayTokens,
          requests: perDayRequests
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/credits/upgrade
 * Upgrade user to a new tier (initiates Stripe checkout)
 */
router.post('/upgrade', async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier } = req.body;

    const tiers = calculator.generateTiers();
    const tierData = tiers[tier];

    if (!tierData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier'
      });
    }

    if (tierData.price === 0) {
      return res.status(400).json({
        success: false,
        error: 'Free tier cannot be upgraded to'
      });
    }

    // Create checkout session
    const session = await StripeService.createCheckoutSession(userId, tier);

    res.json({
      success: true,
      checkoutUrl: session.url
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credits/current-tier
 * Get user's current subscription tier
 */
router.get('/current-tier', async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await CreditManager.getCredits(userId);
    const tierData = calculator.generateTiers()[credits.tier];

    res.json({
      success: true,
      data: {
        currentTier: credits.tier,
        ...tierData,
        billingCycleEnd: credits.billingCycleEnd,
        nextBillingDate: credits.nextBillingDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credits/overage
 * Get overage charges for current month
 */
router.get('/overage', async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await CreditManager.getCredits(userId);
    const tierData = calculator.generateTiers()[credits.tier];

    const overage = calculator.calculateOverageCost(
      credits.tier,
      credits.monthlyTokensUsed
    );

    res.json({
      success: true,
      data: {
        monthlyTokensUsed: credits.monthlyTokensUsed,
        monthlyTokensLimit: tierData.limits.monthlyTokens,
        overageTokens: Math.max(0, credits.monthlyTokensUsed - tierData.limits.monthlyTokens),
        overageCharge: overage,
        overageRate: '$0.001 per 1K tokens'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/credits/reset-for-admin
 * Admin endpoint to reset user credits (for testing/refunds)
 */
router.post('/reset-for-admin', async (req, res) => {
  try {
    // Verify admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { userId } = req.body;
    const result = await CreditManager.resetMonthlyLimits(userId);

    res.json({
      success: true,
      message: 'Credits reset successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credits/recommendations
 * Get tier recommendations based on actual usage
 */
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await CreditManager.getCredits(userId);

    // Project next month's spend
    const daysInMonth = 30;
    const daysPassed = Math.min(
      new Date().getDate(),
      daysInMonth
    );

    const projectedMonthlySpend = (credits.monthlyApiCost / daysPassed) * daysInMonth;

    const recommendation = calculator.recommendTier(projectedMonthlySpend);

    res.json({
      success: true,
      data: {
        currentTier: credits.tier,
        currentSpend: credits.monthlyApiCost,
        projectedMonthlySpend: projectedMonthlySpend.toFixed(2),
        ...recommendation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
