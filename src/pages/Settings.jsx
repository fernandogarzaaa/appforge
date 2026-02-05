import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIPreferences from '@/components/settings/AIPreferences';
import { Settings as SettingsIcon, Brain } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-gray-900" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="w-4 h-4" />
            AI Preferences
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            Account Settings
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AIPreferences />
        </TabsContent>

        <TabsContent value="account">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Account Settings</h3>
            <p className="text-gray-600">Account settings coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Integrations</h3>
            <p className="text-gray-600">Manage your integrations here...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}