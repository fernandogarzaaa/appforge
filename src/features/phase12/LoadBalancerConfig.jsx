import React, { useState } from 'react';
import { useAutoScaling } from './useAutoScaling';

/**
 * Load Balancer Configuration Component
 */
export const LoadBalancerConfig = () => {
  const { scalingConfig, updateConfig, scaleManually } = useAutoScaling();
  const [targetInstances, setTargetInstances] = useState(5);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Load Balancer Configuration</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Scaling Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Instances</label>
            <input
              type="number"
              value={scalingConfig.minInstances}
              onChange={(e) => updateConfig({ minInstances: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Instances</label>
            <input
              type="number"
              value={scalingConfig.maxInstances}
              onChange={(e) => updateConfig({ maxInstances: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target CPU (%)</label>
            <input
              type="number"
              value={scalingConfig.targetCPU}
              onChange={(e) => updateConfig({ targetCPU: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Memory (%)</label>
            <input
              type="number"
              value={scalingConfig.targetMemory}
              onChange={(e) => updateConfig({ targetMemory: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Manual Scaling</h2>
        <div className="flex gap-4">
          <input
            type="number"
            value={targetInstances}
            onChange={(e) => setTargetInstances(parseInt(e.target.value))}
            min={scalingConfig.minInstances}
            max={scalingConfig.maxInstances}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => scaleManually(targetInstances)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Scale Now
          </button>
        </div>
      </div>
    </div>
  );
};
