import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Code, Zap, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AIComponentGenerator({ projectId }) {
  const [componentType, setComponentType] = useState('button');
  const [requirements, setRequirements] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiComponentGenerator', {
        projectId,
        componentType,
        requirements,
        framework: 'react'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedCode(data.component);
      toast.success('Component generated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate component');
    }
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(0);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-start gap-3 mb-4">
          <Code className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Component Generator</h3>
            <p className="text-sm text-gray-600">Generate production-ready React components with AI</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Component Type</label>
            <Input
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              placeholder="e.g., Search Bar, Card, Modal, Form"
              className="rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe what you need... (e.g., 'Dark mode support, keyboard navigation, debounced search')"
              className="rounded-lg h-24"
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!componentType.trim() || !requirements.trim() || generateMutation.isPending}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Component
              </>
            )}
          </Button>
        </div>
      </div>

      {generatedCode && (
        <Card className="border-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{generatedCode.name}</h4>
                <p className="text-sm text-gray-600">Ready to use in your project</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(generatedCode.code)}
              >
                {copiedIndex === 0 ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>

            {generatedCode.dependencies && generatedCode.dependencies.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-900 mb-2">Dependencies</p>
                <div className="flex flex-wrap gap-2">
                  {generatedCode.dependencies.map((dep) => (
                    <span key={dep} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
              {generatedCode.code}
            </pre>

            {generatedCode.props && generatedCode.props.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Props</p>
                <div className="space-y-2">
                  {generatedCode.props.map((prop, idx) => (
                    <div key={idx} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                      <span className="font-mono font-semibold">{prop.name}</span>
                      <span className="text-gray-500"> - {prop.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}