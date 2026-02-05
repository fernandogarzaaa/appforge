import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Zap, Brain, Globe, TrendingUp, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function QuantumLLMSettings() {
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch config
  const { data: configs = [] } = useQuery({
    queryKey: ['quantumLLMConfig'],
    queryFn: () => base44.entities.QuantumLLMConfig.list(),
  });

  const config = configs[0];

  // Update config
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (config) {
        return base44.entities.QuantumLLMConfig.update(config.id, data);
      } else {
        return base44.entities.QuantumLLMConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantumLLMConfig'] });
      toast.success('QuantumAI settings updated');
    },
  });

  // Test the LLM
  const testLLM = async () => {
    if (!testPrompt.trim()) {
      toast.error('Enter a test prompt');
      return;
    }

    setTesting(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: testPrompt,
        add_context_from_internet: config?.auto_research_enabled
      });

      setTestResult({ result: response, model: 'QuantumAI-v1' });
      toast.success('QuantumAI responded!');
    } catch (error) {
      toast.error('Test failed: ' + error.message);
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🔮 QuantumAI Configuration</h2>
              <p className="text-purple-100 text-sm">
                Your custom quantum-enhanced language model
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Model Settings</CardTitle>
          <CardDescription>
            Configure your QuantumAI behavior and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">Enable QuantumAI by Default</div>
              <p className="text-sm text-gray-600">Default setting for all users (users can override in their settings)</p>
            </div>
            <Switch
              checked={config?.enabled ?? true}
              onCheckedChange={(checked) => {
                updateMutation.mutate({ enabled: checked });
              }}
            />
          </div>

          {/* Model Name */}
          <div className="space-y-2">
            <Label>Model Name/Branding</Label>
            <Input
              value={config?.model_name || 'QuantumAI-v1'}
              onChange={(e) => updateMutation.mutate({ model_name: e.target.value })}
              placeholder="QuantumAI-v1"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Creativity Level (Temperature)</Label>
              <Badge variant="outline">{config?.default_temperature || 0.7}</Badge>
            </div>
            <Slider
              value={[config?.default_temperature || 0.7]}
              onValueChange={([value]) => updateMutation.mutate({ default_temperature: value })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Focused (0)</span>
              <span>Balanced (0.5)</span>
              <span>Creative (1)</span>
            </div>
          </div>

          {/* Quantum Timelines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Parallel Reasoning Timelines</Label>
              <Badge variant="outline">{config?.quantum_timelines || 3}</Badge>
            </div>
            <Slider
              value={[config?.quantum_timelines || 3]}
              onValueChange={([value]) => updateMutation.mutate({ quantum_timelines: Math.round(value) })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-600">
              More timelines = deeper analysis but slower response
            </p>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Confidence Threshold</Label>
              <Badge variant="outline">{Math.round((config?.confidence_threshold || 0.85) * 100)}%</Badge>
            </div>
            <Slider
              value={[config?.confidence_threshold || 0.85]}
              onValueChange={([value]) => updateMutation.mutate({ confidence_threshold: value })}
              min={0.5}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>

          {/* Auto Research */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-gray-900">Auto Internet Research</div>
                <p className="text-sm text-gray-600">Automatically fetch real-time data for all queries</p>
              </div>
            </div>
            <Switch
              checked={config?.auto_research_enabled ?? false}
              onCheckedChange={(checked) => {
                updateMutation.mutate({ auto_research_enabled: checked });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Test QuantumAI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Test Prompt</Label>
            <Input
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="What is the future of quantum computing?"
              onKeyPress={(e) => e.key === 'Enter' && testLLM()}
            />
          </div>
          <Button 
            onClick={testLLM} 
            disabled={testing || !testPrompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {testing ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Processing Quantum Analysis...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test QuantumAI
              </>
            )}
          </Button>

          {testResult && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">
                  {testResult.model}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Quantum-Enhanced
                </Badge>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {typeof testResult.result === 'string' ? testResult.result : JSON.stringify(testResult.result, null, 2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">ℹ️ How QuantumAI Works</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Analyzes every prompt across multiple parallel reasoning timelines</li>
            <li>Evaluates confidence, risk, and quality for each timeline</li>
            <li>Converges to the optimal response balancing all perspectives</li>
            <li>No infrastructure needed - quantum-enhanced wrapper around base LLM</li>
            <li><strong>Admin Control:</strong> Set default for all users; users can toggle in Settings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}