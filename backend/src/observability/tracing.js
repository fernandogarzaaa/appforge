/**
 * Lightweight Distributed Tracing
 * Stores recent spans for troubleshooting and observability
 */

const MAX_SPANS = 2000;
const spans = [];

function recordSpan(span) {
  spans.push({
    ...span,
    timestamp: new Date().toISOString()
  });
  if (spans.length > MAX_SPANS) {
    spans.shift();
  }
}

function tracingMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    recordSpan({
      traceId: req.context?.traceId,
      spanId: req.context?.spanId,
      parentSpanId: req.context?.parentSpanId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      tenantId: req.tenant?.id,
      userId: req.user?.id
    });
  });

  next();
}

function getRecentSpans(limit = 200) {
  return spans.slice(-limit);
}

function clearSpans() {
  spans.length = 0;
}

module.exports = {
  recordSpan,
  tracingMiddleware,
  getRecentSpans,
  clearSpans
};
