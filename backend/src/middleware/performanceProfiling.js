/**
 * Performance Profiling Middleware & Utilities
 * Captures execution time, memory usage, and hot-path analysis
 */

import * as Sentry from '@sentry/node';

/**
 * Performance profile entry
 */
class PerformanceProfile {
  constructor(name) {
    this.name = name;
    this.startTime = process.hrtime.bigint();
    this.startMemory = process.memoryUsage();
    this.events = [];
  }

  /**
   * Record a checkpoint in the profile
   */
  checkpoint(label) {
    const now = process.hrtime.bigint();
    const elapsed = Number(now - this.startTime) / 1_000_000; // Convert to ms
    const memory = process.memoryUsage();
    
    this.events.push({
      label,
      elapsed_ms: elapsed,
      memory: {
        heapUsed_mb: (memory.heapUsed / 1024 / 1024).toFixed(2),
        heapTotal_mb: (memory.heapTotal / 1024 / 1024).toFixed(2),
        rss_mb: (memory.rss / 1024 / 1024).toFixed(2),
      },
      timestamp: new Date().toISOString(),
    });

    return elapsed;
  }

  /**
   * Finish profiling and return results
   */
  finish() {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    const duration = Number(endTime - this.startTime) / 1_000_000; // ms

    const memoryDelta = {
      heapUsed_mb: ((endMemory.heapUsed - this.startMemory.heapUsed) / 1024 / 1024).toFixed(2),
      heapTotal_mb: ((endMemory.heapTotal - this.startMemory.heapTotal) / 1024 / 1024).toFixed(2),
      rss_mb: ((endMemory.rss - this.startMemory.rss) / 1024 / 1024).toFixed(2),
    };

    return {
      name: this.name,
      duration_ms: duration,
      events: this.events,
      memory_delta: memoryDelta,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Profiling middleware for route handlers
 * Tracks overall request performance
 */
export const profilingMiddleware = (req, res, next) => {
  const profile = new PerformanceProfile(`${req.method} ${req.path}`);
  req.profile = profile;
  
  // Capture checkpoint after auth
  res.on('headersSent', () => {
    profile.checkpoint('headers_sent');
  });

  res.on('finish', () => {
    profile.checkpoint('response_finished');
    const result = profile.finish();

    // Send to Sentry as measurement
    if (req.transaction) {
      req.transaction.setMeasurement('request.duration', result.duration_ms, 'millisecond');
      req.transaction.setData('performance_profile', result);
    }

    // Log if slow
    if (result.duration_ms > 1000) {
      console.warn(`⚠️  Slow request: ${result.name} took ${result.duration_ms.toFixed(0)}ms`);
      
      Sentry.captureMessage(`Slow request detected: ${result.name}`, 'warning', {
        tags: {
          'performance.slow_request': 'true',
          'request.duration_ms': Math.round(result.duration_ms),
        },
        extra: {
          profile: result,
        },
      });
    }
  });

  next();
};

/**
 * Wrap async function with profiling
 * Returns duration and result
 */
export async function profileAsync(name, asyncFn) {
  const profile = new PerformanceProfile(name);
  
  try {
    profile.checkpoint('start');
    const result = await asyncFn(profile);
    profile.checkpoint('end');
    
    const profileResult = profile.finish();
    return {
      result,
      profile: profileResult,
      duration_ms: profileResult.duration_ms,
    };
  } catch (error) {
    profile.checkpoint('error');
    const profileResult = profile.finish();
    
    Sentry.captureException(error, {
      tags: {
        'performance.error': 'true',
      },
      extra: {
        profile: profileResult,
      },
    });
    
    throw error;
  }
}

/**
 * Higher-order function for automatic profiling of route handlers
 */
export function withProfiling(operationName) {
  return (handler) => {
    return async (req, res, next) => {
      const profile = new PerformanceProfile(operationName);
      req.operationProfile = profile;

      profile.checkpoint('handler_start');

      try {
        const result = await handler(req, res, next);
        profile.checkpoint('handler_end');
        return result;
      } catch (error) {
        profile.checkpoint('handler_error');
        throw error;
      } finally {
        const result = profile.finish();

        if (req.transaction) {
          req.transaction.setData('operation_profile', result);
        }

        if (result.duration_ms > 500) {
          console.warn(`⚠️  Slow operation: ${operationName} took ${result.duration_ms.toFixed(0)}ms`);
        }
      }
    };
  };
}

/**
 * Database operation profiler
 * Tracks query performance
 */
export class DatabaseProfiler {
  constructor() {
    this.queries = [];
  }

  /**
   * Profile a database query
   */
  async profileQuery(collection, operation, query, asyncFn) {
    const start = process.hrtime.bigint();
    
    try {
      const result = await asyncFn();
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000;

      const queryProfile = {
        collection,
        operation,
        duration_ms: duration,
        query: JSON.stringify(query).substring(0, 500), // Truncate large queries
        status: 'success',
        timestamp: new Date().toISOString(),
      };

      this.queries.push(queryProfile);

      // Alert if slow
      if (duration > 100) {
        console.warn(`⚠️  Slow DB query: ${collection}.${operation} took ${duration.toFixed(0)}ms`);
        
        Sentry.captureMessage(
          `Slow database query: ${collection}.${operation}`,
          'warning',
          {
            tags: {
              'db.slow_query': 'true',
              'db.collection': collection,
              'db.operation': operation,
            },
            extra: {
              duration_ms: duration,
              query: queryProfile.query,
            },
          }
        );
      }

      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000;

      this.queries.push({
        collection,
        operation,
        duration_ms: duration,
        query: JSON.stringify(query).substring(0, 500),
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Get summary of all profiled queries
   */
  getSummary() {
    const successful = this.queries.filter(q => q.status === 'success');
    const failed = this.queries.filter(q => q.status === 'error');

    const totalDuration = successful.reduce((sum, q) => sum + q.duration_ms, 0);
    const avgDuration = successful.length > 0 ? totalDuration / successful.length : 0;
    const slowQueries = successful.filter(q => q.duration_ms > 100);

    return {
      total: this.queries.length,
      successful: successful.length,
      failed: failed.length,
      total_duration_ms: totalDuration,
      avg_duration_ms: avgDuration,
      slow_queries: slowQueries.length,
      slow_query_details: slowQueries.map(q => ({
        collection: q.collection,
        operation: q.operation,
        duration_ms: q.duration_ms,
      })),
    };
  }

  /**
   * Reset profiler
   */
  reset() {
    this.queries = [];
  }
}

/**
 * Memory usage profiler
 */
export class MemoryProfiler {
  constructor(interval = 5000) {
    this.interval = interval;
    this.samples = [];
    this.isRunning = false;
  }

  /**
   * Start continuous memory sampling
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.sampleInterval = setInterval(() => {
      const memory = process.memoryUsage();
      this.samples.push({
        timestamp: Date.now(),
        heapUsed_mb: (memory.heapUsed / 1024 / 1024).toFixed(2),
        heapTotal_mb: (memory.heapTotal / 1024 / 1024).toFixed(2),
        rss_mb: (memory.rss / 1024 / 1024).toFixed(2),
        external_mb: (memory.external / 1024 / 1024).toFixed(2),
      });
    }, this.interval);

    console.log('📊 Memory profiler started');
  }

  /**
   * Stop memory sampling
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.sampleInterval);
    console.log('📊 Memory profiler stopped');
  }

  /**
   * Get memory usage statistics
   */
  getStats() {
    if (this.samples.length === 0) {
      return null;
    }

    const heapValues = this.samples.map(s => parseFloat(s.heapUsed_mb));
    const rssValues = this.samples.map(s => parseFloat(s.rss_mb));

    return {
      samples: this.samples.length,
      heap: {
        min_mb: Math.min(...heapValues),
        max_mb: Math.max(...heapValues),
        avg_mb: (heapValues.reduce((a, b) => a + b, 0) / heapValues.length).toFixed(2),
        current_mb: heapValues[heapValues.length - 1],
      },
      rss: {
        min_mb: Math.min(...rssValues),
        max_mb: Math.max(...rssValues),
        avg_mb: (rssValues.reduce((a, b) => a + b, 0) / rssValues.length).toFixed(2),
        current_mb: rssValues[rssValues.length - 1],
      },
      duration_ms: this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp,
    };
  }

  /**
   * Export memory profile as CSV
   */
  exportCsv() {
    const header = 'timestamp,heapUsed_mb,heapTotal_mb,rss_mb,external_mb\n';
    const rows = this.samples.map(s => 
      `${s.timestamp},${s.heapUsed_mb},${s.heapTotal_mb},${s.rss_mb},${s.external_mb}`
    ).join('\n');
    
    return header + rows;
  }
}

export default {
  PerformanceProfile,
  profilingMiddleware,
  profileAsync,
  withProfiling,
  DatabaseProfiler,
  MemoryProfiler,
};
