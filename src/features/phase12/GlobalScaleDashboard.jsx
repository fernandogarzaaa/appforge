import React from 'react';
import { useMultiRegion } from './useMultiRegion';
import { useCDNIntegration } from './useCDNIntegration';
import { useAutoScaling } from './useAutoScaling';

/**
 * Global Scale Dashboard Component
 */
export const GlobalScaleDashboard = () => {
  const { regions, selectedRegion, failover } = useMultiRegion();
  const { cdnStats } = useCDNIntegration();
  const { currentScale } = useAutoScaling();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Global Scale Dashboard</h1>

      {/* CDN Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Requests</h3>
          <p className="text-2xl font-bold">{(cdnStats.totalRequests / 1000000).toFixed(2)}M</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Cache Hit Rate</h3>
          <p className="text-2xl font-bold text-green-600">{cdnStats.cacheHitRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Bandwidth</h3>
          <p className="text-2xl font-bold">{cdnStats.bandwidth} TB</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Active Instances</h3>
          <p className="text-2xl font-bold">{currentScale.instances}</p>
        </div>
      </div>

      {/* Regional Health */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Regional Health</h2>
        <div className="space-y-3">
          {regions.map(region => (
            <div key={region.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{region.name}</h3>
                  {selectedRegion?.id === region.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Active</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Latency: {region.latency.toFixed(0)}ms</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Load</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${region.load > 80 ? 'bg-red-500' : region.load > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${region.load}%` }}
                    />
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  region.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {region.status}
                </span>
                {region.id !== selectedRegion?.id && (
                  <button
                    onClick={() => failover(region.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Failover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Scaling */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Auto-Scaling Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">CPU Usage</p>
            <p className="text-2xl font-bold">{currentScale.cpu.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Memory Usage</p>
            <p className="text-2xl font-bold">{currentScale.memory.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Requests/sec</p>
            <p className="text-2xl font-bold">{currentScale.requestsPerSecond.toFixed(0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
