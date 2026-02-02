/**
 * Quantum Module Failover & Graceful Degradation
 * Implements circuit breaker pattern for quantum WASM module
 */

/**
 * Circuit breaker states
 */
const CIRCUIT_STATES = {
  CLOSED: 'closed',      // Normal operation
  OPEN: 'open',          // Failing, reject requests
  HALF_OPEN: 'half_open', // Testing recovery
};

/**
 * Quantum Circuit Breaker
 * Handles failures gracefully, prevents cascade failures
 */
class QuantumCircuitBreaker {
  constructor(options = {}) {
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextRetryTime = null;

    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
    this.halfOpenRequests = options.halfOpenRequests || 3;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
  }

  /**
   * Check if request should be allowed
   */
  canExecute() {
    if (this.state === CIRCUIT_STATES.CLOSED) {
      return true;
    }

    if (this.state === CIRCUIT_STATES.OPEN) {
      // Check if we should try recovery
      if (Date.now() >= this.nextRetryTime) {
        console.log('🔄 Quantum: Circuit breaker entering HALF_OPEN state, testing recovery');
        this.state = CIRCUIT_STATES.HALF_OPEN;
        this.successCount = 0;
        return true;
      }
      return false;
    }

    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      // Allow limited requests in half-open state
      return this.successCount < this.halfOpenRequests;
    }

    return false;
  }

  /**
   * Record success
   */
  recordSuccess() {
    this.failureCount = 0;

    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.halfOpenSuccessThreshold) {
        console.log('✅ Quantum: Circuit breaker CLOSED - service recovered');
        this.state = CIRCUIT_STATES.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Record failure
   */
  recordFailure() {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      console.log('❌ Quantum: Circuit breaker reopening after failed recovery attempt');
      this.state = CIRCUIT_STATES.OPEN;
      this.nextRetryTime = Date.now() + this.resetTimeout;
      this.failureCount = 0;
      this.successCount = 0;
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      console.log(`⚠️  Quantum: Circuit breaker OPEN after ${this.failureCount} failures`);
      this.state = CIRCUIT_STATES.OPEN;
      this.nextRetryTime = Date.now() + this.resetTimeout;
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextRetryTime: this.nextRetryTime,
    };
  }

  /**
   * Reset circuit breaker manually
   */
  reset() {
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextRetryTime = null;
    console.log('🔧 Quantum: Circuit breaker manually reset');
  }
}

/**
 * Global quantum circuit breaker instance
 */
export const quantumBreaker = new QuantumCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
  halfOpenRequests: 3,
  halfOpenSuccessThreshold: 2,
});

/**
 * Fallback response when quantum is unavailable
 */
function getFallbackResponse(original_input = '') {
  return {
    success: false,
    mode: 'fallback',
    message: 'Quantum analysis service temporarily unavailable',
    fallback_response: {
      status: 'degraded',
      consensus: 0,
      entanglement_level: 'unknown',
      superposition_state: 'collapsed',
      analysis: {
        type: 'classical_approximation',
        description: 'Using classical algorithm approximation due to quantum service unavailability',
        confidence: 0.6,
      },
      recommendations: [
        'Quantum service is recovering',
        'Using classical algorithms for analysis',
        'Results may be less comprehensive',
        'Please try again in a few moments',
      ],
      input_preview: original_input.substring(0, 100),
    },
    timestamp: new Date().toISOString(),
    retry_after: 30, // seconds
  };
}

/**
 * Retry logic for transient failures
 */
async function retryWithBackoff(
  asyncFn,
  maxRetries = 3,
  initialDelayMs = 100
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt); // Exponential backoff
        console.warn(`🔄 Quantum: Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Execute quantum analysis with failover
 */
export async function executeQuantumAnalysisWithFailover(
  analysisFunction,
  input,
  options = {}
) {
  const enableFallback = options.enableFallback !== false;
  const enableRetry = options.enableRetry !== false;
  const maxRetries = options.maxRetries || 2;

  // Check circuit breaker
  if (!quantumBreaker.canExecute()) {
    console.warn('⚠️  Quantum: Circuit breaker is OPEN, using fallback');
    if (enableFallback) {
      return getFallbackResponse(input);
    }
    throw new Error('Quantum service unavailable and fallback disabled');
  }

  try {
    let result;

    if (enableRetry) {
      // Try with retries
      result = await retryWithBackoff(
        () => analysisFunction(input),
        maxRetries,
        100
      );
    } else {
      // Single attempt
      result = await analysisFunction(input);
    }

    quantumBreaker.recordSuccess();
    return result;
  } catch (error) {
    console.error('❌ Quantum analysis failed:', error.message);
    quantumBreaker.recordFailure();

    // Use fallback if enabled
    if (enableFallback) {
      console.log('📊 Quantum: Using fallback response');
      return getFallbackResponse(input);
    }

    throw error;
  }
}

/**
 * Middleware for quantum routes
 * Handles circuit breaker checks and fallback responses
 */
export const quantumFailoverMiddleware = (req, res, next) => {
  // Attach circuit breaker to request
  req.quantumBreaker = quantumBreaker;

  // Check breaker status
  if (!quantumBreaker.canExecute()) {
    req.quantumDegraded = true;
    console.warn('⚠️  Quantum: Service degraded - circuit breaker is OPEN');
  }

  // Attach fallback generator
  req.getQuantumFallback = (input) => getFallbackResponse(input);

  next();
};

/**
 * Middleware error handler for quantum operations
 */
export const quantumErrorHandler = (err, req, res, next) => {
  // Record failure in circuit breaker
  if (req.quantumBreaker && err.quantum) {
    req.quantumBreaker.recordFailure();
  }

  next(err);
};

/**
 * Endpoint for checking quantum service health
 */
export function createQuantumHealthEndpoint() {
  return (req, res) => {
    const breaker = quantumBreaker.getState();
    const isHealthy = breaker.state === CIRCUIT_STATES.CLOSED;

    res.status(isHealthy ? 200 : 503).json({
      service: 'quantum-analysis',
      status: isHealthy ? 'healthy' : 'degraded',
      breaker_state: breaker.state,
      failures: breaker.failureCount,
      last_failure: breaker.lastFailureTime,
      next_retry: breaker.nextRetryTime,
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Endpoint for manually resetting quantum service
 */
export function createQuantumResetEndpoint() {
  return (req, res) => {
    quantumBreaker.reset();
    
    res.json({
      message: 'Quantum circuit breaker reset',
      state: quantumBreaker.getState(),
      timestamp: new Date().toISOString(),
    });
  };
}

export default {
  QuantumCircuitBreaker,
  quantumBreaker,
  getFallbackResponse,
  retryWithBackoff,
  executeQuantumAnalysisWithFailover,
  quantumFailoverMiddleware,
  quantumErrorHandler,
  createQuantumHealthEndpoint,
  createQuantumResetEndpoint,
  CIRCUIT_STATES,
};
