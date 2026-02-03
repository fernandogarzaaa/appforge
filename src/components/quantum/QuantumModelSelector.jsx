/**
 * Quantum Model Selector Component
 * 
 * Demonstrates the Quantum Annealer for AI model selection
 * Shows energy scores, comparisons, and recommendations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuantumModelSelector } from '@/hooks/useQuantumModelSelector';
import { TaskComplexity, SelectionStrategy } from '@/lib/aiRouter';

const complexityDescriptions = {
  [TaskComplexity.LOW]: 'Simple tasks like summarization and classification',
  [TaskComplexity.MEDIUM]: 'Moderate tasks like translation and Q&A',
  [TaskComplexity.HIGH]: 'Complex tasks like reasoning and code generation',
  [TaskComplexity.VERY_HIGH]: 'Advanced tasks like research and strategy',
};

const strategyDescriptions = {
  [SelectionStrategy.OPTIMAL]: 'Best balance of cost, speed, and quality',
  [SelectionStrategy.COST_FOCUSED]: 'Minimize cost (70% weight)',
  [SelectionStrategy.SPEED_FOCUSED]: 'Minimize latency (70% weight)',
  [SelectionStrategy.QUALITY_FOCUSED]: 'Maximize quality (70% weight)',
};

export default function QuantumModelSelector() {
  const {
    selectModel,
    compareModels,
    getRecommendation,
    selectedModel,
    loading,
    error,
    recommendations,
    lastComplexity,
  } = useQuantumModelSelector();

  const [selectedComplexity, setSelectedComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);
  const [selectedStrategy, setSelectedStrategy] = useState<SelectionStrategy>(SelectionStrategy.OPTIMAL);
  const [activeTab, setActiveTab] = useState('select');

  const handleSelectModel = async () => {
    await selectModel(selectedComplexity, selectedStrategy);
  };

  const handleCompare = async () => {
    await compareModels(selectedComplexity);
    setActiveTab('compare');
  };

  const handleGetRecommendation = async () => {
    await getRecommendation(selectedComplexity);
    setActiveTab('recommendation');
  };

  const getModelColor = (modelName) => {
    switch (modelName) {
      case 'GPT-4':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      case 'Claude-3-Opus':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'Gemini-Pro':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'Grok-1':
        return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
      case 'Base44':
        return 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getEnergyColor = (energy) => {
    if (energy < 0.3) return 'text-green-600 dark:text-green-400';
    if (energy < 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Quantum Model Selector</CardTitle>
              <CardDescription>
                Intelligently select AI models using quantum annealing optimization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Complexity Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Complexity
              </label>
              <Select value={selectedComplexity} onValueChange={(v) => setSelectedComplexity(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskComplexity).map((complexity) => (
                    <SelectItem key={complexity} value={complexity}>
                      {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {complexityDescriptions[selectedComplexity]}
              </p>
            </div>

            {/* Strategy Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selection Strategy
              </label>
              <Select value={selectedStrategy} onValueChange={(v) => setSelectedStrategy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SelectionStrategy).map((strategy) => (
                    <SelectItem key={strategy} value={strategy}>
                      {strategy
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {strategyDescriptions[selectedStrategy]}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button onClick={handleSelectModel} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              ⚛️ Select Model
            </Button>
            <Button onClick={handleCompare} disabled={loading} variant="outline" className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              📊 Compare Models
            </Button>
            <Button onClick={handleGetRecommendation} disabled={loading} variant="outline" className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              💡 Get Recommendation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-200">Error</h4>
              <p className="text-sm text-red-800 dark:text-red-300">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      {selectedModel && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select">Selected Model</TabsTrigger>
            <TabsTrigger value="compare">Model Comparison</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          </TabsList>

          {/* Selected Model Tab */}
          <TabsContent value="select" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Selected Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Badge */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-2">
                    <Badge className={cn('text-base px-3 py-1', getModelColor(selectedModel.modelName))}>
                      {selectedModel.modelName}
                    </Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Model ID: <code className="font-mono">{selectedModel.model}</code>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedModel.index + 1}/5
                    </p>
                    <p className="text-xs text-gray-500">Rank</p>
                  </div>
                </div>

                {/* Metrics */}
                {selectedModel.metrics && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Cost</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {(selectedModel.metrics.cost * 100).toFixed(0)}%
                      </p>
                      <Progress value={selectedModel.metrics.cost * 100} className="mt-2 h-1" />
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Latency</p>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {(selectedModel.metrics.latency * 100).toFixed(0)}%
                      </p>
                      <Progress value={selectedModel.metrics.latency * 100} className="mt-2 h-1" />
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Quality</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {(selectedModel.metrics.quality * 100).toFixed(0)}%
                      </p>
                      <Progress value={selectedModel.metrics.quality * 100} className="mt-2 h-1" />
                    </div>
                  </div>
                )}

                {/* Quantum Metadata */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Complexity</p>
                    <p className="font-semibold text-purple-700 dark:text-purple-300">
                      {selectedModel.complexity?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Strategy</p>
                    <p className="font-semibold text-purple-700 dark:text-purple-300">
                      {selectedModel.strategy?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Temperature</p>
                    <p className="font-semibold text-purple-700 dark:text-purple-300">
                      {selectedModel.temperature?.toFixed(3)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Frozen</p>
                    <p className="font-semibold text-purple-700 dark:text-purple-300">
                      {selectedModel.isFrozen ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Comparison Tab */}
          <TabsContent value="compare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Energy Scores</CardTitle>
                <CardDescription>Lower energy = Better selection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.length > 0 ? (
                    recommendations.map((model, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge className={cn('mb-2', getModelColor(model.modelName))}>
                              {model.modelName}
                            </Badge>
                            <p className="text-xs text-gray-500">Rank #{model.rank}</p>
                          </div>
                          <div className={cn('text-2xl font-bold', getEnergyColor(model.energy))}>
                            {model.energy.toFixed(3)}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Cost</p>
                            <p className="font-semibold">{(model.metrics.cost * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Latency</p>
                            <p className="font-semibold">{(model.metrics.latency * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Quality</p>
                            <p className="font-semibold">{(model.metrics.quality * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                      Click "Compare Models" to see energy scores
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendation Tab */}
          <TabsContent value="recommendation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI System Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                    Based on the quantum annealing analysis of your task complexity and requirements,
                    the system recommends <strong>{selectedModel.modelName}</strong> as the optimal
                    model choice. This selection was calculated by minimizing the energy function that
                    balances cost, latency, and quality factors.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
