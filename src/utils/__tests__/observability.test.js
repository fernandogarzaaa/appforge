import { describe, it, expect, beforeEach } from 'vitest';
import {
  startTrace,
  addSpan,
  endSpan,
  endTrace,
  recordMetric,
  createAlert,
  resolveAlert,
  getSnapshot,
  clearObservability,
} from '@/utils/observability';

describe('Observability Utilities', () => {
  beforeEach(() => {
    clearObservability();
  });

  it('creates and completes traces', () => {
    const { traceId, spanId } = startTrace('checkout');
    const span = addSpan(traceId, 'fetch_cart');

    expect(span).toBeTruthy();
    const finishedSpan = endSpan(traceId, span, 'ok');
    expect(finishedSpan.status).toBe('ok');

    const trace = endTrace(traceId, 'ok');
    expect(trace.status).toBe('ok');
    expect(trace.spans.length).toBeGreaterThan(0);
  });

  it('records metrics', () => {
    recordMetric('api_latency_ms', 120, { route: '/projects' });
    const snapshot = getSnapshot();
    expect(snapshot.metrics.length).toBe(1);
    expect(snapshot.metrics[0].name).toBe('api_latency_ms');
  });

  it('creates and resolves alerts', () => {
    const alert = createAlert({
      title: 'High Error Rate',
      severity: 'critical',
      message: '5xx errors above threshold',
      source: 'Gateway',
    });

    expect(alert.status).toBe('open');
    const resolved = resolveAlert(alert.id);
    expect(resolved.status).toBe('resolved');
  });
});
