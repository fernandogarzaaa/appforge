import { useState } from 'react';
import { useAnomalyDetection } from './useAnomalyDetection';

/**
 * Real-time anomaly alerts feed with configuration controls.
 * @returns {JSX.Element}
 */
export function AnomalyAlerts() {
  const { alerts, thresholds, loading, error, updateThreshold, acknowledgeAlert, clearAlerts } = useAnomalyDetection();
  const [localThresholds, setLocalThresholds] = useState(thresholds);

  const handleUpdate = (key, value) => {
    const next = { ...localThresholds, [key]: value };
    setLocalThresholds(next);
    updateThreshold(key, value);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Anomaly Alerts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time monitoring with configurable thresholds</p>
        </div>
        <button
          type="button"
          onClick={clearAlerts}
          className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Clear feed
        </button>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Alert Thresholds</h3>
          <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {['cpu', 'memory', 'errorRate'].map((key) => (
              <label key={key} className="flex items-center justify-between gap-3">
                <span className="capitalize">{key === 'errorRate' ? 'Error rate (%)' : key}</span>
                <input
                  type="number"
                  value={localThresholds[key]}
                  onChange={(event) => handleUpdate(key, event.target.value)}
                  className="w-24 rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
            Alerts trigger when metrics exceed thresholds for two sampling windows.
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Live Feed</h3>
          {loading ? (
            <div className="mt-4 h-28 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
          ) : (
            <div className="mt-4 space-y-3">
              {alerts.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No anomalies detected.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{alert.type}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          alert.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Value {alert.value} · Threshold {alert.threshold}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {alert.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
