/**
 * System Health Check Utilities
 * Monitor application health and dependencies
 */

import { base44 } from '@/api/base44Client';
import env from './env';

class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.lastCheck = null;
    this.checkInterval = null;
  }

  // Register a health check
  register(name, checkFn, options = {}) {
    this.checks.set(name, {
      name,
      checkFn,
      critical: options.critical || false,
      timeout: options.timeout || 5000,
      lastResult: null,
      lastChecked: null,
    });
  }

  // Run all health checks
  async runChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        total: this.checks.size,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
      },
    };

    for (const [name, check] of this.checks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          check.checkFn(),
          this.timeout(check.timeout),
        ]);

        const duration = Date.now() - startTime;
        const checkResult = {
          status: result.healthy ? 'healthy' : 'degraded',
          message: result.message || 'OK',
          duration,
          timestamp: new Date().toISOString(),
          ...result.data,
        };

        check.lastResult = checkResult;
        check.lastChecked = new Date().toISOString();
        results.checks[name] = checkResult;

        if (checkResult.status === 'healthy') {
          results.summary.healthy++;
        } else {
          results.summary.degraded++;
          if (check.critical) {
            results.status = 'degraded';
          }
        }
      } catch (error) {
        const errorResult = {
          status: 'unhealthy',
          message: error.message || 'Check failed',
          error: true,
          timestamp: new Date().toISOString(),
        };

        check.lastResult = errorResult;
        check.lastChecked = new Date().toISOString();
        results.checks[name] = errorResult;
        results.summary.unhealthy++;

        if (check.critical) {
          results.status = 'unhealthy';
        }
      }
    }

    this.lastCheck = results;
    return results;
  }

  timeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), ms);
    });
  }

  // Start periodic health checks
  startMonitoring(intervalMs = 60000) {
    this.stopMonitoring();
    
    this.checkInterval = setInterval(async () => {
      const results = await this.runChecks();
      
      if (results.status !== 'healthy') {
        console.warn('⚠️ System health degraded:', results);
      }
      
      // Report to monitoring service
      this.reportHealth(results);
    }, intervalMs);

    // Run immediate check
    this.runChecks();
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async reportHealth(results) {
    if (!env.app.isProduction) return;

    try {
      await fetch('/api/health/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      });
    } catch (err) {
      console.warn('Failed to report health status:', err);
    }
  }

  getStatus() {
    return this.lastCheck || { status: 'unknown', message: 'No health checks run yet' };
  }
}

// Create singleton
const healthMonitor = new HealthMonitor();

// Register default health checks
healthMonitor.register('api', async () => {
  try {
    // Check if Base44 API is reachable
    const response = await fetch(`${env.base44.apiUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    return {
      healthy: response.ok,
      message: response.ok ? 'API is responsive' : 'API returned error',
      data: { statusCode: response.status },
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'API is unreachable',
      data: { error: error.message },
    };
  }
}, { critical: true });

healthMonitor.register('auth', async () => {
  try {
    // Check if user can authenticate
    const user = await base44.auth.me();
    
    return {
      healthy: !!user,
      message: user ? 'Authentication working' : 'Not authenticated',
      data: { authenticated: !!user },
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Authentication failed',
      data: { error: error.message },
    };
  }
}, { critical: true });

healthMonitor.register('localStorage', async () => {
  try {
    const testKey = '__health_check__';
    const testValue = Date.now().toString();
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return {
      healthy: retrieved === testValue,
      message: 'LocalStorage is working',
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'LocalStorage not available',
      data: { error: error.message },
    };
  }
});

healthMonitor.register('performance', async () => {
  const memory = performance.memory;
  const navigation = performance.getEntriesByType('navigation')[0];
  
  const metrics = {
    memoryUsed: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
    memoryLimit: memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : 0,
    loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
  };
  
  const memoryHealthy = !memory || (metrics.memoryUsed / metrics.memoryLimit) < 0.9;
  const loadTimeHealthy = !navigation || metrics.loadTime < 5000;
  
  return {
    healthy: memoryHealthy && loadTimeHealthy,
    message: memoryHealthy && loadTimeHealthy ? 'Performance is good' : 'Performance degraded',
    data: metrics,
  };
});

export default healthMonitor;

// Convenience exports
export const runHealthChecks = () => healthMonitor.runChecks();
export const getSystemStatus = () => healthMonitor.getStatus();
export const startHealthMonitoring = (interval) => healthMonitor.startMonitoring(interval);
export const stopHealthMonitoring = () => healthMonitor.stopMonitoring();
