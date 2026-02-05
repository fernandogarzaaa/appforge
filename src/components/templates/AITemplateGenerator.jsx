import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Zap, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function AITemplateGenerator() {
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const examples = [
    "A fitness tracking app with workout plans, progress tracking, and social features",
    "An e-commerce platform for handmade crafts with inventory and order management",
    "A project management tool with kanban boards, time tracking, and team collaboration",
    "A real estate CRM with property listings, lead tracking, and showing scheduler"
  ];

  const generate = async () => {
    if (!description.trim() || !projectName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateProjectFromDescription', {
        description: description.trim(),
        project_name: projectName.trim()
      });

      setResult(response.data);
      toast.success('Project generated successfully!');
    } catch (error) {
      toast.error('Generation failed: ' + error.message);
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (result) {
    return (
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-6 h-6" />
            Project Generated!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{result.project.name}</h3>
            <p className="text-sm text-gray-700 mb-4">{result.project.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{result.entities?.length || 0}</div>
              <div className="text-xs text-gray-600">Entities</div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{result.pages?.length || 0}</div>
              <div className="text-xs text-gray-600">Pages</div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{result.components?.length || 0}</div>
              <div className="text-xs text-gray-600">Components</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Generated Entities:</h4>
            <div className="flex flex-wrap gap-2">
              {result.entities?.map((entity) => (
                <Badge key={entity.id} variant="outline">{entity.name}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Suggested Integrations:</h4>
            <div className="flex flex-wrap gap-2">
              {result.integrations?.map((integration, idx) => (
                <Badge key={idx} className="bg-purple-100 text-purple-700">{integration}</Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`${createPageUrl('EntityDesigner')}?projectId=${result.project.id}`)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Open in Editor
            </Button>
            <Button
              onClick={() => {
                setResult(null);
                setDescription('');
                setProjectName('');
              }}
              variant="outline"
            >
              Generate Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Project Generator
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
            🔮 QuantumAI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Awesome App"
          />
        </div>

        <div className="space-y-2">
          <Label>Describe Your App</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want to build..."
            className="min-h-[120px]"
          />
        </div>

        <div>
          <p className="text-xs text-gray-600 mb-2">Examples:</p>
          <div className="space-y-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setDescription(example)}
                className="text-left text-xs text-blue-600 hover:text-blue-700 hover:underline block"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={generate}
          disabled={generating || !description.trim() || !projectName.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with QuantumAI...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate Project
            </>
          )}
        </Button>

        <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-800">
          <p className="font-semibold mb-1">🔮 Quantum Enhancement</p>
          <p>Your description will be analyzed across multiple parallel reasoning timelines to generate the optimal project structure.</p>
        </div>
      </CardContent>
    </Card>
  );
}