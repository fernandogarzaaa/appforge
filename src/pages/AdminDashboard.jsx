import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemHealthDashboard from '@/components/admin/SystemHealthDashboard';
import HelpTooltip from '@/components/help/HelpTooltip';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Tabs defaultValue="health" className="w-full">
        <div className="border-b bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <HelpTooltip 
                content="Monitor the health and performance of your AI monitoring system. Track alerts, resource usage, model accuracy, and integration health."
                title="System Dashboard"
              />
            </div>
            <TabsList className="mt-4">
              <TabsTrigger value="health">System Health</TabsTrigger>
              <TabsTrigger value="alerts">Alert Analytics</TabsTrigger>
              <TabsTrigger value="insights">System Insights</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="health" className="border-0">
          <SystemHealthDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="p-6 border-0">
          <div className="bg-white rounded-lg p-8 text-center text-slate-600">
            <p>Alert analytics coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="p-6 border-0">
          <div className="bg-white rounded-lg p-8 text-center text-slate-600">
            <p>System insights coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}