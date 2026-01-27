import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Smartphone, Code, Palette, Zap, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';
import MobilePreview from './MobilePreview';
import ScreenEditor from './ScreenEditor';
import ThemeEditor from './ThemeEditor';
import CodeExport from './CodeExport';
import AIDesignSuggestions from './AIDesignSuggestions';
import AccessibilityChecker from './AccessibilityChecker';

export default function MobileAppEditor({ app, onBack }) {
  const [currentApp, setCurrentApp] = useState(app);
  const [activeTab, setActiveTab] = useState('screens');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MobileApp.update(app.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mobileApps']);
      toast.success('App saved!');
    }
  });

  const buildMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('buildMobileApp', { app_id: app.id });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Build started! You\'ll receive a notification when ready.');
    }
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Editor Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">{currentApp.name}</h2>
              <p className="text-sm text-gray-500 capitalize">{currentApp.platform} • {currentApp.app_type.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => saveMutation.mutate(currentApp)}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={() => buildMutation.mutate()}>
              <Zap className="w-4 h-4 mr-2" />
              Build App
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="screens">
                <Smartphone className="w-4 h-4 mr-2" />
                Screens
              </TabsTrigger>
              <TabsTrigger value="theme">
                <Palette className="w-4 h-4 mr-2" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="ai-design">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Design
              </TabsTrigger>
              <TabsTrigger value="accessibility">
                <Shield className="w-4 h-4 mr-2" />
                Accessibility
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="w-4 h-4 mr-2" />
                Export Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="screens">
              <ScreenEditor app={currentApp} onChange={setCurrentApp} />
            </TabsContent>

            <TabsContent value="theme">
              <ThemeEditor app={currentApp} onChange={setCurrentApp} />
            </TabsContent>

            <TabsContent value="ai-design">
              <AIDesignSuggestions app={currentApp} onChange={setCurrentApp} />
            </TabsContent>

            <TabsContent value="accessibility">
              <AccessibilityChecker app={currentApp} />
            </TabsContent>

            <TabsContent value="code">
              <CodeExport app={currentApp} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-96 bg-white border-l p-6">
        <MobilePreview app={currentApp} />
      </div>
    </div>
  );
}