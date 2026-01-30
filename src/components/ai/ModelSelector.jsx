/**
 * ModelSelector - AI Model selection dropdown component
 * Allows users to select their preferred AI model and view model info
 * @ts-nocheck - Suppressing dropdown menu component type issues
 */

import React, { useState } from 'react';
import { useLLM, AI_MODELS } from '@/contexts/LLMContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Sparkles, 
  Check, 
  Zap, 
  Brain,
  Cpu,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const modelIcons = {
  chatgpt: Cpu,
  claude: Brain,
  gemini: Sparkles,
  grok: Zap,
  base44: Sparkles,
};

const modelColors = {
  chatgpt: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  gemini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  grok: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  base44: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export default function ModelSelector({ 
  compact = false,
  showInfo = true,
  className 
}) {
  const { 
    selectedModel, 
    setSelectedModel, 
    availableModels, 
    settings,
    updateSettings 
  } = useLLM();
  
  const [_showDetails, _setShowDetails] = useState(false);

  const currentModel = Object.values(AI_MODELS).find(m => m.id === selectedModel) || AI_MODELS.BASE44;
  const _Icon = modelIcons[selectedModel] || Sparkles;

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "gap-2 border dark:border-gray-700 dark:bg-gray-800/50",
              modelColors[selectedModel],
              className
            )}
          >
            <span className="text-lg">{currentModel.icon}</span>
            <span className="hidden sm:inline">{currentModel.name}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        {/* @ts-ignore - dropdown menu component prop compatibility */}
        <DropdownMenuContent align="end" className="w-64 dark:bg-gray-900 dark:border-gray-700">
          <DropdownMenuLabel className="dark:text-gray-200">
            Select AI Model
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="dark:bg-gray-700" />
          
          {Object.values(AI_MODELS).map((model) => {
            const isAvailable = availableModels.includes(model.id);
            const _ModelIcon = modelIcons[model.id];
            
            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => isAvailable && setSelectedModel(model.id)}
                disabled={!isAvailable}
                className={cn(
                  "flex items-center gap-3 cursor-pointer dark:hover:bg-gray-800",
                  !isAvailable && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="text-xl">{model.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-white">{model.name}</span>
                    {selectedModel === model.id && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {model.provider}
                  </span>
                </div>
                {!isAvailable && (
                  <Badge variant="outline" className="text-xs">
                    No API Key
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator className="dark:bg-gray-700" />
          
          <DropdownMenuItem 
            onClick={() => updateSettings({ autoRoute: !settings.autoRoute })}
            className="dark:hover:bg-gray-800"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            <span className="flex-1">Auto-route</span>
            <Badge variant={settings.autoRoute ? "default" : "outline"} className="text-xs">
              {settings.autoRoute ? 'On' : 'Off'}
            </Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full version with model info
  return (
    <div className={cn("space-y-3", className)}>
      {/* Model Selector */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "gap-3 h-12 px-4 border-2 dark:border-gray-700 dark:bg-gray-800/50",
                modelColors[selectedModel]
              )}
            >
              <span className="text-2xl">{currentModel.icon}</span>
              <div className="text-left">
                <div className="font-semibold dark:text-white">{currentModel.name}</div>
                <div className="text-xs opacity-70">{currentModel.provider}</div>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 dark:bg-gray-900 dark:border-gray-700">
            <DropdownMenuLabel className="dark:text-gray-200">
              Choose AI Model
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:bg-gray-700" />
            
            {Object.values(AI_MODELS).map((model) => {
              const isAvailable = availableModels.includes(model.id);
              
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => isAvailable && setSelectedModel(model.id)}
                  disabled={!isAvailable}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer dark:hover:bg-gray-800",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-2xl mt-0.5">{model.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold dark:text-white">{model.name}</span>
                      {selectedModel === model.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {model.description}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {model.strengths.map((strength) => (
                        <Badge 
                          key={strength} 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0 dark:border-gray-600"
                        >
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {!isAvailable && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Configure
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auto-route toggle */}
        <Button
          variant={settings.autoRoute ? "default" : "outline"}
          size="sm"
          onClick={() => updateSettings({ autoRoute: !settings.autoRoute })}
          className={cn(
            "gap-2",
            settings.autoRoute && "bg-gradient-to-r from-purple-500 to-blue-500"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Auto
        </Button>
      </div>

      {/* Model Info Panel */}
      {showInfo && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={cn(
              "rounded-lg p-3 border",
              "bg-gradient-to-br from-gray-50 to-gray-100/50",
              "dark:from-gray-800/50 dark:to-gray-900/50 dark:border-gray-700"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{currentModel.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold dark:text-white">{currentModel.name}</h4>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", modelColors[selectedModel])}
                  >
                    {currentModel.provider}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {currentModel.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentModel.strengths.map((strength) => (
                    <Badge 
                      key={strength} 
                      className={cn(
                        "text-xs",
                        modelColors[selectedModel]
                      )}
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
                {currentModel.costPer1k > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    ~${currentModel.costPer1k.toFixed(3)}/1K tokens
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
