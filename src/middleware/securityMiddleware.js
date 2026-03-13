/**
 * Express Middleware for Rate Limiting & DDoS Protection
 * Integrates rate limiting and DDoS protection into Express app
 */
import { rateLimiter } from './rateLimiter';
import { ddosProtection } from './ddosProtection';
/**
 * Rate limit middleware
 */
export const rateLimitMiddleware = async (req, res, next) => {
    try {
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userId = req.user?.id;
        const apiKey = req.headers['x-api-key'];
        const status = await rateLimiter.checkLimit({
            userId,
            clientIP,
            apiKey,
            endpoint: req.path,
            method: req.method,
        });
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', status.remaining + (status.allowed ? 1 : 0));
        res.setHeader('X-RateLimit-Remaining', status.remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(status.resetTime / 1000));
        if (!status.allowed) {
            res.setHeader('Retry-After', status.retryAfter || 60);
            return res.status(429).json({
                error: 'Too Many Requests',
                message: status.reason,
                retryAfter: status.retryAfter,
            });
        }
        next();
    }
    catch (error) {
        console.error('Rate limit error:', error);
        next();
    }
};
/**
 * DDoS protection middleware
 */
export const ddosProtectionMiddleware = async (req, res, next) => {
    try {
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        // Check if IP is blocked
        if (ddosProtection.isIPBlocked(clientIP)) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Your IP has been temporarily blocked due to suspicious activity',
            });
        }
        // Capture metrics
        const startTime = Date.now();
        res.on('finish', () => {
            const latency = Date.now() - startTime;
            ddosProtection.recordRequest({
                ip: clientIP,
                timestamp: Date.now(),
                method: req.method,
                endpoint: req.path,
                statusCode: res.statusCode,
                size: res.get('content-length') ? parseInt(res.get('content-length')) : 0,
                latency,
                userAgent: req.headers['user-agent'] || '',
                country: req.headers['cf-ipcountry'], // CloudFlare header
            });
        });
        next();
    }
    catch (error) {
        console.error('DDoS protection error:', error);
        next();
    }
};
/**
 * Combined security middleware
 */
export const securityMiddleware = [
    ddosProtectionMiddleware,
    rateLimitMiddleware,
];
/**
 * Express app integration helper
 */
export function setupSecurityMiddleware(app) {
    // Apply DDoS protection to all routes
    app.use(ddosProtectionMiddleware);
    // Apply rate limiting to all routes (stricter on API endpoints)
    app.use(rateLimitMiddleware);
    // Monitor endpoint
    app.get('/api/security/status', (req, res) => {
        const ddosStats = ddosProtection.getStatistics();
        const rateLimitStats = rateLimiter.getStatus(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
        res.json({
            ddos: ddosStats,
            rateLimit: rateLimitStats,
            timestamp: new Date().toISOString(),
        });
    });
    // Analytics endpoint
    app.get('/api/security/analytics', async (req, res) => {
        const analytics = await rateLimiter.getAnalytics();
        const ddosStats = ddosProtection.getStatistics();
        res.json({
            rateLimit: analytics,
            ddos: ddosStats,
            timestamp: new Date().toISOString(),
        });
    });
}
