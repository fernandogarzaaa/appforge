/**
 * Admin Dashboard Home Tab
 * Shows 8 quick-stat cards with live data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/admin/StatCard';
import {
  Key,
  Lock,
  Users,
  Zap,
  Database,
  Cpu,
  HardDrive,
  AlertCircle,
} from 'lucide-react';

export default function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    apiKeys: { count: 24, trend: '+3 this week' },
    secrets: { count: 156, status: 'encrypted' },
    users: { count: 1_234, lastLogin: '2 hours ago' },
    apiRequests: { count: 45_231, trend: '↓ 12%' },
    dbStatus: { status: 'Healthy', color: 'green' },
    cpuUsage: { value: '34%', color: 'yellow' },
    storage: { used: '512GB / 1TB', progress: 0.51 },
    alerts: { count: 3, color: 'red' },
  });

  // Simulate loading stats from API
  useEffect(() => {
    const loadStats = async () => {
      // In a real app, fetch from API
      // const response = await adminStatsAPI.getDashboardStats();
      // setStats(response.data);
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Key}
            label="Active API Keys"
            value={stats.apiKeys.count}
            trend={stats.apiKeys.trend}
            color="purple"
            onClick={() => navigate('/admin?tab=api-keys')}
          />
          <StatCard
            icon={Lock}
            label="Secrets Stored"
            value={stats.secrets.count}
            status={stats.secrets.status}
            color="blue"
            onClick={() => navigate('/admin?tab=secrets')}
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.users.count.toLocaleString()}
            trend={stats.users.lastLogin}
            color="indigo"
            onClick={() => navigate('/admin?tab=users')}
          />
          <StatCard
            icon={Zap}
            label="API Requests/Min"
            value={stats.apiRequests.count.toLocaleString()}
            trend={stats.apiRequests.trend}
            color="cyan"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            icon={Database}
            label="DB Status"
            value="Healthy"
            color="green"
            status="active"
          />
          <StatCard
            icon={Cpu}
            label="CPU Usage"
            value={stats.cpuUsage.value}
            color="yellow"
          />
          <StatCard
            icon={HardDrive}
            label="Storage"
            value={stats.storage.used}
            progress={stats.storage.progress}
            color="purple"
          />
          <StatCard
            icon={AlertCircle}
            label="Active Alerts"
            value={stats.alerts.count}
            color="red"
            onClick={() => navigate('/admin?tab=monitoring')}
          />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent API Key Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent API Key Activity
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Production Key', action: 'Created', time: '2 hours ago' },
              { name: 'Test Key', action: 'Rotated', time: '5 hours ago' },
              { name: 'Legacy Key', action: 'Revoked', time: '1 day ago' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.action}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Secret Changes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Secret Changes
          </h3>
          <div className="space-y-3">
            {[
              { name: 'DB_PASSWORD', action: 'Updated', env: 'prod' },
              { name: 'API_SECRET', action: 'Rotated', env: 'staging' },
              { name: 'JWT_KEY', action: 'Created', env: 'dev' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.action}
                  </p>
                </div>
                <span
                  className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${item.env === 'prod' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}
                    ${item.env === 'staging' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}
                    ${item.env === 'dev' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}
                  `}
                >
                  {item.env}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
            Create API Key
          </button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            Add Secret
          </button>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
            Invite User
          </button>
          <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
            View Settings
          </button>
        </div>
      </div>
    </div>
  );
}
