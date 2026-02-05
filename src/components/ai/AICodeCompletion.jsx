import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function AICodeCompletion({ 
  value, 
  cursorPosition, 
  language = 'javascript',
  context = '',
  onSuggestion 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (value && cursorPosition > 0) {
        fetchSuggestions();
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, cursorPosition]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const beforeCursor = value.substring(0, cursorPosition);
      const afterCursor = value.substring(cursorPosition);
      
      const prompt = `You are an AI code completion assistant for Base44 platform development.

Context: ${context}
Language: ${language}

Code before cursor:
\`\`\`${language}
${beforeCursor}
\`\`\`

Code after cursor:
\`\`\`${language}
${afterCursor}
\`\`\`

Provide 3 context-aware code completion suggestions. Consider:
- React best practices and hooks
- Tailwind CSS classes
- TypeScript types
- Base44 SDK methods (base44.entities, base44.auth, base44.functions, base44.integrations)
- Current code context

Return ONLY a JSON array of suggestions with format:
[{"code": "suggestion text", "description": "what it does"}]`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (onSuggestion) {
      onSuggestion(suggestion.code);
    }
    setSuggestions([]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setSuggestions([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex]);

  if (suggestions.length === 0 && !loading) return null;

  return (
    <Card className="absolute z-50 mt-2 w-96 shadow-2xl border-2 border-purple-200 bg-white/95 backdrop-blur-sm">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-gray-700">AI Suggestions</span>
          {loading && <Loader2 className="w-3 h-3 animate-spin text-purple-600 ml-auto" />}
        </div>
        
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => applySuggestion(suggestion)}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-all",
                idx === selectedIndex
                  ? "bg-purple-100 border-2 border-purple-300"
                  : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
              )}
            >
              <div className="flex items-start gap-2">
                <code className="flex-1 text-xs text-gray-900 font-mono break-all">
                  {suggestion.code}
                </code>
                {idx === selectedIndex && (
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Tab</kbd> or{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Enter</kbd> to apply ·{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">↑↓</kbd> to navigate ·{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Esc</kbd> to dismiss
        </div>
      </div>
    </Card>
  );
}