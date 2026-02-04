import { useMemo } from 'react';
import { useTeamProductivity } from './useTeamProductivity';

export function TeamProductivityDashboard() {
  const {
    velocity,
    avgBugResolutionHours,
    qualityTrend,
    engagementScore,
    capacityUtilization,
    state
  } = useTeamProductivity();

  const sprintSummary = useMemo(() => {
    const latest = state.sprints[0];
    return latest
      ? `Sprint ${latest.name || latest.id} • ${latest.completedPoints || 0} pts`
      : 'No sprint data yet';
  }, [state.sprints]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-6 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Team Productivity</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{sprintSummary}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs uppercase text-slate-500">Velocity</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{velocity}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs uppercase text-slate-500">Bug Resolution</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{avgBugResolutionHours}h</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs uppercase text-slate-500">Quality Trend</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{qualityTrend}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs uppercase text-slate-500">Engagement</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{engagementScore}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs uppercase text-slate-500">Capacity</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{capacityUtilization}%</p>
        </div>
      </div>
    </section>
  );
}
