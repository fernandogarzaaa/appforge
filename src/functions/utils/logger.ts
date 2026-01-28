/**
 * Safe logging utility for Deno functions
 * Logs only in development mode to prevent sensitive data leakage in production
 */

const isDevelopment = Deno.env.get('NODE_ENV') !== 'production';

export const logger = {
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but sanitize sensitive data in production
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // In production, log minimal error info
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? '[Object]' : String(arg).substring(0, 100)
      );
      console.error('[ERROR]', ...sanitized);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
};
