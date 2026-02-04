import React, { useState, useEffect } from 'react';
import { useCodeSplitting } from './useCodeSplitting';
import { useDatabaseOptimization } from './useDatabaseOptimization';
import { useCacheStrategy } from './useCacheStrategy';

/**
 * Performance Dashboard Component
 * Displays bundle analysis, load times, and resource usage
 */
export const PerformanceDashboard = () => {
  const { stats: splitStats } = useCodeSplitting();
  const { queries, poolStats } = useDatabaseOptimization();
  const { cacheStats, getHitRate } = useCacheStrategy();
  const [metrics, setMetrics] = useState({
    bundleSize: 0,
    loadTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  });

  useEffect(() => {
    // Simulate performance metrics
    const updateMetrics = () => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          bundleSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
          memoryUsage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2),
          loadTime: splitStats.averageLoadTime.toFixed(2),
          cpuUsage: (Math.random() * 30 + 20).toFixed(2), // Mock CPU
        }));
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [splitStats]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>

      {/* Bundle Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Bundle Size</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.bundleSize} MB</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Load Time</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.loadTime} ms</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.memoryUsage}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">CPU Usage</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.cpuUsage}%</p>
        </div>
      </div>

      {/* Code Splitting Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Code Splitting</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Chunks</p>
            <p className="text-lg font-semibold">{splitStats.totalChunks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Loaded</p>
            <p className="text-lg font-semibold text-green-600">{splitStats.loadedChunks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Failed</p>
            <p className="text-lg font-semibold text-red-600">{splitStats.failedChunks}</p>
          </div>
        </div>
      </div>

      {/* Database Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Database Performance</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Connections</p>
            <p className="text-lg font-semibold">{poolStats.totalConnections}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-lg font-semibold text-green-600">{poolStats.activeConnections}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Idle</p>
            <p className="text-lg font-semibold text-gray-600">{poolStats.idleConnections}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Waiting</p>
            <p className="text-lg font-semibold text-orange-600">{poolStats.waitingRequests}</p>
          </div>
        </div>
        <div className="space-y-2">
          {queries.slice(0, 3).map(query => (
            <div key={query.id} className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-mono text-gray-700">{query.query}</p>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{query.executionTime}ms avg</span>
                <span>{query.calls} calls</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cache Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Cache Performance</h2>
        <div className="space-y-3">
          {['memory', 'redis', 'cdn'].map(level => (
            <div key={level} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="font-medium capitalize">{level} Cache</p>
                <p className="text-sm text-gray-500">
                  Hits: {cacheStats[level].hits} | Misses: {cacheStats[level].misses}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{getHitRate(level)}%</p>
                <p className="text-xs text-gray-500">Hit Rate</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
