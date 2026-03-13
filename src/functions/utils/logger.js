/**
 * Safe logging utility for Deno functions
 * Logs only in development mode to prevent sensitive data leakage in production
 */
const isDevelopment = Deno.env.get('NODE_ENV') !== 'production';
export const logger = {
    info: (...args) => {
        if (isDevelopment) {
            console.log('[INFO]', ...args);
        }
    },
    warn: (...args) => {
        if (isDevelopment) {
            console.warn('[WARN]', ...args);
        }
    },
    error: (...args) => {
        // Always log errors, but sanitize sensitive data in production
        if (isDevelopment) {
            console.error('[ERROR]', ...args);
        }
        else {
            // In production, log minimal error info
            const sanitized = args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg).substring(0, 100));
            console.error('[ERROR]', ...sanitized);
        }
    },
    debug: (...args) => {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    }
};
