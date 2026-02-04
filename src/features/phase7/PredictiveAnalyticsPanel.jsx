import { useMemo } from 'react';
import { usePredictiveAnalytics } from './usePredictiveAnalytics';

const sampleSeries = [12, 15, 14, 18, 21, 19, 24];

export function PredictiveAnalyticsPanel() {
  const { predictions, trend } = usePredictiveAnalytics(sampleSeries);

  const trendLabel = useMemo(() => {
    if (trend === 'up') return 'Improving';
    if (trend === 'down') return 'Declining';
    return 'Stable';
  }, [trend]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Predictive Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">7-day forecast based on recent activity</p>
      </header>

      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="font-medium">Trend:</span>
        <span>{trendLabel}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {predictions.map((value, index) => (
          <div key={index} className="rounded-md border border-slate-200 p-2 text-center text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
            {value}
          </div>
        ))}
      </div>
    </section>
  );
}
