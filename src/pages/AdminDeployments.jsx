import React from 'react';
import DeploymentMonitor from '@/components/admin/DeploymentMonitor';

export default function AdminDeployments() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Deployment Monitor</h1>
          <p className="text-gray-600 mt-1">Admin control panel for all deployments</p>
        </div>
        <DeploymentMonitor />
      </div>
    </div>
  );
}