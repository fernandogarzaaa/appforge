import React, { useState, useEffect } from 'react';
import { useLLM, AI_MODELS } from '@/contexts/LLMContext';
import {
  Check,
  ChevronDown,
  MoreHorizontal,
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

export default function AIModelRouter() {
  const { selectedModel, availableModels, updateSettings, settings } = useLLM();
  const [displayModel, setDisplayModel] = useState(selectedModel || 'base44');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setDisplayModel(selectedModel || 'base44');
  }, [selectedModel]);

  const currentModel = AI_MODELS[Object.keys(AI_MODELS).find(
    (key) => AI_MODELS[key].id === displayModel
  )] || AI_MODELS.BASE44;

  const handleModelSelect = (modelId) => {
    setDisplayModel(modelId);
    updateSettings({ selectedModel: modelId });
  };

  const modelsList = Object.values(AI_MODELS);

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

      {/* Model Switcher Button */}
      <DropdownMenu>
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
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            AVAILABLE MODELS
          </div>
          {modelsList.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
            >
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{model.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </p>
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
