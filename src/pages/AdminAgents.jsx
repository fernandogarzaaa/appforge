import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AgentManagementHub from '@/components/admin/AgentManagementHub';
import AdminPermissionsManager from '@/components/admin/AdminPermissionsManager';
import { Bot, Lock } from 'lucide-react';

export default function AdminAgents() {
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent & Permissions Control</h1>
          <p className="text-gray-600">Manage AI agents, permissions, and admin access controls</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="w-4 h-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Lock className="w-4 h-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6 mt-6">
            <AgentManagementHub />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6 mt-6">
            <AdminPermissionsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}