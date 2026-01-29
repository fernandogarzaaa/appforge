/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting requests per IP
 */

import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/status';
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind a proxy, otherwise use remoteAddress
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  }
});

export default rateLimiter;
