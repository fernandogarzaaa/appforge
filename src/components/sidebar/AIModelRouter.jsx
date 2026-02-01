import React, { useState, useEffect } from 'react';
import { useLLM, AI_MODELS } from '@/contexts/LLMContext';
import { useModelSearch, useKeyboardShortcuts } from '@/hooks/useSearch';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  Check,
  ChevronDown,
  MoreHorizontal,
  Search,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

function AIModelRouter() {
  const { selectedModel, availableModels, updateSettings, settings } = useLLM();
  const { trackModelSelection, trackSearch, trackKeyboardShortcut } = useAnalytics();
  const [displayModel, setDisplayModel] = useState(selectedModel || 'base44');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const modelsList = Object.values(AI_MODELS);
  const { query, setQuery, filteredModels } = useModelSearch(modelsList);

  useEffect(() => {
    setDisplayModel(selectedModel || 'base44');
  }, [selectedModel]);

  // Keyboard shortcuts: Ctrl/Cmd + 1-9 to switch models
  const handleModelShortcut = (index) => {
    if (index < modelsList.length) {
      const model = modelsList[index];
      trackKeyboardShortcut(`Ctrl/Cmd+${index + 1}`, model.name);
      handleModelSelect(model.id);
    }
  };

  const { handleKeyDown } = useKeyboardShortcuts(handleModelShortcut, modelsList.length);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentModel = AI_MODELS[Object.keys(AI_MODELS).find(
    (key) => AI_MODELS[key].id === displayModel
  )] || AI_MODELS.BASE44;

  const handleModelSelect = (modelId) => {
    const model = AI_MODELS[Object.keys(AI_MODELS).find((key) => AI_MODELS[key].id === modelId)];
    trackModelSelection(modelId, model.name, model.provider, model.costPer1k);
    setDisplayModel(modelId);
    updateSettings({ selectedModel: modelId });
    setShowSearch(false);
    setQuery('');
  };

  const displayedModels = showSearch && query.trim() ? filteredModels : modelsList;

  return (
    <div className="space-y-3">
      {/* Current Model Display - Zen Clean Design */}
      <TooltipProvider>
        <RadixTooltip>
          <TooltipTrigger asChild>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/40 px-4 py-3 space-y-2 cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-500">Active Model</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {currentModel.name}
                </p>
                <Badge
                  variant="secondary"
                  className="text-xs whitespace-nowrap ml-2 bg-gray-200 dark:bg-gray-700"
                >
                  {currentModel.provider}
                </Badge>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-xs">
            <p className="font-medium">{currentModel.name}</p>
            <p className="text-gray-300 mt-1">{currentModel.description}</p>
            <p className="text-gray-400 mt-1 text-xs">
              Cost: ${currentModel.costPer1k}/1K tokens
            </p>
          </TooltipContent>
        </RadixTooltip>
      </TooltipProvider>

      {/* Model Switcher Button with Search */}
      <DropdownMenu open={showSearch} onOpenChange={setShowSearch}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-9 text-xs border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <span className="truncate">Switch Model</span>
            <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-0">
          {/* Search Input */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-950">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2" />
              <input
                type="text"
                placeholder="Search models..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  trackSearch(e.target.value, filteredModels.length);
                }}
                className="w-full pl-7 pr-7 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md outline-none transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {displayedModels.length} {displayedModels.length === 1 ? 'model' : 'models'}
              {query && ` matching "${query}"`}
            </p>
          </div>

          {/* Models List */}
          <div className="max-h-80 overflow-y-auto">
            {displayedModels.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                No models found
              </div>
            ) : (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-950">
                  AVAILABLE MODELS (Ctrl/Cmd + 1-9 to switch)
                </div>
                {displayedModels.map((model, index) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{model.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {model.name}
                            </p>
                            {index < 9 && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                              >
                                ⌘{index + 1}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {model.provider}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-snug">
                        {model.description}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {model.strengths.slice(0, 2).map((strength) => (
                          <Badge
                            key={strength}
                            variant="secondary"
                            className="text-xs px-1.5 py-0 text-gray-700 dark:text-gray-300"
                          >
                            {strength}
                          </Badge>
                        ))}
                        {model.strengths.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0 text-gray-700 dark:text-gray-300"
                          >
                            +{model.strengths.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {displayModel === model.id && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Progressive Disclosure - Advanced Options */}
      {availableModels && availableModels.length > 0 && (
        <div className="space-y-2 pt-1">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <MoreHorizontal className="w-3 h-3" />
            <span>{showAdvanced ? 'Hide' : 'Show'} advanced</span>
          </button>

          {showAdvanced && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800/50">
              {/* Cost Transparency */}
              <div className="text-xs space-y-1">
                <p className="text-gray-500 dark:text-gray-500 font-medium">Cost</p>
                <p className="text-gray-600 dark:text-gray-400">
                  ${currentModel.costPer1k}/1K tokens
                </p>
              </div>

              {/* Strengths */}
              <div className="text-xs space-y-2">
                <p className="text-gray-500 dark:text-gray-500 font-medium">Best for</p>
                <div className="flex flex-wrap gap-1">
                  {currentModel.strengths.map((strength) => (
                    <Badge
                      key={strength}
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Availability Status */}
              <div className="text-xs space-y-1 pt-1">
                <p className="text-gray-500 dark:text-gray-500 font-medium">Status</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {availableModels.length} model{availableModels.length > 1 ? 's' : ''} ready
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// React.memo with custom comparison to prevent unnecessary re-renders
// Only re-render if LLM context actually changes
export default React.memo(AIModelRouter);
