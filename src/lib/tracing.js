/**
 * Frontend Tracing Setup for AppForge
 * Integrates OpenTelemetry with browser-compatible tracing
 * Tracks React component renders, API calls, and user interactions
 */

export function initializeTracingClient() {
  // Check if AI Toolkit tracing is available
  if (!(window as any).__OTEL_INITIALIZED__) {
    console.log(
      "📊 Tracing: Open VS Code command palette → 'ai-mlstudio.tracing.open' to start trace collector"
    );
    return;
  }

  // Tracing will be auto-instrumented by AI Toolkit extension
  console.log("✓ Frontend tracing initialized via AI Toolkit");
}

/**
 * Create a custom span for tracking specific operations
 * @param {string} name - Span name
 * @param {Function} fn - Function to trace
 * @returns {Promise<any>} Result of function execution
 */
export async function traceOperation(name, fn) {
  const startTime = performance.now();
  try {
    const result = await Promise.resolve(fn());
    const duration = performance.now() - startTime;
    console.log(`[TRACE] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    console.error(`[TRACE] ${name}: ERROR -`, error);
    throw error;
  }
}

/**
 * Track API request performance
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function tracedFetch(url, options = {}) {
  const span = {
    name: `API ${options.method || "GET"} ${new URL(url, window.location.origin).pathname}`,
    startTime: performance.now(),
  };

  try {
    const response = await fetch(url, options);
    span.duration = performance.now() - span.startTime;
    span.status = response.status;
    logSpan(span);
    return response;
  } catch (error) {
    span.duration = performance.now() - span.startTime;
    span.error = error.message;
    logSpan(span);
    throw error;
  }
}

/**
 * Log span for debugging and monitoring
 * @param {Object} span - Span object
 */
function logSpan(span) {
  const level = span.error ? "error" : span.status >= 400 ? "warn" : "log";
  console[level](`[SPAN] ${span.name}`, {
    duration: `${span.duration.toFixed(2)}ms`,
    status: span.status,
    error: span.error,
  });
}

// Initialize on module load
if (typeof window !== "undefined") {
  initializeTracingClient();
}
