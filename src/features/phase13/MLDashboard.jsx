import { useMemo } from 'react';
import { useBehavioralPrediction } from './useBehavioralPrediction';
import { useCodeQualityPrediction } from './useCodeQualityPrediction';
import { useResourceForecasting } from './useResourceForecasting';

/**
 * ML dashboard overview for predictions, accuracy, and training status.
 * @returns {JSX.Element}
 */
export function MLDashboard() {
  const behavioral = useBehavioralPrediction();
  const codeQuality = useCodeQualityPrediction();
  const resources = useResourceForecasting();

  const loading = behavioral.loading || codeQuality.loading || resources.loading;
  const error = behavioral.error || codeQuality.error || resources.error;

  const forecastSummary = useMemo(() => {
    const peakCpu = Math.max(...resources.forecast.map((item) => item.cpu));
    const peakMemory = Math.max(...resources.forecast.map((item) => item.memory));
    return {
      peakCpu,
      peakMemory
    };
  }, [resources.forecast]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">ML Predictions Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Accuracy, training status, and forecast insights</p>
        </div>
        <div className="text-xs text-slate-400">Last updated: {behavioral.prediction.lastUpdated.split('T')[0]}</div>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Behavioral Prediction</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {(behavioral.prediction.churnRisk * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Churn risk</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Accuracy</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{Math.round(behavioral.prediction.accuracy * 100)}%</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Code Quality Score</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{codeQuality.score}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bug risk {(codeQuality.bugRisk * 100).toFixed(0)}%</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Model</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{codeQuality.modelVersion}</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Resource Forecast</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{resources.capacityPlan.riskLevel}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Peak CPU {forecastSummary.peakCpu}% · Peak Memory {forecastSummary.peakMemory}%</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Recommended nodes</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{resources.capacityPlan.recommendedNodes}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Engagement Forecast</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-6">
            {behavioral.prediction.engagementForecast.map((value, index) => (
              <div key={index} className="rounded-md border border-slate-200 p-2 text-center dark:border-slate-800">
                {value}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Training Status</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>Behavioral Model</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                {behavioral.prediction.trainingStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Code Quality Model</span>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                {codeQuality.trainingStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Resource Forecast</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
