import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, ArrowRight } from 'lucide-react';

export default function ProactiveQuantumSuggestions({ userActivity = {} }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateSuggestions();
  }, [userActivity]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const activitySummary = `
User has been exploring quantum simulations.
Recent activity: ${JSON.stringify(userActivity)}
Session time: ${new Date().toLocaleString()}
      `.trim();

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this quantum simulation user activity, suggest 3-4 relevant experiments or analyses they might want to try next.

Activity context: ${activitySummary}

For each suggestion, provide:
1. Title (concise, 5-10 words)
2. Description (why this is relevant)
3. Difficulty (easy, medium, hard)
4. Estimated time (in minutes)
5. How it builds on their activity

Format as JSON array with objects containing: title, description, difficulty, time_minutes, relevance_reason`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  difficulty: { type: 'string' },
                  time_minutes: { type: 'number' },
                  relevance_reason: { type: 'string' },
                },
              },
            },
          },
        },
      });

      setSuggestions(response.data?.suggestions || []);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Suggested Experiments
            <Loader2 className="w-4 h-4 animate-spin ml-auto" />
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Suggested Experiments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-blue-200 bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-900">{suggestion.title}</h4>
                <Badge className={getDifficultyColor(suggestion.difficulty)} variant="secondary">
                  {suggestion.difficulty}
                </Badge>
              </div>

              <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>⏱ {suggestion.time_minutes}m</span>
                  <span>•</span>
                  <span className="text-blue-600">{suggestion.relevance_reason}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                  Try <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}

          {suggestions.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">
              No suggestions yet. Start exploring quantum simulations!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}