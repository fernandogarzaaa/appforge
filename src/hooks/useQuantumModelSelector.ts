/**
 * useQuantumModelSelector - React hook for quantum-optimized model selection
 * 
 * Provides easy access to the Quantum Annealer for selecting AI models
 * based on task complexity, cost, speed, and quality requirements
 */

import React, { useCallback, useState, useEffect, useReducer, useMemo } from 'react';
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

interface SelectionState {
  selectedModel: ModelSelectionResult | null;
  loading: boolean;
  error: Error | null;
  recommendations: any[];
  lastComplexity: TaskComplexity | null;
  lastStrategy: SelectionStrategy | null;
}

type SelectionAction =
  | { type: 'START' }
  | { type: 'ERROR'; error: Error }
  | { type: 'SET_MODEL'; result: ModelSelectionResult; complexity?: TaskComplexity; strategy?: SelectionStrategy }
  | { type: 'SET_BATCH'; results: ModelSelectionResult[] }
  | { type: 'SET_RECOMMENDATIONS'; data: any[] };

const initialState: SelectionState = {
  selectedModel: null,
  loading: false,
  error: null,
  recommendations: [],
  lastComplexity: null,
  lastStrategy: null,
};

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'START': return { ...state, loading: true, error: null };
    case 'ERROR': return { ...state, loading: false, error: action.error };
    case 'SET_MODEL': return { ...state, loading: false, selectedModel: action.result, lastComplexity: action.complexity || state.lastComplexity, lastStrategy: action.strategy || state.lastStrategy };
    case 'SET_BATCH': return { ...state, loading: false, selectedModel: action.results[0] || null };
    case 'SET_RECOMMENDATIONS': return { ...state, loading: false, recommendations: action.data };
    default: return state;
  }
}

export const useQuantumModelSelector = (): UseQuantumModelSelectorReturn => {
  const [state, dispatch] = useReducer(selectionReducer, initialState);

  const wrapAction = async <T>(fn: () => Promise<T>, onSuccess: (data: T) => void, fallback?: T) => {
    dispatch({ type: 'START' });
    try {
      const result = await fn();
      onSuccess(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Action failed');
      dispatch({ type: 'ERROR', error });
      return fallback as T;
    }
  };

  const selectModel = useCallback((complexity: TaskComplexity, strategy: SelectionStrategy = SelectionStrategy.OPTIMAL) =>
    wrapAction(
      () => selectOptimalModel(complexity, strategy) as Promise<ModelSelectionResult>,
      (result) => dispatch({ type: 'SET_MODEL', result, complexity, strategy }),
      { model: 'base44', modelName: 'Base44', index: 4, fallback: true } as ModelSelectionResult
    ), []);

  const selectBatch = useCallback((tasks: TaskComplexity[], strategy: SelectionStrategy = SelectionStrategy.OPTIMAL) =>
    wrapAction(
      () => selectModelsForTasks(tasks, strategy) as Promise<ModelSelectionResult[]>,
      (results) => dispatch({ type: 'SET_BATCH', results }),
      []
    ), []);

  const compareModels = useCallback((complexity: TaskComplexity) =>
    wrapAction(
      () => compareModelsForTask(complexity),
      (data) => dispatch({ type: 'SET_RECOMMENDATIONS', data }),
      []
    ), []);

  const getRecommendationData = useCallback((complexity: TaskComplexity) =>
    wrapAction(
      () => getRecommendation(complexity),
      (rec) => {
        const recommendation: any = rec?.recommendation ?? {};
        dispatch({ type: 'SET_RECOMMENDATIONS', data: rec?.comparisons || [] });
        dispatch({
          type: 'SET_MODEL',
          result: {
            model: recommendation.model || 'base44',
            modelName: recommendation.modelName || 'Base44',
            index: recommendation.index ?? 4,
            complexity,
            strategy: recommendation.strategy ?? SelectionStrategy.OPTIMAL,
            metrics: recommendation.metrics ?? { cost: 0, latency: 0, quality: 0 },
            temperature: recommendation.temperature ?? null,
            isFrozen: recommendation.isFrozen ?? null,
            quantumOptimized: recommendation.quantumOptimized ?? true,
            timestamp: recommendation.timestamp ?? new Date().toISOString(),
          }
        });
      },
      null
    ), []);

  return {
    ...state,
    selectModel,
    selectBatch,
    compareModels,
    getRecommendation: getRecommendationData,
  };
};

export default useQuantumModelSelector;
