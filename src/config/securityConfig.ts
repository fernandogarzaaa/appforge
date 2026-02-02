/**
 * Security Configuration
 * Rate limiting and DDoS protection settings
 */

export const securityConfig = {
  // Rate Limiting Configuration
  rateLimiting: {
    enabled: true,

    // Per-user limits (authenticated users)
    perUser: {
      limit: 1000, // requests
      window: 60000, // milliseconds (1 minute)
    },

    // Per-IP limits (anonymous users)
    perIP: {
      limit: 5000,
      window: 60000,
    },

    // Quantum analysis endpoints (stricter)
    quantumAnalysis: {
      limit: 100,
      window: 60000,
    },

    // API key endpoints (generous)
    apiKey: {
      limit: 10000,
      window: 60000,
    },

    // Burst allowance (temporary spike tolerance)
    burst: {
      multiplier: 1.5, // 150% of normal limit
      window: 5000, // 5 seconds
    },

    // Endpoints exempt from rate limiting
    whitelist: [
      '/health',
      '/status',
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/reset-password',
    ],
  },

  // DDoS Protection Configuration
  ddos: {
    enabled: true,

    // Detection thresholds
    detection: {
      requestsPerSecondThreshold: 1000,
      uniqueIPsThreshold: 10000,
      suspiciousPatternsThreshold: 75, // confidence %
    },

    // Response strategies
    strategies: {
      enableChallenges: true, // CAPTCHA-style challenges
      enableRateLimiting: true,
      enableBlocklisting: true,
    },

    // Geo-blocking (ISO 3166-1 alpha-2 country codes)
    geoBlocking: {
      enabled: false,
      allowedCountries: [], // Empty = allow all
      blockedCountries: [], // Add country codes to block
    },

    // CloudFlare integration
    cloudflare: {
      enabled: process.env.CLOUDFLARE_ENABLED === 'true',
      apiKey: process.env.CLOUDFLARE_API_KEY,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      rules: {
        enableChallenge: true,
        enableBlock: true,
        blockDuration: 3600, // seconds (1 hour)
      },
    },

    // AWS Shield integration
    awsShield: {
      enabled: process.env.AWS_SHIELD_ENABLED === 'true',
      region: process.env.AWS_REGION || 'us-east-1',
      // AWS Shield Advanced enables DDoS protection
      // https://aws.amazon.com/shield/
    },

    // Attack response
    response: {
      blockDuration: 3600000, // milliseconds (1 hour)
      challengeLimit: 5, // Challenges before blocking
      escalationThreshold: 80, // Confidence % to escalate to security team
    },
  },

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    maxAge: 86400,
  },

  // Request validation
  validation: {
    maxJsonSize: '10kb',
    maxUrlEncodedSize: '10kb',
    timeout: 30000, // milliseconds
  },

  // Monitoring and alerting
  monitoring: {
    enabled: true,
    alertThresholds: {
      rpsThreshold: 1000, // Requests per second
      errorRateThreshold: 5, // Percentage
      blockedIPsThreshold: 100,
    },
    alertChannels: {
      slack: process.env.SLACK_WEBHOOK_URL,
      email: process.env.ALERT_EMAIL,
      sentry: process.env.SENTRY_DSN,
    },
  },

  // Logging
  logging: {
    enabled: true,
    logBlockedRequests: true,
    logRateLimitedRequests: false, // Too verbose if true
    logSuspiciousActivity: true,
    retention: {
      days: 30,
    },
  },
};

// Development overrides
if (process.env.NODE_ENV === 'development') {
  securityConfig.rateLimiting.perUser.limit = 100000;
  securityConfig.rateLimiting.perIP.limit = 100000;
  securityConfig.ddos.enabled = false;
}

export default securityConfig;
