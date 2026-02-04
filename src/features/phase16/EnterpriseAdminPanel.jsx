import React from 'react';
import { useAdvancedAnalytics } from './useAdvancedAnalytics';
import { useCustomWorkflows } from './useCustomWorkflows';

/**
 * Enterprise Admin Panel Component
 */
export const EnterpriseAdminPanel = () => {
  const { metrics } = useAdvancedAnalytics();
  const { workflows } = useCustomWorkflows();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Enterprise Admin Panel</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Active Users</h3>
          <p className="text-2xl font-bold">12,450</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Monthly Revenue</h3>
          <p className="text-2xl font-bold">$85,400</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Custom Metrics</h3>
          <p className="text-2xl font-bold">{metrics.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Active Workflows</h3>
          <p className="text-2xl font-bold">{workflows.length}</p>
        </div>
      </div>
    </div>
  );
};
