import React from 'react';
import { useDistributedTracing } from './useDistributedTracing';
import { useIncidentManagement } from './useIncidentManagement';

/**
 * Monitoring Dashboard Component
 */
export const MonitoringDashboard = () => {
  const { traces } = useDistributedTracing();
  const { incidents } = useIncidentManagement();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Advanced Monitoring</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Active Traces</h3>
          <p className="text-2xl font-bold">{traces.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Open Incidents</h3>
          <p className="text-2xl font-bold text-red-600">
            {incidents.filter(i => i.status === 'open').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Resolved Today</h3>
          <p className="text-2xl font-bold text-green-600">
            {incidents.filter(i => i.status === 'resolved').length}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Incidents</h2>
        <div className="space-y-2">
          {incidents.slice(0, 5).map(incident => (
            <div key={incident.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{incident.title || 'Incident'}</p>
                <p className="text-xs text-gray-500">{incident.id}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                incident.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {incident.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
