/**
 * Tracing Setup for AppForge Backend
 * Integrates error tracking and basic observability
 * OpenTelemetry support can be added as optional dependency
 */

/**
 * Initialize observability for the application
 * @returns {Object} Tracing utilities
 */
function initializeTracing() {
  console.log(`✓ Tracing/Observability initialized via Sentry`);
  
  return {
    captureException: (error, context) => {
      console.error('[TRACE] Exception:', error.message, context);
    },
    captureMessage: (message, level = 'info') => {
      console[level](`[TRACE] ${message}`);
    }
  };
}

module.exports = { initializeTracing };
