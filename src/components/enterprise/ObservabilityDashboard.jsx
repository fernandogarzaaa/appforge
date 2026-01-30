import React, { useEffect, useMemo, useState } from 'react';
import {
  startTrace,
  addSpan,
  endSpan,
  endTrace,
  recordMetric,
  createAlert,
  resolveAlert,
  subscribe,
} from '@/utils/observability';

const severityStyles = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ObservabilityDashboard() {
  const [snapshot, setSnapshot] = useState(() => ({
    traces: [],
    metrics: [],
    alerts: [],
    summary: { activeTraces: 0, openAlerts: 0, metricsCount: 0 },
  }));

  const [activeTrace, setActiveTrace] = useState(null);
  const [metricName, setMetricName] = useState('api_latency_ms');
  const [metricValue, setMetricValue] = useState(120);
  const [alertForm, setAlertForm] = useState({
    title: 'Latency Spike',
    severity: 'warning',
    message: 'API latency above threshold',
    source: 'Gateway',
  });

  useEffect(() => {
    const unsubscribe = subscribe(setSnapshot);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const latestMetrics = useMemo(() => snapshot.metrics.slice(0, 8), [snapshot]);
  const latestTraces = useMemo(() => snapshot.traces.slice(0, 4), [snapshot]);
  const latestAlerts = useMemo(() => snapshot.alerts.slice(0, 6), [snapshot]);

  const handleStartTrace = () => {
    const { traceId, spanId } = startTrace('User Journey', {
      screen: 'Observability',
    });
    setActiveTrace({ traceId, spanId });
  };

  const handleAddSpan = () => {
    if (!activeTrace) return;
    const spanId = addSpan(activeTrace.traceId, 'Fetch Metrics', {
      endpoint: '/metrics',
    });
    if (spanId) {
      setTimeout(() => endSpan(activeTrace.traceId, spanId, 'ok'), 400);
    }
  };

  const handleEndTrace = () => {
    if (!activeTrace) return;
    endTrace(activeTrace.traceId, 'ok');
    setActiveTrace(null);
  };

  const handleRecordMetric = () => {
    recordMetric(metricName, Number(metricValue), {
      unit: metricName.includes('ms') ? 'ms' : 'count',
      source: 'frontend',
    });
  };

  const handleCreateAlert = () => {
    createAlert(alertForm);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Observability Center</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor traces, metrics, and alerts across the AppForge runtime.
        </p>
      </header>

      {/* Summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Active Traces</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{snapshot.summary.activeTraces}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Open Alerts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{snapshot.summary.openAlerts}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Metrics Captured</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{snapshot.summary.metricsCount}</p>
        </div>
      </section>

      {/* Tracing */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tracing Studio</h2>
          <div className="flex gap-2">
            <button
              onClick={handleStartTrace}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Start Trace
            </button>
            <button
              onClick={handleAddSpan}
              disabled={!activeTrace}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Add Span
            </button>
            <button
              onClick={handleEndTrace}
              disabled={!activeTrace}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              End Trace
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {latestTraces.length === 0 ? (
            <p className="text-sm text-gray-500">No traces captured yet.</p>
          ) : (
            latestTraces.map((trace) => (
              <div
                key={trace.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{trace.name}</p>
                    <p className="text-xs text-gray-500">{trace.id}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {trace.status}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {trace.spans.map((span) => (
                    <div key={span.id} className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                      <span>{span.name}</span>
                      <span>{span.duration ? `${span.duration}ms` : 'running'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Metrics Lab</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900"
              placeholder="metric_name"
            />
            <input
              type="number"
              value={metricValue}
              onChange={(e) => setMetricValue(Number(e.target.value) || 0)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900"
            />
            <button
              onClick={handleRecordMetric}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Record Metric
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {latestMetrics.length === 0 ? (
            <p className="text-sm text-gray-500">No metrics recorded.</p>
          ) : (
            latestMetrics.map((metric) => (
              <div key={metric.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{metric.value}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{new Date(metric.timestamp).toLocaleTimeString()}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Alerts */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alert Console</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={alertForm.title}
            onChange={(e) => setAlertForm((prev) => ({ ...prev, title: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900"
            placeholder="Alert title"
          />
          <select
            value={alertForm.severity}
            onChange={(e) => setAlertForm((prev) => ({ ...prev, severity: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="success">Success</option>
          </select>
          <input
            value={alertForm.source}
            onChange={(e) => setAlertForm((prev) => ({ ...prev, source: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900"
            placeholder="Source"
          />
          <button
            onClick={handleCreateAlert}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
          >
            Create Alert
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {latestAlerts.length === 0 ? (
            <p className="text-sm text-gray-500">No alerts created.</p>
          ) : (
            latestAlerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${severityStyles[alert.severity] || severityStyles.info}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-xs opacity-80">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-1">Source: {alert.source}</p>
                  </div>
                  {alert.status === 'open' ? (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="text-xs px-2 py-1 border border-current rounded-lg"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full border border-current">Resolved</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
