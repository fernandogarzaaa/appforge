import React from 'react';
import { useMobileApp } from './useMobileApp';
import { useDesktopApp } from './useDesktopApp';
import { useCLITools } from './useCLITools';

/**
 * Platform Expansion Dashboard Component
 */
export const PlatformExpansionDashboard = () => {
  const { syncStatus, notifications } = useMobileApp();
  const { appVersion, updateAvailable } = useDesktopApp();
  const { commands } = useCLITools();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Platform Expansion</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Mobile Sync Status</h3>
          <p className="text-2xl font-bold capitalize">{syncStatus.status}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Desktop Version</h3>
          <p className="text-2xl font-bold">{appVersion}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Updates Available</h3>
          <p className="text-2xl font-bold">{updateAvailable ? 'Yes' : 'No'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">CLI Commands</h3>
          <p className="text-2xl font-bold">{commands.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Push Notifications</h2>
        <div className="space-y-2">
          {notifications.slice(0, 5).map(notif => (
            <div key={notif.id} className="p-3 bg-gray-50 rounded">
              <p className="font-medium">{notif.title}</p>
              <p className="text-sm text-gray-600">{notif.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
