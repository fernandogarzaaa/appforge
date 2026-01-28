// deno-lint-ignore-file
// @ts-nocheck
/**
 * Advanced API Rate Limiting & Quota Management
 * Implements tiered rate limiting with usage tracking and analytics
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Rate limit configurations by subscription tier
const RATE_LIMITS = {
  free: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    concurrentRequests: 5,
    quotas: {
      aiRequests: 50,
      storage: 1024 * 1024 * 1024, // 1GB
      apiCalls: 10000,
      webhooks: 10
    }
  },
  basic: {
    requestsPerMinute: 120,
    requestsPerHour: 5000,
    requestsPerDay: 100000,
    concurrentRequests: 10,
    quotas: {
      aiRequests: 500,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
      apiCalls: 100000,
      webhooks: 50
    }
  },
  pro: {
    requestsPerMinute: 300,
    requestsPerHour: 15000,
    requestsPerDay: 500000,
    concurrentRequests: 25,
    quotas: {
      aiRequests: 2000,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
      apiCalls: 500000,
      webhooks: 200
    }
  },
  premium: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 2000000,
    concurrentRequests: 100,
    quotas: {
      aiRequests: 10000,
      storage: 500 * 1024 * 1024 * 1024, // 500GB
      apiCalls: 2000000,
      webhooks: 1000
    }
  }
};

// In-memory storage (use Redis in production)
const rateLimitStore = new Map();
const usageStats = new Map();

interface RateLimitInfo {
  userId: string;
  tier: keyof typeof RATE_LIMITS;
  requests: {
    minute: { count: number; resetAt: Date };
    hour: { count: number; resetAt: Date };
    day: { count: number; resetAt: Date };
  };
  concurrent: number;
  usage: {
    aiRequests: number;
    storage: number;
    apiCalls: number;
    webhooks: number;
  };
}

/**
 * Check rate limit and track usage
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, resourceType } = await req.json();

    // Get user's subscription tier
    const subscriptionResponse = await base44.functions.invoke('getSubscriptionInfo', {});
    const tier = (subscriptionResponse?.data?.plan?.toLowerCase() || 'free') as keyof typeof RATE_LIMITS;
    const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;

    // Get or create rate limit info
    let limitInfo = rateLimitStore.get(user.id) as RateLimitInfo;
    const now = new Date();

    if (!limitInfo) {
      limitInfo = {
        userId: user.id,
        tier,
        requests: {
          minute: { count: 0, resetAt: new Date(now.getTime() + 60 * 1000) },
          hour: { count: 0, resetAt: new Date(now.getTime() + 60 * 60 * 1000) },
          day: { count: 0, resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
        },
        concurrent: 0,
        usage: {
          aiRequests: 0,
          storage: 0,
          apiCalls: 0,
          webhooks: 0
        }
      };
      rateLimitStore.set(user.id, limitInfo);
    }

    // Reset counters if needed
    if (now > limitInfo.requests.minute.resetAt) {
      limitInfo.requests.minute = { 
        count: 0, 
        resetAt: new Date(now.getTime() + 60 * 1000) 
      };
    }
    if (now > limitInfo.requests.hour.resetAt) {
      limitInfo.requests.hour = { 
        count: 0, 
        resetAt: new Date(now.getTime() + 60 * 60 * 1000) 
      };
    }
    if (now > limitInfo.requests.day.resetAt) {
      limitInfo.requests.day = { 
        count: 0, 
        resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) 
      };
      // Reset daily quotas
      limitInfo.usage = {
        aiRequests: 0,
        storage: limitInfo.usage.storage, // Storage persists
        apiCalls: 0,
        webhooks: 0
      };
    }

    switch (action) {
      case 'check': {
        // Check if request is allowed
        const allowed = 
          limitInfo.requests.minute.count < limits.requestsPerMinute &&
          limitInfo.requests.hour.count < limits.requestsPerHour &&
          limitInfo.requests.day.count < limits.requestsPerDay &&
          limitInfo.concurrent < limits.concurrentRequests;

        if (!allowed) {
          const reason = [];
          if (limitInfo.requests.minute.count >= limits.requestsPerMinute) {
            reason.push('Minute limit exceeded');
          }
          if (limitInfo.requests.hour.count >= limits.requestsPerHour) {
            reason.push('Hour limit exceeded');
          }
          if (limitInfo.requests.day.count >= limits.requestsPerDay) {
            reason.push('Daily limit exceeded');
          }
          if (limitInfo.concurrent >= limits.concurrentRequests) {
            reason.push('Concurrent request limit exceeded');
          }

          return Response.json({
            allowed: false,
            reason: reason.join(', '),
            limits: {
              tier,
              minute: {
                limit: limits.requestsPerMinute,
                remaining: Math.max(0, limits.requestsPerMinute - limitInfo.requests.minute.count),
                reset: limitInfo.requests.minute.resetAt
              },
              hour: {
                limit: limits.requestsPerHour,
                remaining: Math.max(0, limits.requestsPerHour - limitInfo.requests.hour.count),
                reset: limitInfo.requests.hour.resetAt
              },
              day: {
                limit: limits.requestsPerDay,
                remaining: Math.max(0, limits.requestsPerDay - limitInfo.requests.day.count),
                reset: limitInfo.requests.day.resetAt
              }
            }
          }, { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limits.requestsPerMinute.toString(),
              'X-RateLimit-Remaining': Math.max(0, limits.requestsPerMinute - limitInfo.requests.minute.count).toString(),
              'X-RateLimit-Reset': limitInfo.requests.minute.resetAt.toISOString(),
              'Retry-After': Math.ceil((limitInfo.requests.minute.resetAt.getTime() - now.getTime()) / 1000).toString()
            }
          });
        }

        // Increment counters
        limitInfo.requests.minute.count++;
        limitInfo.requests.hour.count++;
        limitInfo.requests.day.count++;
        limitInfo.concurrent++;

        // Track resource-specific usage
        if (resourceType === 'ai') {
          limitInfo.usage.aiRequests++;
        } else if (resourceType === 'api') {
          limitInfo.usage.apiCalls++;
        } else if (resourceType === 'webhook') {
          limitInfo.usage.webhooks++;
        }

        return Response.json({
          allowed: true,
          limits: {
            tier,
            minute: {
              limit: limits.requestsPerMinute,
              remaining: Math.max(0, limits.requestsPerMinute - limitInfo.requests.minute.count),
              reset: limitInfo.requests.minute.resetAt
            },
            hour: {
              limit: limits.requestsPerHour,
              remaining: Math.max(0, limits.requestsPerHour - limitInfo.requests.hour.count),
              reset: limitInfo.requests.hour.resetAt
            },
            day: {
              limit: limits.requestsPerDay,
              remaining: Math.max(0, limits.requestsPerDay - limitInfo.requests.day.count),
              reset: limitInfo.requests.day.resetAt
            }
          },
          usage: limitInfo.usage,
          quotas: limits.quotas
        }, {
          headers: {
            'X-RateLimit-Limit': limits.requestsPerMinute.toString(),
            'X-RateLimit-Remaining': Math.max(0, limits.requestsPerMinute - limitInfo.requests.minute.count).toString(),
            'X-RateLimit-Reset': limitInfo.requests.minute.resetAt.toISOString()
          }
        });
      }

      case 'release': {
        // Release concurrent request slot
        if (limitInfo.concurrent > 0) {
          limitInfo.concurrent--;
        }

        return Response.json({ success: true }, { status: 200 });
      }

      case 'getUsage': {
        // Get current usage stats
        return Response.json({
          tier,
          limits: limits,
          current: {
            requests: {
              minute: limitInfo.requests.minute.count,
              hour: limitInfo.requests.hour.count,
              day: limitInfo.requests.day.count
            },
            concurrent: limitInfo.concurrent,
            usage: limitInfo.usage
          },
          quotas: {
            aiRequests: {
              used: limitInfo.usage.aiRequests,
              limit: limits.quotas.aiRequests,
              percentage: (limitInfo.usage.aiRequests / limits.quotas.aiRequests) * 100
            },
            storage: {
              used: limitInfo.usage.storage,
              limit: limits.quotas.storage,
              percentage: (limitInfo.usage.storage / limits.quotas.storage) * 100
            },
            apiCalls: {
              used: limitInfo.usage.apiCalls,
              limit: limits.quotas.apiCalls,
              percentage: (limitInfo.usage.apiCalls / limits.quotas.apiCalls) * 100
            },
            webhooks: {
              used: limitInfo.usage.webhooks,
              limit: limits.quotas.webhooks,
              percentage: (limitInfo.usage.webhooks / limits.quotas.webhooks) * 100
            }
          }
        }, { status: 200 });
      }

      case 'checkQuota': {
        // Check if specific quota is available
        const quotaType = resourceType as keyof typeof limits.quotas;
        const currentUsage = limitInfo.usage[quotaType as keyof typeof limitInfo.usage] || 0;
        const quotaLimit = limits.quotas[quotaType];

        const available = currentUsage < quotaLimit;

        return Response.json({
          available,
          quota: quotaType,
          used: currentUsage,
          limit: quotaLimit,
          remaining: Math.max(0, quotaLimit - currentUsage)
        }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Rate limit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Cleanup old entries every hour
setInterval(() => {
  const now = new Date();
  for (const [userId, limitInfo] of rateLimitStore.entries()) {
    // Remove if day counter is expired and no recent activity
    if (now > limitInfo.requests.day.resetAt && limitInfo.concurrent === 0) {
      rateLimitStore.delete(userId);
    }
  }
}, 60 * 60 * 1000);
