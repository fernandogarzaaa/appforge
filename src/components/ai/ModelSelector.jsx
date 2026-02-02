// @ts-nocheck
/**
 * ModelSelector - AI Model selection dropdown component
 * Allows users to select their preferred AI model and view model info
 * Enhanced with Quantum Core optimization for model recommendations
 */

import React, { useState, useEffect } from 'react';
import { useLLM, AI_MODELS } from '@/contexts/LLMContext';
import { isQuantumAvailable } from '@/lib/quantumIntegration';
import { 
  executeSecurityAnalysis, 
  executeStabilityMonitoring, 
  detectCriticality 
} from '@/lib/aiRouter';
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
  Settings2,
  Shield,
  Activity,
  AlertTriangle
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
  const [quantumOptimized, setQuantumOptimized] = useState(false);
  const [quantumMetrics, setQuantumMetrics] = useState({
    security: null,
    stability: null,
    criticality: null
  });
  
  // Check if quantum core is available for optimization
  useEffect(() => {
    setQuantumOptimized(isQuantumAvailable());
    
    // Run quantum analysis on mount
    if (isQuantumAvailable()) {
      analyzeWithQuantum();
    }
  }, []);

  const analyzeWithQuantum = async () => {
    try {
      // Security analysis
      const secAnalysis = await executeSecurityAnalysis({
        name: 'API Gateway',
        barrier: 0.8,
        estimatedAttackLevel: 0.3
      });
      
      // Stability monitoring
      const stabAnalysis = await executeStabilityMonitoring(5.0, 3600.0);
      
      // Criticality detection
      const critAnalysis = await detectCriticality([10, 15, 12, 18, 20, 22, 25]);
      
      setQuantumMetrics({
        security: secAnalysis,
        stability: stabAnalysis,
        criticality: critAnalysis
      });
    } catch (error) {
      console.error('Quantum analysis error:', error);
    }
  };

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
            {quantumOptimized && (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 rounded">⚛️</span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        {/* @ts-ignore - dropdown menu component prop compatibility */}
        <DropdownMenuContent align="end" className="w-64 dark:bg-gray-900 dark:border-gray-700">
          <DropdownMenuLabel className="dark:text-gray-200">
            Select AI Model {quantumOptimized && '(Quantum Optimized)'}
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
                  {quantumOptimized && (
                    <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                      ⚛️ Quantum
                    </Badge>
                  )}
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

            {/* Quantum Metrics Section */}
            {quantumOptimized && quantumMetrics.security && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-2">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Quantum Analysis</h5>
                <div className="grid grid-cols-3 gap-2">
                  {/* Security */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-900/20 dark:to-blue-800/10 rounded p-2 border border-blue-500/20 dark:border-blue-500/30">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span className="text-xs font-semibold text-blue-400">Security</span>
                    </div>
                    <div className="text-sm font-bold text-blue-300">
                      {(quantumMetrics.security.breachProbability * 100).toFixed(2)}%
                    </div>
                    <Badge className="text-xs mt-1 bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {quantumMetrics.security.riskLevel}
                    </Badge>
                  </div>

                  {/* Stability */}
                  {quantumMetrics.stability && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-900/20 dark:to-purple-800/10 rounded p-2 border border-purple-500/20 dark:border-purple-500/30">
                      <div className="flex items-center gap-1 mb-1">
                        <Zap className="h-3 w-3 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-400">Stability</span>
                      </div>
                      <div className="text-sm font-bold text-purple-300">
                        {(quantumMetrics.stability.stability * 100).toFixed(1)}%
                      </div>
                      <Badge className="text-xs mt-1 bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {quantumMetrics.stability.status}
                      </Badge>
                    </div>
                  )}

                  {/* Criticality */}
                  {quantumMetrics.criticality && (
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-900/20 dark:to-orange-800/10 rounded p-2 border border-orange-500/20 dark:border-orange-500/30">
                      <div className="flex items-center gap-1 mb-1">
                        <Activity className="h-3 w-3 text-orange-400" />
                        <span className="text-xs font-semibold text-orange-400">System</span>
                      </div>
                      <div className="text-sm font-bold text-orange-300">
                        {(quantumMetrics.criticality.criticality * 100).toFixed(1)}%
                      </div>
                      <Badge className="text-xs mt-1 bg-orange-500/20 text-orange-300 border-orange-500/30">
                        {quantumMetrics.criticality.systemHealth.includes('🟢') ? 'Healthy' : 'At Risk'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
