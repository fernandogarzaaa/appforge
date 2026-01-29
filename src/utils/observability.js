/**
 * Observability Utilities
 * Lightweight tracing, metrics, and alerting for frontend workflows
 */

const MAX_TRACES = 200;
const MAX_METRICS = 500;
const MAX_ALERTS = 200;

const listeners = new Set();

const state = {
  traces: [],
  metrics: [],
  alerts: [],
};

const emit = () => {
  const snapshot = getSnapshot();
  listeners.forEach((listener) => listener(snapshot));
};

const generateId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;

export const startTrace = (name, attributes = {}) => {
  const traceId = generateId('trace');
  const rootSpanId = generateId('span');
  const trace = {
    id: traceId,
    name,
    attributes,
    spans: [
      {
        id: rootSpanId,
        traceId,
        name,
        attributes,
        status: 'running',
        startTime: Date.now(),
        endTime: null,
        duration: null,
      },
    ],
    status: 'running',
    startTime: Date.now(),
    endTime: null,
    duration: null,
  };

  state.traces.unshift(trace);
  if (state.traces.length > MAX_TRACES) state.traces.pop();
  emit();

  return { traceId, spanId: rootSpanId };
};

export const addSpan = (traceId, name, attributes = {}) => {
  const trace = state.traces.find((t) => t.id === traceId);
  if (!trace) return null;

  const spanId = generateId('span');
  trace.spans.push({
    id: spanId,
    traceId,
    name,
    attributes,
    status: 'running',
    startTime: Date.now(),
    endTime: null,
    duration: null,
  });
  emit();
  return spanId;
};

export const endSpan = (traceId, spanId, status = 'ok') => {
  const trace = state.traces.find((t) => t.id === traceId);
  if (!trace) return null;

  const span = trace.spans.find((s) => s.id === spanId);
  if (!span) return null;

  span.status = status;
  span.endTime = Date.now();
  span.duration = span.endTime - span.startTime;
  emit();
  return span;
};

export const endTrace = (traceId, status = 'ok') => {
  const trace = state.traces.find((t) => t.id === traceId);
  if (!trace) return null;

  trace.status = status;
  trace.endTime = Date.now();
  trace.duration = trace.endTime - trace.startTime;

  trace.spans.forEach((span) => {
    if (!span.endTime) {
      span.status = status;
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
    }
  });

  emit();
  return trace;
};

export const recordMetric = (name, value, attributes = {}) => {
  const metric = {
    id: generateId('metric'),
    name,
    value,
    attributes,
    timestamp: Date.now(),
  };

  state.metrics.unshift(metric);
  if (state.metrics.length > MAX_METRICS) state.metrics.pop();
  emit();
  return metric;
};

export const createAlert = ({ title, severity = 'info', message, source }) => {
  const alert = {
    id: generateId('alert'),
    title,
    severity,
    message,
    source,
    status: 'open',
    createdAt: Date.now(),
    resolvedAt: null,
  };

  state.alerts.unshift(alert);
  if (state.alerts.length > MAX_ALERTS) state.alerts.pop();
  emit();
  return alert;
};

export const resolveAlert = (alertId) => {
  const alert = state.alerts.find((a) => a.id === alertId);
  if (!alert) return null;

  alert.status = 'resolved';
  alert.resolvedAt = Date.now();
  emit();
  return alert;
};

export const getSnapshot = () => ({
  traces: [...state.traces],
  metrics: [...state.metrics],
  alerts: [...state.alerts],
  summary: {
    activeTraces: state.traces.filter((t) => t.status === 'running').length,
    openAlerts: state.alerts.filter((a) => a.status === 'open').length,
    metricsCount: state.metrics.length,
  },
});

export const subscribe = (listener) => {
  listeners.add(listener);
  listener(getSnapshot());
  return () => listeners.delete(listener);
};

export const clearObservability = () => {
  state.traces = [];
  state.metrics = [];
  state.alerts = [];
  emit();
};

export default {
  startTrace,
  addSpan,
  endSpan,
  endTrace,
  recordMetric,
  createAlert,
  resolveAlert,
  getSnapshot,
  subscribe,
  clearObservability,
};
