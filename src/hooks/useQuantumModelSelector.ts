/**
 * useQuantumModelSelector - React hook for quantum-optimized model selection
 * 
 * Provides easy access to the Quantum Annealer for selecting AI models
 * based on task complexity, cost, speed, and quality requirements
 */

import { useCallback, useState, useEffect } from 'react';
import {
  selectOptimalModel,
  selectModelsForTasks,
  compareModelsForTask,
  getRecommendation,
  TaskComplexity,
  SelectionStrategy,
} from '@/lib/aiRouter';

export interface ModelSelectionResult {
  model: string;
  modelName: string;
  index: number;
  complexity?: TaskComplexity;
  strategy?: SelectionStrategy;
  metrics?: {
    cost: number;
    latency: number;
    quality: number;
  };
  temperature?: number;
  isFrozen?: boolean;
  quantumOptimized?: boolean;
  timestamp?: string;
  error?: string;
  fallback?: boolean;
}

export interface UseQuantumModelSelectorReturn {
  // Selection
  selectModel: (complexity: TaskComplexity, strategy?: SelectionStrategy) => Promise<ModelSelectionResult>;
  selectBatch: (tasks: TaskComplexity[], strategy?: SelectionStrategy) => Promise<ModelSelectionResult[]>;

  // Comparison
  compareModels: (complexity: TaskComplexity) => Promise<any[]>;
  getRecommendation: (complexity: TaskComplexity) => Promise<any>;

  // State
  selectedModel: ModelSelectionResult | null;
  loading: boolean;
  error: Error | null;
  recommendations: any[];

  // Metadata
  lastComplexity: TaskComplexity | null;
  lastStrategy: SelectionStrategy | null;
}

export const useQuantumModelSelector = (): UseQuantumModelSelectorReturn => {
  const [selectedModel, setSelectedModel] = useState<ModelSelectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [lastComplexity, setLastComplexity] = useState<TaskComplexity | null>(null);
  const [lastStrategy, setLastStrategy] = useState<SelectionStrategy | null>(null);

  // Select optimal model
  const selectModel = useCallback(
    async (complexity: TaskComplexity, strategy: SelectionStrategy = SelectionStrategy.OPTIMAL) => {
      try {
        setLoading(true);
        setError(null);
        setLastComplexity(complexity);
        setLastStrategy(strategy);

        const result = await selectOptimalModel(complexity, strategy);
        setSelectedModel(result as ModelSelectionResult);

        return result as ModelSelectionResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Model selection error:', error);
        return {
          model: 'base44',
          modelName: 'Base44',
          index: 4,
          error: error.message,
          fallback: true,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Batch select models
  const selectBatch = useCallback(
    async (tasks: TaskComplexity[], strategy: SelectionStrategy = SelectionStrategy.OPTIMAL) => {
      try {
        setLoading(true);
        setError(null);

        const results = await selectModelsForTasks(tasks, strategy);
        if (results.length > 0) {
          setSelectedModel(results[0] as ModelSelectionResult);
        }

        return results as ModelSelectionResult[];
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Batch selection error:', error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Compare models
  const compareModels = useCallback(async (complexity: TaskComplexity) => {
    try {
      setLoading(true);
      setError(null);

      const comparisons = await compareModelsForTask(complexity);
      setRecommendations(comparisons);

      return comparisons;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Model comparison error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get recommendation
  const getRecommendationData = useCallback(async (complexity: TaskComplexity) => {
    try {
      setLoading(true);
      setError(null);

      const recommendation = await getRecommendation(complexity);
      setRecommendations(recommendation.comparisons || []);
      setSelectedModel(recommendation.recommendation as ModelSelectionResult);

      return recommendation;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Recommendation error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    selectModel,
    selectBatch,
    compareModels,
    getRecommendation: getRecommendationData,
    selectedModel,
    loading,
    error,
    recommendations,
    lastComplexity,
    lastStrategy,
  };
};

export default useQuantumModelSelector;
