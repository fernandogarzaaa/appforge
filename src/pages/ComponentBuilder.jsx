import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CodeEditorWithCompletion from '@/components/ai/CodeEditorWithCompletion';
import { Save, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ComponentBuilder() {
  const [componentName, setComponentName] = useState('');
  const [componentCode, setComponentCode] = useState(`import React from 'react';

export default function MyComponent() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Hello Component</h1>
    </div>
  );
}`);

  const handleSave = () => {
    if (!componentName) {
      toast.error('Please enter a component name');
      return;
    }
    toast.success('Component saved successfully!');
  };

  const handleTest = () => {
    toast.info('Testing component...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Component Builder</h1>
          <p className="text-gray-600 mt-1">Build React components with AI-powered code completion</p>
        </div>

        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Create Component
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Component Name</label>
              <Input
                placeholder="e.g., UserCard, DashboardWidget"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Component Code</label>
              <CodeEditorWithCompletion
                value={componentCode}
                onChange={setComponentCode}
                language="javascript"
                context="React component with Tailwind CSS. Building reusable UI component."
                placeholder="Write your React component..."
                rows={20}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="bg-purple-600">
                <Save className="w-4 h-4 mr-2" />
                Save Component
              </Button>
              <Button onClick={handleTest} variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Test Component
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}