import { useFeatureUsageAnalytics } from './useFeatureUsageAnalytics';

export function FeatureUsageDashboard() {
  const { topFeatures, adoptionSummary } = useFeatureUsageAnalytics();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Feature Usage Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Top features and adoption rates</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Top Features</h3>
          <ul className="space-y-2">
            {topFeatures.map((feature) => (
              <li key={feature.name} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                <span className="text-slate-800 dark:text-slate-100">{feature.name}</span>
                <span className="text-slate-500 dark:text-slate-400">{feature.usageCount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Adoption Summary</h3>
          <ul className="space-y-2">
            {adoptionSummary.slice(0, 6).map((feature) => (
              <li key={feature.name} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                <span className="text-slate-800 dark:text-slate-100">{feature.name}</span>
                <span className="text-slate-500 dark:text-slate-400">{feature.adoptionRate}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
