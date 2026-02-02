/**
 * Distributed Tracing Middleware
 * Wire Sentry transactions across services for end-to-end request tracking
 */

import * as Sentry from '@sentry/node';

/**
 * Middleware to start and track request transactions
 * Creates parent transaction for cross-service tracing
 */
export const tracingMiddleware = (req, res, next) => {
  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: `${req.method} ${req.path}`,
    source: 'url',
    tags: {
      'http.method': req.method,
      'http.url': req.path,
    },
    data: {
      'http.request.method': req.method,
      'http.request.path': req.path,
      'http.request.headers': {
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
      },
    },
  });

  // Store transaction on request for child spans
  req.transaction = transaction;

  // Automatically capture response time
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (transaction) {
      transaction.setTag('http.status_code', res.statusCode);
      transaction.setData('http.response.status_code', res.statusCode);
      transaction.setData('http.response.time_ms', duration);
      
      // Set status based on HTTP code
      if (res.statusCode >= 400) {
        transaction.setStatus('error');
      } else {
        transaction.setStatus('ok');
      }
      
      transaction.finish();
    }
  });

  next();
};

/**
 * Create a child span for a specific operation
 * Use within route handlers for granular tracing
 */
export function startSpan(transaction, operationName, operationType = 'operation') {
  if (!transaction) {
    return null;
  }

  return transaction.startChild({
    op: operationType,
    description: operationName,
    tags: {
      'span.type': operationType,
    },
  });
}

/**
 * Higher-order function to wrap async operations with tracing
 * Automatically tracks performance of async handlers
 */
export function withTracing(operationName, operationType = 'operation') {
  return (asyncHandler) => {
    return async (req, res, next) => {
      const span = startSpan(req.transaction, operationName, operationType);

      try {
        await asyncHandler(req, res, next);
      } catch (error) {
        if (span) {
          span.setStatus('error');
          span.setData('error.message', error.message);
          span.setData('error.stack', error.stack);
        }
        throw error;
      } finally {
        if (span) {
          span.finish();
        }
      }
    };
  };
}

/**
 * Create database query span
 */
export function createDatabaseSpan(transaction, query, operationType = 'db.mongo') {
  if (!transaction) {
    return null;
  }

  return transaction.startChild({
    op: operationType,
    description: query,
    tags: {
      'db.type': 'mongodb',
    },
  });
}

/**
 * Create external API call span
 */
export function createApiSpan(transaction, serviceName, endpoint) {
  if (!transaction) {
    return null;
  }

  return transaction.startChild({
    op: 'http.client',
    description: `${serviceName} ${endpoint}`,
    tags: {
      'service.name': serviceName,
      'http.url': endpoint,
    },
  });
}

/**
 * Create cache operation span
 */
export function createCacheSpan(transaction, operation, key) {
  if (!transaction) {
    return null;
  }

  return transaction.startChild({
    op: 'cache',
    description: `${operation} ${key}`,
    tags: {
      'cache.operation': operation,
      'cache.key': key,
    },
  });
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addTracingBreadcrumb(message, category = 'user-action', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Trace service-to-service communication
 * Add this to outgoing requests to other services
 */
export function getTracingHeaders(transaction) {
  if (!transaction) {
    return {};
  }

  return {
    'sentry-trace': transaction.toTraceparent(),
    'baggage': transaction.toBaggage(),
  };
}

/**
 * Continue tracing from incoming headers
 * Use when receiving requests from other services
 */
export function continueTracing(sentryTraceHeader, baggageHeader) {
  if (!sentryTraceHeader) {
    return null;
  }

  try {
    const [traceId, spanId, sampled] = sentryTraceHeader.split('-');
    return {
      traceId,
      spanId,
      sampled: sampled === '1',
    };
  } catch (err) {
    console.warn('Failed to parse Sentry trace header:', err);
    return null;
  }
}

export default {
  tracingMiddleware,
  startSpan,
  withTracing,
  createDatabaseSpan,
  createApiSpan,
  createCacheSpan,
  addTracingBreadcrumb,
  getTracingHeaders,
  continueTracing,
};
