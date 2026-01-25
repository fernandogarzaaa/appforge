import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntegrationTriggerManager from '@/components/integrations/IntegrationTriggerManager';
import ChatOpsInterface from '@/components/integrations/ChatOpsInterface';
import ExternalSyncDashboard from '@/components/integrations/ExternalSyncDashboard';
import { Zap, MessageCircle, TrendingUp } from 'lucide-react';

export default function IntegrationHub() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">Integration Hub</h1>
          <p className="text-slate-600 mt-1">Automate workflows, chat commands, and external platform sync</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="triggers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="triggers" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Workflow Triggers</span>
            </TabsTrigger>
            <TabsTrigger value="chatops" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">ChatOps</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">External Sync</span>
            </TabsTrigger>
          </TabsList>

          {/* Workflow Triggers */}
          <TabsContent value="triggers" className="mt-6">
            <div className="bg-white rounded-lg p-6">
              <IntegrationTriggerManager />
            </div>
          </TabsContent>

          {/* ChatOps */}
          <TabsContent value="chatops" className="mt-6">
            <div className="bg-white rounded-lg p-6">
              <ChatOpsInterface />
            </div>
          </TabsContent>

          {/* External Sync */}
          <TabsContent value="sync" className="mt-6">
            <div className="bg-white rounded-lg p-6">
              <ExternalSyncDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}