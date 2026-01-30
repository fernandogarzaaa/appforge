/**
 * User Credits & Usage Tracking System
 * Manages user credit balances and API usage tracking
 * Updated: January 2026
 */

const mongoose = require('mongoose');

// User Credits Schema
const userCreditsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Credit Balance
  totalCredits: {
    type: Number,
    default: 0,
    description: 'Total available credits'
  },
  
  usedCredits: {
    type: Number,
    default: 0,
    description: 'Credits used this billing period'
  },
  
  // Subscription Info
  subscriptionTier: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  },
  
  stripeSubscriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Billing Cycle
  billingCycleStart: Date,
  billingCycleEnd: Date,
  
  // Usage Tracking
  monthlyTokensUsed: {
    type: Number,
    default: 0
  },
  
  monthlyRequestsUsed: {
    type: Number,
    default: 0
  },
  
  monthlyApiCost: {
    type: Number,
    default: 0,
    description: 'Actual API cost to us this month'
  },
  
  // Provider-specific usage
  providerUsage: {
    type: Map,
    of: {
      tokensUsed: Number,
      requestsUsed: Number,
      cost: Number
    },
    default: new Map()
  },
  
  // Overage
  overageCharges: {
    type: Number,
    default: 0
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'pending'],
    default: 'pending'
  },
  
  nextBillingDate: Date,
  
  // Dates
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// API Usage Log Schema (for detailed tracking)
const apiUsageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  provider: {
    type: String,
    enum: ['openai', 'anthropic', 'google', 'hugging-face', 'aws'],
    required: true
  },
  
  model: {
    type: String,
    required: true
  },
  
  // Token tracking
  inputTokens: Number,
  outputTokens: Number,
  totalTokens: Number,
  
  // Cost
  cost: {
    type: Number,
    required: true
  },
  
  // Request details
  requestId: String,
  endpoint: String,
  status: {
    type: String,
    enum: ['success', 'failed', 'rate_limited'],
    default: 'success'
  },
  
  // Response time
  latencyMs: Number,
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Monthly usage summary
const monthlyUsageSummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  month: {
    type: Date,
    required: true
  },
  
  totalTokens: Number,
  totalRequests: Number,
  totalCost: Number,
  
  byProvider: {
    type: Map,
    of: {
      tokens: Number,
      requests: Number,
      cost: Number
    },
    default: new Map()
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Models
const UserCredits = mongoose.model('UserCredits', userCreditsSchema);
const ApiUsageLog = mongoose.model('ApiUsageLog', apiUsageLogSchema);
const MonthlySummary = mongoose.model('MonthlySummary', monthlyUsageSummarySchema);

/**
 * Credit Management Service
 */
class CreditManager {
  /**
   * Get user credit info
   */
  static async getCredits(userId) {
    let credits = await UserCredits.findOne({ userId });
    
    if (!credits) {
      credits = new UserCredits({ userId, subscriptionTier: 'free' });
      await credits.save();
    }
    
    return {
      totalCredits: credits.totalCredits,
      usedCredits: credits.usedCredits,
      remainingCredits: credits.totalCredits - credits.usedCredits,
      tier: credits.subscriptionTier,
      billingCycleEnd: credits.billingCycleEnd,
      monthlyTokensUsed: credits.monthlyTokensUsed,
      monthlyRequestsUsed: credits.monthlyRequestsUsed,
      monthlyApiCost: credits.monthlyApiCost
    };
  }

  /**
   * Deduct credits for API call
   */
  static async deductCredits(userId, provider, model, inputTokens, outputTokens, cost) {
    const credits = await UserCredits.findOne({ userId });
    if (!credits) throw new Error('User credits not found');

    // Check if sufficient credits
    if (credits.totalCredits - credits.usedCredits < cost) {
      throw new Error('Insufficient credits');
    }

    // Deduct credits
    credits.usedCredits += cost;
    credits.monthlyTokensUsed += (inputTokens + outputTokens);
    credits.monthlyRequestsUsed += 1;
    credits.monthlyApiCost += cost;

    // Update provider usage
    const providerKey = provider;
    if (!credits.providerUsage.has(providerKey)) {
      credits.providerUsage.set(providerKey, {
        tokensUsed: 0,
        requestsUsed: 0,
        cost: 0
      });
    }
    
    const usage = credits.providerUsage.get(providerKey);
    usage.tokensUsed += (inputTokens + outputTokens);
    usage.requestsUsed += 1;
    usage.cost += cost;

    credits.updatedAt = new Date();
    await credits.save();

    return {
      deducted: cost,
      remaining: credits.totalCredits - credits.usedCredits,
      monthlyUsage: {
        tokens: credits.monthlyTokensUsed,
        requests: credits.monthlyRequestsUsed,
        cost: credits.monthlyApiCost
      }
    };
  }

  /**
   * Log API usage
   */
  static async logUsage(userId, provider, model, inputTokens, outputTokens, cost, latency = 0) {
    const log = new ApiUsageLog({
      userId,
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      latencyMs: latency
    });

    await log.save();
    return log;
  }

  /**
   * Add credits (from subscription payment)
   */
  static async addCredits(userId, amount, tier, stripeSubscriptionId = null) {
    let credits = await UserCredits.findOne({ userId });
    
    if (!credits) {
      credits = new UserCredits({ userId });
    }

    // Reset monthly usage on subscription change
    credits.totalCredits += amount;
    credits.usedCredits = 0;
    credits.subscriptionTier = tier;
    credits.paymentStatus = 'active';
    credits.monthlyTokensUsed = 0;
    credits.monthlyRequestsUsed = 0;
    credits.monthlyApiCost = 0;

    if (stripeSubscriptionId) {
      credits.stripeSubscriptionId = stripeSubscriptionId;
    }

    // Set billing cycle (30 days)
    credits.billingCycleStart = new Date();
    credits.billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    credits.nextBillingDate = credits.billingCycleEnd;

    credits.updatedAt = new Date();
    await credits.save();

    return credits;
  }

  /**
   * Check if user has exceeded limits
   */
  static async checkLimits(userId, limits) {
    const credits = await UserCredits.findOne({ userId });
    if (!credits) return false;

    return credits.monthlyTokensUsed >= limits.monthlyTokens ||
           credits.monthlyRequestsUsed >= limits.monthlyRequests;
  }

  /**
   * Get usage summary for month
   */
  static async getMonthlyUsage(userId, month = new Date()) {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const logs = await ApiUsageLog.find({
      userId,
      timestamp: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const summary = {
      month: startOfMonth,
      totalTokens: 0,
      totalRequests: logs.length,
      totalCost: 0,
      byProvider: {}
    };

    for (const log of logs) {
      summary.totalTokens += log.totalTokens;
      summary.totalCost += log.cost;

      if (!summary.byProvider[log.provider]) {
        summary.byProvider[log.provider] = {
          tokens: 0,
          requests: 0,
          cost: 0
        };
      }

      summary.byProvider[log.provider].tokens += log.totalTokens;
      summary.byProvider[log.provider].requests += 1;
      summary.byProvider[log.provider].cost += log.cost;
    }

    return summary;
  }

  /**
   * Reset monthly limits (called on billing cycle renewal)
   */
  static async resetMonthlyLimits(userId) {
    const credits = await UserCredits.findOne({ userId });
    if (!credits) return;

    credits.monthlyTokensUsed = 0;
    credits.monthlyRequestsUsed = 0;
    credits.monthlyApiCost = 0;
    credits.usedCredits = 0;
    credits.overageCharges = 0;

    // Reset provider usage
    credits.providerUsage = new Map();

    // Set next billing cycle
    credits.billingCycleStart = new Date();
    credits.billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    credits.updatedAt = new Date();
    await credits.save();

    return credits;
  }
}

module.exports = {
  UserCredits,
  ApiUsageLog,
  MonthlySummary,
  CreditManager
};
