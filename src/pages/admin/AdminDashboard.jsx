/**
 * Admin Dashboard - Main Container
 * Protected by ProtectedAdminRoute, shows 8-tab interface
 */

import React, { useState } from 'react';
import { useAdminContext } from '@/lib/AdminContext';
import ProtectedAdminRoute from '@/components/auth/ProtectedAdminRoute';
import SpectrumNavigation from '@/components/navigation/SpectrumNavigation';
import AdminHome from './tabs/AdminHome';
import ApiKeysTab from './tabs/ApiKeysTab';
import SecretsTab from './tabs/SecretsTab';
import {
  Key,
  Lock,
  Users,
  Settings,
  BarChart3,
  Bell,
  CreditCard,
  Eye,
} from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Home', icon: BarChart3, component: AdminHome },
  { id: 'api-keys', label: 'API Keys', icon: Key, component: ApiKeysTab },
  { id: 'secrets', label: 'Secrets', icon: Lock, component: SecretsTab },
  { id: 'users', label: 'Users', icon: Users, component: null },
  { id: 'projects', label: 'Projects', icon: Settings, component: null },
  { id: 'monitoring', label: 'Monitoring', icon: Bell, component: null },
  { id: 'billing', label: 'Billing', icon: CreditCard, component: null },
  { id: 'audit', label: 'Audit Log', icon: Eye, component: null },
];

export default function AdminDashboard() {
  const { isAdmin, isLoadingAdmin, userRole } = useAdminContext();
  const [activeTab, setActiveTab] = useState('home');

  if (isLoadingAdmin) {
    return (
      <SpectrumNavigation>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-3 border-purple-300 border-t-purple-600 rounded-full mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
          </div>
        </div>
      </SpectrumNavigation>
    );
  }

  if (!isAdmin) {
    return (
      <SpectrumNavigation>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      </SpectrumNavigation>
    );
  }

  const activeTabConfig = TABS.find((tab) => tab.id === activeTab);
  const Component = activeTabConfig?.component;

  return (
    <ProtectedAdminRoute requiredRole="admin">
      <SpectrumNavigation>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {userRole === 'super_admin' ? 'Super Admin' : 'Admin'} • Manage your platform
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 overflow-x-auto pb-px">
                {TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDisabled = !tab.component;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => !isDisabled && setActiveTab(tab.id)}
                      disabled={isDisabled}
                      className={`
                        flex items-center gap-2 px-4 py-3 border-b-2 font-medium
                        transition-all whitespace-nowrap
                        ${isActive
                          ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400'
                        }
                        ${isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:text-purple-600 dark:hover:text-purple-400'
                        }
                      `}
                      aria-selected={isActive}
                      role="tab"
                      aria-label={tab.label}
                    >
                      <TabIcon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {Component ? (
              <Component />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Coming soon: {activeTabConfig?.label}
                </p>
              </div>
            )}
          </div>
        </div>
      </SpectrumNavigation>
    </ProtectedAdminRoute>
  );
}
