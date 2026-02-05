import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuantumLLMSettings from '@/components/admin/QuantumLLMSettings';
import OnboardingSystemConfig from '@/components/admin/OnboardingSystemConfig';
import ProactiveAIAdmin from '@/components/admin/ProactiveAIAdmin';
import { Settings, Brain, Sparkles, Lightbulb } from 'lucide-react';

export default function AdminSystemConfig() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-gray-900" />
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        </div>
        <p className="text-gray-600">Configure platform-wide AI and onboarding settings</p>
      </div>

      <Tabs defaultValue="quantum" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quantum" className="gap-2">
            <Brain className="w-4 h-4" />
            QuantumAI
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="proactive" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Proactive AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quantum">
          <QuantumLLMSettings />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingSystemConfig />
        </TabsContent>

        <TabsContent value="proactive">
          <ProactiveAIAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}