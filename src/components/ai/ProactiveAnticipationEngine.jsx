import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lightbulb, Zap, Sparkles, ChevronRight } from 'lucide-react';

export default function ProactiveAnticipationEngine({ userEmail, onSuggestionSelect }) {
  const [anticipation, setAnticipation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  useEffect(() => {
    analyzeNeeds();
    const interval = setInterval(analyzeNeeds, 120000); // Every 2 minutes
    return () => clearInterval(interval);
  }, [userEmail]);

  const analyzeNeeds = async () => {
    try {
      const response = await base44.functions.invoke('anticipateUserNeeds', {
        userEmail,
      });
      setAnticipation(response.data);
    } catch (error) {
      console.error('Anticipation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'agent_deployment':
        return <Zap className="w-4 h-4 text-blue-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const handleSuggestion = (suggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  if (isLoading || !anticipation) {
    return null;
  }

  // Only show if there are suggestions and user should be engaged
  if (!anticipation.personalization?.should_engage_now || anticipation.suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* High Priority Suggestions */}
      {anticipation.suggestions.filter(s => s.priority === 'high').map((suggestion, idx) => (
        <Card key={idx} className={`border-2 ${getPriorityColor(suggestion.priority)}`}>
          <CardContent className="p-3">
            <button
              onClick={() => setExpandedSuggestion(expandedSuggestion === idx ? null : idx)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{suggestion.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{suggestion.description}</p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedSuggestion === idx ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {expandedSuggestion === idx && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                <p className="text-xs text-gray-600">
                  <strong>Why:</strong> {suggestion.reasoning}
                </p>
                {suggestion.action && (
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    onClick={() => handleSuggestion(suggestion)}
                  >
                    {suggestion.action}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Context Warnings */}
      {anticipation.warnings?.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-red-900 mb-2">⚠️ Context Awareness</p>
            <div className="space-y-1">
              {anticipation.warnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-red-700">• {warning}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medium Priority Suggestions */}
      {anticipation.suggestions.filter(s => s.priority === 'medium').slice(0, 2).map((suggestion, idx) => (
        <Card key={idx} className={`border ${getPriorityColor(suggestion.priority)}`}>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              {getSuggestionIcon(suggestion.type)}
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{suggestion.title}</p>
                <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                {suggestion.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleSuggestion(suggestion)}
                  >
                    {suggestion.action}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Personalization Info */}
      {anticipation.personalization?.layout_focus && (
        <Card className="border-cyan-200 bg-cyan-50/30">
          <CardContent className="p-3">
            <p className="text-xs text-cyan-700">
              <span className="font-semibold">🎯 Specialized for:</span> {anticipation.personalization.layout_focus}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}