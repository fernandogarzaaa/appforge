import React, { useState } from 'react';
import { useAIGeneration } from './useAIGeneration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Copy,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  Code2,
  Loader2,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AI Code Generator Component
 * Generates code suggestions using AI based on context and type
 */
export function AICodeGenerator({ onCodeInsert, editorInstance, language = 'javascript' }) {
  const {
    isGenerating,
    suggestions,
    error,
    usageStats,
    generateCode,
    validateCode,
    explainCode,
    cancel,
    applySuggestion,
  } = useAIGeneration();

  const [description, setDescription] = useState('');
  const [generationType, setGenerationType] = useState('functionComplete');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showValidation, setShowValidation] = useState(true);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    const context = {
      code: editorInstance?.getValue?.() || '',
      description,
      language,
      style: 'modern, clean, well-documented',
    };

    await generateCode(context, generationType);
  };

  const handleExplain = async (suggestion) => {
    setIsExplaining(true);
    setSelectedSuggestion(suggestion);

    const exp = await explainCode(suggestion.code, language);
    setExplanation(exp);
    setIsExplaining(false);
  };

  const handleApply = async (suggestion) => {
    const validation = validateCode(suggestion.code, language);

    if (!validation.isValid && showValidation) {
      // Show validation issues first
      alert(`Code Quality Issues:\n${validation.issues.join('\n')}`);
    }

    const result = await applySuggestion(suggestion, false);

    if (result.applied && onCodeInsert) {
      onCodeInsert(suggestion.code);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
  };

  const generationTypes = {
    functionComplete: 'Complete Function',
    refactoring: 'Refactor Code',
    bugFix: 'Fix Bug',
    testGeneration: 'Generate Tests',
    documentation: 'Add Documentation',
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">AI Code Generator</h2>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {usageStats.tokens > 0 && (
            <span>
              {usageStats.tokens} tokens • ${usageStats.cost.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Generation Type & Input */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <Select value={generationType} onValueChange={setGenerationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(generationTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <Select value={language} disabled>
              <SelectTrigger>
                <SelectValue>{language}</SelectValue>
              </SelectTrigger>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description or Instructions
          </label>
          <Textarea
            placeholder="Describe what you want to generate..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-24"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>

          {isGenerating && (
            <Button onClick={cancel} variant="outline">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-300">Error</h4>
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Validation Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showValidation"
          checked={showValidation}
          onChange={(e) => setShowValidation(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="showValidation" className="text-sm font-medium">
          Show quality validation before insertion
        </label>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Suggestions ({suggestions.length})</h3>

          {suggestions.map((suggestion, index) => {
            const validation = validateCode(suggestion.code, language);

            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border-2 transition-colors',
                  selectedSuggestion === suggestion
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                )}
              >
                {/* Suggestion Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      Suggestion #{index + 1}
                      {suggestion.title && <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">{suggestion.title}</span>}
                    </h4>
                    {suggestion.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {suggestion.description}
                      </p>
                    )}
                  </div>

                  {/* Quality Score */}
                  {showValidation && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {validation.score}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Quality</div>
                    </div>
                  )}
                </div>

                {/* Code Display */}
                <div className="bg-gray-900 text-gray-100 rounded p-3 font-mono text-sm overflow-x-auto mb-3 max-h-64">
                  <pre>{suggestion.code}</pre>
                </div>

                {/* Validation Issues */}
                {showValidation && validation.issues.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {validation.issues.map((issue, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 text-sm"
                      >
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-yellow-800 dark:text-yellow-200">{issue}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {selectedSuggestion === suggestion && explanation && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm text-blue-900 dark:text-blue-300">
                          Explanation
                        </h5>
                        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                          {explanation.explanation || JSON.stringify(explanation, null, 2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApply(suggestion)}
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Apply
                  </Button>

                  <Button
                    onClick={() => handleExplain(suggestion)}
                    variant="outline"
                    size="sm"
                    disabled={isExplaining}
                    className="flex items-center justify-center gap-2"
                  >
                    {isExplaining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Explain
                  </Button>

                  <Button
                    onClick={() => handleCopy(suggestion.code)}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isGenerating && description && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <Code2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No suggestions yet. Click Generate to start.</p>
        </div>
      )}
    </div>
  );
}

export default AICodeGenerator;
