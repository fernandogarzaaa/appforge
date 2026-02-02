/**
 * Request Context Middleware
 * Adds requestId/traceId/spanId to each request for distributed tracing
 */

const crypto = require('crypto');

const TRACE_VERSION = '00';
const TRACE_FLAGS = '01';

function generateId(bytes) {
  return crypto.randomBytes(bytes).toString('hex');
}

function parseTraceParent(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.trim().split('-');
  if (parts.length !== 4) return null;
  const [version, traceId, spanId, flags] = parts;
  if (version.length !== 2 || traceId.length !== 32 || spanId.length !== 16 || flags.length !== 2) {
    return null;
  }
  return { version, traceId, spanId, flags };
}

function buildTraceParent(traceId, spanId, flags = TRACE_FLAGS) {
  return `${TRACE_VERSION}-${traceId}-${spanId}-${flags}`;
}

function requestContext(req, res, next) {
  const incoming = parseTraceParent(req.headers['traceparent']);
  const traceId = incoming?.traceId || generateId(16);
  const parentSpanId = incoming?.spanId;
  const spanId = generateId(8);
  const requestId = req.headers['x-request-id'] || generateId(12);

  req.context = {
    requestId,
    traceId,
    spanId,
    parentSpanId
  };

  res.setHeader('x-request-id', requestId);
  res.setHeader('traceparent', buildTraceParent(traceId, spanId));

  next();
}

module.exports = requestContext;
