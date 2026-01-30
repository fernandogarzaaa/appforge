// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Zap } from 'lucide-react';
import { usePerformanceProfiler } from '../performanceProfiler/usePerformanceProfiler';
import { cn } from '@/lib/utils';

/**
 * Performance Profiler Dashboard
 * Real-time performance monitoring with charts and recommendations
 */
export function PerformanceProfilerDashboard() {
  const { metrics, startMeasure, endMeasure, getRecommendations } = usePerformanceProfiler();
  /** @type {[{fps?: number; memory?: any; renderTime?: number; interactions?: any[]; fpsHistory?: number[]; memoryHistory?: number[]; measurements?: any;}, (m) => void]} */
  const [displayMetrics, setDisplayMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('fps');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update metrics display
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setDisplayMetrics(metrics);
      setRecommendations(getRecommendations());
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, metrics, getRecommendations]);

  if (!displayMetrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <Activity className="w-6 h-6 text-blue-500" />
        </div>
      </div>
    );
  }

  // Determine FPS health
  const fpsHealth = metrics.fps >= 50 ? 'excellent' : metrics.fps >= 30 ? 'good' : 'poor';
  const memoryPercent = typeof metrics.memory === 'number' ? metrics.memory : 50;
  const memoryHealth = memoryPercent <= 50 ? 'good' : memoryPercent <= 80 ? 'warning' : 'critical';

  return (
    <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Performance Monitor
        </h2>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={cn(
            "px-3 py-1 text-sm rounded font-medium transition",
            autoRefresh
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          )}
        >
          {autoRefresh ? '🔴 Live' : '⏸ Paused'}
        </button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FPS Metric */}
        <div className={cn(
          "rounded-lg p-4 border-2",
          fpsHealth === 'excellent' && "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700",
          fpsHealth === 'good' && "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700",
          fpsHealth === 'poor' && "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
        )}>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">FPS</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(metrics.fps)}</p>
          <p className="text-xs text-slate-500 mt-2">
            {fpsHealth === 'excellent' && '✓ Excellent performance'}
            {fpsHealth === 'good' && '⚠ Good performance'}
            {fpsHealth === 'poor' && '✗ Performance issues'}
          </p>
        </div>

        {/* Memory Metric */}
        <div className={cn(
          "rounded-lg p-4 border-2",
          memoryHealth === 'good' && "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700",
          memoryHealth === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
          memoryHealth === 'critical' && "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
        )}>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Memory</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {(memoryPercent * 100).toFixed(1) || '0'} MB
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {(memoryPercent || 0).toFixed(1)}% of limit
          </p>
        </div>

        {/* Render Time Metric */}
        <div className="rounded-lg p-4 border-2 bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
            Avg Render Time
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {metrics.renderTime?.toFixed(1) || 0} ms
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Render performance
          </p>
        </div>
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FPS History Chart */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">FPS History</h3>
          <div className="h-24 flex items-end gap-1 justify-end">
            {(metrics?.fpsHistory || []).slice(-30).map((fps, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 bg-gradient-to-t rounded-t",
                  fps >= 50 ? "from-green-400" : fps >= 30 ? "from-yellow-400" : "from-red-400"
                )}
                style={{ height: `${Math.min(fps / 60 * 100, 100)}%` }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Last 30 frames</p>
        </div>

        {/* Memory History Chart */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Memory Usage</h3>
          <div className="h-24 flex items-end gap-1 justify-end">
            {(metrics?.memoryHistory || []).slice(-30).map((mem, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 bg-gradient-to-t rounded-t",
                  mem <= 50 ? "from-green-400" : mem <= 80 ? "from-yellow-400" : "from-red-400"
                )}
                style={{ height: `${Math.min(mem / 100 * 100, 100)}%` }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Last 30 samples</p>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4" />
            Performance Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <p key={i} className="text-sm text-blue-800 dark:text-blue-300">
                • {rec}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Measurements */}
      {metrics?.measurements && Object.keys(metrics?.measurements || {}).length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
            Custom Measurements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(metrics?.measurements || {}).slice(-6).map(([name, duration]) => (
              <div key={name} className="flex justify-between items-center bg-white dark:bg-slate-700 rounded p-2">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{name}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {duration.toFixed(2)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
