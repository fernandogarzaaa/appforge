/**
 * useAIRouter - React hook for intelligent AI model selection and querying
 * 
 * Usage:
 * const { query, isLoading, error, selectedModel, routing } = useAIRouter();
 * 
 * // Auto-route
 * const response = await query('Write a function that...', { enableAutoRouting: true });
 * 
 * // Manual selection
 * const response = await query('Analyze this...', { model: 'claude' });
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export enum AIModel {
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  GROK = 'grok',
  BASE44 = 'base44',
}

export interface AIRouterConfig {
  model?: AIModel | string;
  enableAutoRouting?: boolean;
  fallbackToBase44?: boolean;
  retryOnFailure?: boolean;
}

export interface RoutingInfo {
  selectedModel: string;
  confidence: number;
  reason: string;
  alternatives: string[];
}

export interface AIRouterResponse {
  success: boolean;
  model: string;
  response: string;
  routing?: RoutingInfo;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

export function useAIRouter() {
  const [selectedModel, setSelectedModel] = useState<string>('base44');
  const [routing, setRouting] = useState<RoutingInfo | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async (params: {
      prompt: string;
      action?: 'query' | 'route' | 'analyze';
      config?: AIRouterConfig;
    }) => {
      const { prompt, action = 'query', config = {} } = params;
      setLastQuery(prompt);

      const response = await fetch('/functions/aiModelRouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prompt,
          model: config.model,
          config: {
            enableAutoRouting: config.enableAutoRouting !== false,
            fallbackToBase44: config.fallbackToBase44 !== false,
            retryOnFailure: config.retryOnFailure !== false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to call AI router: ${response.statusText}`);
      }

      const data = (await response.json()) as AIRouterResponse;

      if (!data.success) {
        throw new Error(data.error || 'AI router returned an error');
      }

      // Update state
      setSelectedModel(data.model);
      if (data.routing) {
        setRouting(data.routing);
      }

      return data;
    },
  });

  return {
    // Methods
    query: (prompt: string, config?: AIRouterConfig) =>
      mutation.mutateAsync({ prompt, action: 'query', config }),
    route: (prompt: string) =>
      mutation.mutateAsync({ prompt, action: 'route' }),
    analyze: (prompt: string) =>
      mutation.mutateAsync({ prompt, action: 'analyze' }),

    // State
    isLoading: mutation.isPending,
    error: mutation.error,
    selectedModel,
    routing,
    lastQuery,

    // Mutation state
    data: mutation.data,
    status: mutation.status,

    // Reset
    reset: () => {
      mutation.reset();
      setSelectedModel('base44');
      setRouting(null);
      setLastQuery('');
    },
  };
}

/**
 * Hook to get routing recommendation without executing query
 */
export function useAIRouting() {
  const [routing, setRouting] = useState<RoutingInfo | null>(null);

  const mutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch('/functions/aiModelRouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          prompt,
        }),
      });

      const data = (await response.json()) as AIRouterResponse;
      setRouting(data.routing || null);
      return data;
    },
  });

  return {
    analyzePrompt: (prompt: string) => mutation.mutateAsync(prompt),
    routing,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to track AI model usage and statistics
 */
export function useAIModelStats() {
  const [stats, setStats] = useState({
    chatgpt: 0,
    claude: 0,
    gemini: 0,
    grok: 0,
    base44: 0,
    totalQueries: 0,
    totalTokens: 0,
  });

  const recordUsage = (model: string, tokens: number = 0) => {
    setStats((prev) => ({
      ...prev,
      [model.toLowerCase()]: (prev[model.toLowerCase() as keyof typeof prev] || 0) + 1,
      totalQueries: prev.totalQueries + 1,
      totalTokens: prev.totalTokens + tokens,
    }));
  };

  const resetStats = () => {
    setStats({
      chatgpt: 0,
      claude: 0,
      gemini: 0,
      grok: 0,
      base44: 0,
      totalQueries: 0,
      totalTokens: 0,
    });
  };

  const getModelDistribution = () => {
    const total = stats.totalQueries || 1;
    return {
      chatgpt: ((stats.chatgpt / total) * 100).toFixed(1) + '%',
      claude: ((stats.claude / total) * 100).toFixed(1) + '%',
      gemini: ((stats.gemini / total) * 100).toFixed(1) + '%',
      grok: ((stats.grok / total) * 100).toFixed(1) + '%',
      base44: ((stats.base44 / total) * 100).toFixed(1) + '%',
    };
  };

  return {
    stats,
    recordUsage,
    resetStats,
    getModelDistribution,
  };
}
