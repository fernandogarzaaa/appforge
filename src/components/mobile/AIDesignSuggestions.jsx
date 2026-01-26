import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, CheckCircle, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function AIDesignSuggestions({ app, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this mobile app design and provide UI/UX improvement suggestions:

App Name: ${app.name}
Platform: ${app.platform}
Framework: ${app.app_type}
Current Theme: ${JSON.stringify(app.theme)}
Screens: ${app.screens?.length || 0}

Provide 5-7 actionable design suggestions covering:
1. Color palette improvements
2. Typography and readability
3. Navigation patterns
4. Component layout optimization
5. User experience enhancements
6. Modern design trends
7. Platform-specific best practices

Return as JSON: {"suggestions": [{"title": "...", "description": "...", "category": "color|typography|layout|navigation|ux", "priority": "high|medium|low", "implementation": "..."}]}`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions || []);
      toast.success('AI design suggestions generated!');
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (suggestion) => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Apply this design suggestion to the mobile app:

Suggestion: ${suggestion.title}
Implementation: ${suggestion.implementation}
Current App: ${JSON.stringify(app)}

Generate updated app configuration with the suggestion applied. Maintain all existing data.

Return as JSON with updated app configuration.`,
        response_json_schema: {
          type: "object",
          properties: {
            theme: { type: "object" },
            screens: { type: "array" }
          }
        }
      });

      onChange({ ...app, ...response });
      toast.success('Design suggestion applied!');
    } catch (error) {
      toast.error('Failed to apply suggestion');
    } finally {
      setGenerating(false);
    }
  };

  const categoryColors = {
    color: 'bg-purple-100 text-purple-800',
    typography: 'bg-blue-100 text-blue-800',
    layout: 'bg-green-100 text-green-800',
    navigation: 'bg-orange-100 text-orange-800',
    ux: 'bg-pink-100 text-pink-800'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Design Assistant
            </CardTitle>
            <Button onClick={generateSuggestions} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Generate Suggestions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Get AI-powered UI/UX recommendations to enhance your mobile app design
          </p>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((suggestion, idx) => (
            <Card key={idx} className={`border-2 ${priorityColors[suggestion.priority]}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                      <Badge className={categoryColors[suggestion.category]}>
                        {suggestion.category}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-700">
                          <span className="font-medium">Implementation: </span>
                          {suggestion.implementation}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => applySuggestion(suggestion)}
                  disabled={generating}
                  size="sm"
                  className="w-full mt-3"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle className="w-3 h-3 mr-2" />}
                  Apply Suggestion
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Click "Generate Suggestions" to get AI-powered design recommendations</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}