import React, { useState, useEffect } from 'react';
import { useLLM, AI_MODELS } from '@/contexts/LLMContext';
import {
  Check,
  ChevronDown,
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
    <div className="space-y-2">
      {/* Model Selector */}
      <TooltipProvider>
        <RadixTooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Model</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {currentModel.name}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="text-xs whitespace-nowrap ml-2"
              >
                {currentModel.provider}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-xs">
            <p className="font-medium">{currentModel.name}</p>
            <p className="text-gray-300">{currentModel.description}</p>
            <p className="text-gray-400 mt-1">
              Cost: ${currentModel.costPer1k}/1K tokens
            </p>
          </TooltipContent>
        </RadixTooltip>
      </TooltipProvider>

      {/* Model Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-8 text-xs"
          >
            <span className="truncate">Switch Model</span>
            <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            AVAILABLE MODELS
          </div>
          {modelsList.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className="flex items-start gap-3 px-3 py-2 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
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
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-tight">
                  {model.description}
                </p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {model.strengths.map((strength) => (
                    <Badge
                      key={strength}
                      variant="secondary"
                      className="text-xs px-1.5 py-0"
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
              {displayModel === model.id && (
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Status */}
      {availableModels && availableModels.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400 px-3 py-1">
          {availableModels.length} model{availableModels.length > 1 ? 's' : ''} ready
        </div>
      )}
    </div>
  );
}
