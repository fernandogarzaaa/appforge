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
        <TabsList>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="w-4 h-4" />
            AI Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AIPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}