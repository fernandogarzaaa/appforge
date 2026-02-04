import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Lightbulb, Loader2, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AIUXSuggestions({ projectId, projectDescription = '' }) {
  const [description, setDescription] = useState(projectDescription);
  const [suggestions, setSuggestions] = useState(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiUXImprovement', {
        projectId,
        projectDescription: description,
        pages: [],
        components: []
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSuggestions(data.improvements);
      toast.success('UI/UX analysis complete!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to analyze UX');
    }
  });

  const handleApply = (suggestionId) => {
    setAppliedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
  };

  const getEffortColor = (effort) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800'
    };
    return colors[effort] || colors.Low;
  };

  const getImpactColor = (impact) => {
    const colors = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-orange-100 text-orange-800',
      'Low': 'bg-blue-100 text-blue-800'
    };
    return colors[impact] || colors.Medium;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">AI UI/UX Suggestions</h3>
            <p className="text-sm text-gray-600">Get intelligent recommendations for design improvements</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project... (e.g., 'E-commerce platform for selling handmade crafts')"
              className="rounded-lg h-24"
            />
          </div>

          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={!description.trim() || analyzeMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4 mr-2" />
                Get Suggestions
              </>
            )}
          </Button>
        </div>
      </div>

      {suggestions && (
        <div className="space-y-4">
          {suggestions.priorityOrder && suggestions.priorityOrder.length > 0 && (
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Suggested Priority Order</h4>
                <div className="space-y-2">
                  {suggestions.priorityOrder.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {suggestions.suggestions && suggestions.suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Detailed Suggestions</h4>
              {suggestions.suggestions.map((suggestion, idx) => (
                <Card key={idx} className={appliedSuggestions.has(idx) ? 'border-green-500 bg-green-50/30' : ''}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900">{suggestion.title}</h5>
                          {appliedSuggestions.has(idx) && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{suggestion.category}</p>
                        <p className="text-sm text-gray-700">{suggestion.description}</p>
                      </div>
                      <Button
                        variant={appliedSuggestions.has(idx) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleApply(idx)}
                        className={appliedSuggestions.has(idx) ? 'bg-green-600' : ''}
                      >
                        {appliedSuggestions.has(idx) ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Applied
                          </>
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={getImpactColor(suggestion.impact)}>
                        Impact: {suggestion.impact}
                      </Badge>
                      <Badge className={getEffortColor(suggestion.effort)}>
                        Effort: {suggestion.effort}
                      </Badge>
                    </div>

                    {suggestion.implementation && (
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                        <code>{suggestion.implementation}</code>
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {suggestions.accessibilityChecklist && suggestions.accessibilityChecklist.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-gray-900">Accessibility Checklist (WCAG 2.1 AA)</h4>
                <div className="space-y-2">
                  {suggestions.accessibilityChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-blue-50 rounded">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}