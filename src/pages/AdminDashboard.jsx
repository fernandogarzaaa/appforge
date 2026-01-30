import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemHealthDashboard from '@/components/admin/SystemHealthDashboard';
import APIKeyManagement from '@/components/admin/APIKeyManagement';
import AdminSettings from '@/components/admin/AdminSettings';
import UserManagement from '@/components/admin/UserManagement';
import HelpTooltip from '@/components/help/HelpTooltip';
import { Shield, Key, Settings, Users } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Tabs defaultValue="health" className="w-full">
        <div className="border-b bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your application settings, API keys, and users</p>
              </div>
              <HelpTooltip 
                content="Access admin controls to manage API keys, system settings, users, and monitor system health. All changes require admin privileges."
                title="Admin Dashboard"
              />
            </div>
            
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Health</span>
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* System Health Tab */}
        <TabsContent value="health" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <SystemHealthDashboard />
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <APIKeyManagement />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <AdminSettings />
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <UserManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}