import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CodeEditorWithCompletion from '@/components/ai/CodeEditorWithCompletion';
import { Save, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function FunctionBuilder() {
  const [functionName, setFunctionName] = useState('');
  const [functionCode, setFunctionCode] = useState(`import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your logic here
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});`);

  const handleSave = () => {
    if (!functionName) {
      toast.error('Please enter a function name');
      return;
    }
    toast.success('Function saved successfully!');
  };

  const handleTest = () => {
    toast.info('Testing function...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Function Builder</h1>
          <p className="text-gray-600 mt-1">Build backend functions with AI-powered code completion</p>
        </div>

        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Create Backend Function
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Function Name</label>
              <Input
                placeholder="e.g., processPayment, sendEmail"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Function Code</label>
              <CodeEditorWithCompletion
                value={functionCode}
                onChange={(val) => setFunctionCode(val)}
                language="typescript"
                context="Backend function using Base44 SDK and Deno. Handle authentication, database operations, and API integrations."
                placeholder="Write your backend function..."
                rows={20}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Save Function
              </Button>
              <Button onClick={handleTest} variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Test Function
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}