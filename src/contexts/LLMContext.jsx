/**
 * LLM Context Provider
 * Provides app-wide AI model configuration, usage tracking, and preferences
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchJson } from '@/utils/api';
import { isFeatureEnabled } from '@/utils/featureFlags';

// Available AI Models
export const AI_MODELS = {
  CHATGPT: {
    id: 'chatgpt',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    icon: '🤖',
    color: 'emerald',
    description: 'Best for code generation & debugging',
    strengths: ['Code', 'Implementation', 'Debugging'],
    maxTokens: 4096,
    costPer1k: 0.01,
  },
  CLAUDE: {
    id: 'claude',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    icon: '🧠',
    color: 'purple',
    description: 'Best for reasoning & analysis',
    strengths: ['Reasoning', 'Analysis', 'Long-form'],
    maxTokens: 4096,
    costPer1k: 0.015,
  },
  GEMINI: {
    id: 'gemini',
    name: 'Gemini Pro',
    provider: 'Google',
    icon: '✨',
    color: 'blue',
    description: 'Best for multimodal & vision tasks',
    strengths: ['Vision', 'Multimodal', 'Research'],
    maxTokens: 4096,
    costPer1k: 0.0005,
  },
  GROK: {
    id: 'grok',
    name: 'Grok 2',
    provider: 'xAI',
    icon: '⚡',
    color: 'orange',
    description: 'Best for creative & experimental',
    strengths: ['Creative', 'Real-time', 'Conversational'],
    maxTokens: 4096,
    costPer1k: 0.005,
  },
  BASE44: {
    id: 'base44',
    name: 'Base44 LLM',
    provider: 'Base44',
    icon: '🔷',
    color: 'cyan',
    description: 'Built-in (always available)',
    strengths: ['Free', 'No API key needed', 'Fast'],
    maxTokens: 4096,
    costPer1k: 0,
  },
};

// Default context value
const defaultContext = {
  // Model state
  selectedModel: 'base44',
  availableModels: [],
  modelConfigs: {},
  
  // Usage tracking
  usage: {
    totalTokens: 0,
    totalCost: 0,
    queryCount: 0,
    modelBreakdown: {},
  },
  
  // Settings
  settings: {
    autoRoute: true,
    fallbackEnabled: true,
    streamingEnabled: true,
    saveHistory: true,
  },
  
  // Methods
  setSelectedModel: () => {},
  query: async () => {},
  updateSettings: () => {},
  resetUsage: () => {},
  getModelInfo: () => null,
};

const AI_ROUTER_TIMEOUT_MS = 15000;
const BASE44_TIMEOUT_MS = 20000;

const withTimeout = (promise, ms, message) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

const LLMContext = createContext(defaultContext);

export function LLMProvider({ children }) {
  // Model state
  const [selectedModel, setSelectedModel] = useState('base44');
  const [availableModels, setAvailableModels] = useState(['base44']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Usage tracking
  const [usage, setUsage] = useState({
    totalTokens: 0,
    totalCost: 0,
    queryCount: 0,
    modelBreakdown: {},
    history: [],
  });
  
  // Settings
  const [settings, setSettings] = useState({
    autoRoute: true,
    fallbackEnabled: true,
    streamingEnabled: false, // Streaming requires additional setup
    saveHistory: true,
    preferredModel: null,
  });

  // Load saved settings from backend on mount
  useEffect(() => {
    if (isFeatureEnabled('llmSettings')) {
      loadLLMSettings();
    }
    if (isFeatureEnabled('aiRouter')) {
      checkAvailableModels();
    }
  }, []);

  const loadLLMSettings = async () => {
    try {
      if (!isFeatureEnabled('llmSettings')) return;
      const data = await fetchJson('/api/user/llm-settings', {
        credentials: 'include'
      });
      if (data?.settings) setSettings(data.settings);
      if (data?.usage) setUsage(data.usage);
      if (data?.selectedModel) setSelectedModel(data.selectedModel);
      if (data) {
        localStorage.setItem('llm_settings_cache', JSON.stringify(data));
      }
    } catch (error) {
      const cached = localStorage.getItem('llm_settings_cache');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data?.settings) setSettings(data.settings);
          if (data?.usage) setUsage(data.usage);
          if (data?.selectedModel) setSelectedModel(data.selectedModel);
          return;
        } catch {
          // ignore cache parse errors
        }
      }
      console.warn('LLM settings backend unavailable, using defaults.');
    }
  };

  // Auto-save settings to backend when changed
  useEffect(() => {
    if (isFeatureEnabled('llmSettings')) {
      saveLLMSettings();
    }
  }, [settings, usage]);

  const saveLLMSettings = async () => {
    try {
      if (!isFeatureEnabled('llmSettings')) return;
      await fetchJson('/api/user/llm-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings, usage, selectedModel })
      });
    } catch (error) {
      localStorage.setItem(
        'llm_settings_cache',
        JSON.stringify({ settings, usage, selectedModel })
      );
    }
  };

  // Check which models are available based on API keys
  const checkAvailableModels = async () => {
    try {
      if (!isFeatureEnabled('aiRouter')) {
        setAvailableModels(['base44']);
        return;
      }
      const response = await withTimeout(fetch('/functions/aiModelRouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', prompt: 'test' }),
      }), AI_ROUTER_TIMEOUT_MS, 'AI router timed out');
      
      if (response.ok) {
        const data = await response.json();
        if (data.routing?.alternativeModels) {
          setAvailableModels(['base44', ...data.routing.alternativeModels]);
        }
      }
    } catch (e) {
      console.log('Using Base44 as default model');
      setAvailableModels(['base44']);
    }
  };

  // Analyze prompt to recommend best model
  const analyzePrompt = useCallback((prompt) => {
    const lower = prompt.toLowerCase();
    
    // Code-related patterns
    if (/\b(code|function|implement|debug|fix|program|script|api|endpoint)\b/.test(lower)) {
      return { model: 'chatgpt', confidence: 0.9, reason: 'Code-related task detected' };
    }
    
    // Analysis/reasoning patterns
    if (/\b(analyze|explain|reason|compare|evaluate|assess|review)\b/.test(lower)) {
      return { model: 'claude', confidence: 0.85, reason: 'Analysis/reasoning task detected' };
    }
    
    // Image/vision patterns
    if (/\b(image|picture|photo|visual|see|look|diagram)\b/.test(lower)) {
      return { model: 'gemini', confidence: 0.9, reason: 'Vision/multimodal task detected' };
    }
    
    // Creative patterns
    if (/\b(creative|story|write|generate|brainstorm|idea)\b/.test(lower)) {
      return { model: 'grok', confidence: 0.75, reason: 'Creative task detected' };
    }
    
    // Default
    return { model: 'base44', confidence: 0.5, reason: 'General query - using default' };
  }, []);

  // Main query function
  const query = useCallback(async (prompt, options = {}) => {
    const {
      model: forceModel,
      enableAutoRoute = settings.autoRoute,
      stream = settings.streamingEnabled,
      jsonSchema = null,
      systemPrompt = null,
      temperature = 0.7,
    } = options;

    setIsLoading(true);
    setError(null);
    
    const startTime = Date.now();
    let usedModel = forceModel || selectedModel;
    let routing = null;

    try {
      // Auto-route if enabled and no model forced
      if (enableAutoRoute && !forceModel) {
        routing = analyzePrompt(prompt);
        if (routing.confidence > 0.7 && availableModels.includes(routing.model)) {
          usedModel = routing.model;
        }
      }

      // Try AI Router first if model is not base44
      if (usedModel !== 'base44' && availableModels.includes(usedModel)) {
        try {
          const response = await withTimeout(fetch('/functions/aiModelRouter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'query',
              prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
              model: usedModel,
              config: {
                enableAutoRouting: enableAutoRoute,
                fallbackToBase44: settings.fallbackEnabled,
                retryOnFailure: true,
              },
            }),
          }), AI_ROUTER_TIMEOUT_MS, 'AI router timed out');

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Track usage
              const tokenCount = data.usage?.totalTokens || estimateTokens(prompt + data.response);
              const cost = calculateCost(usedModel, tokenCount);
              
              trackUsage(usedModel, tokenCount, cost, Date.now() - startTime);
              
              setIsLoading(false);
              return {
                success: true,
                response: data.response,
                model: data.model || usedModel,
                routing: data.routing || routing,
                usage: data.usage,
              };
            }
          }
        } catch (routerError) {
          console.warn('AI Router failed, falling back to Base44:', routerError);
        }
      }

      // Fallback to Base44 - using Core integration with optional chaining
      // @ts-ignore - base44.integrations may not be fully typed
      const base44Promise = base44?.integrations?.Core?.InvokeLLM?.({
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        response_json_schema: jsonSchema,
        add_context_from_internet: prompt.toLowerCase().includes('latest') || prompt.toLowerCase().includes('current'),
      });
      const response = await withTimeout(
        base44Promise,
        BASE44_TIMEOUT_MS,
        'Base44 LLM request timed out'
      );

      // Handle response (could be string or object)
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      const tokenCount = estimateTokens(prompt + responseText);
      
      trackUsage('base44', tokenCount, 0, Date.now() - startTime);
      
      setIsLoading(false);
      return {
        success: true,
        response: responseText,
        model: 'base44',
        routing,
        parsedResponse: typeof response === 'object' ? response : null,
      };

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return {
        success: false,
        error: err.message,
        model: usedModel,
      };
    }
  }, [selectedModel, availableModels, settings, analyzePrompt]);

  // Track usage statistics
  const trackUsage = useCallback((model, tokens, cost, responseTime) => {
    setUsage(prev => {
      const modelStats = prev.modelBreakdown[model] || { tokens: 0, cost: 0, queries: 0 };
      
      const historyEntry = {
        timestamp: new Date().toISOString(),
        model,
        tokens,
        cost,
        responseTime,
      };

      return {
        totalTokens: prev.totalTokens + tokens,
        totalCost: prev.totalCost + cost,
        queryCount: prev.queryCount + 1,
        modelBreakdown: {
          ...prev.modelBreakdown,
          [model]: {
            tokens: modelStats.tokens + tokens,
            cost: modelStats.cost + cost,
            queries: modelStats.queries + 1,
          },
        },
        history: settings.saveHistory 
          ? [...prev.history.slice(-99), historyEntry]
          : prev.history,
      };
    });
  }, [settings.saveHistory]);

  // Estimate token count (rough approximation)
  const estimateTokens = (text) => {
    return Math.ceil(text.length / 4);
  };

  // Calculate cost based on model and tokens
  const calculateCost = (model, tokens) => {
    const modelInfo = Object.values(AI_MODELS).find(m => m.id === model);
    return modelInfo ? (tokens / 1000) * modelInfo.costPer1k : 0;
  };

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Reset usage statistics
  const resetUsage = useCallback(() => {
    setUsage({
      totalTokens: 0,
      totalCost: 0,
      queryCount: 0,
      modelBreakdown: {},
      history: [],
    });
    // Clear usage on backend (no await needed, fire and forget)
    fetch('/api/user/llm-usage', { method: 'DELETE', credentials: 'include' });
  }, []);

  // Get model info
  const getModelInfo = useCallback((modelId) => {
    return Object.values(AI_MODELS).find(m => m.id === modelId) || null;
  }, []);

  const value = {
    // State
    selectedModel,
    availableModels,
    isLoading,
    error,
    usage,
    settings,
    
    // Methods
    setSelectedModel,
    query,
    updateSettings,
    resetUsage,
    getModelInfo,
    analyzePrompt,
    checkAvailableModels,
    
    // Constants
    AI_MODELS,
  };

  return (
    // @ts-ignore - context value type mismatch due to optional properties
    <LLMContext.Provider value={value}>
      {children}
    </LLMContext.Provider>
  );
}

// Hook to use LLM context
export function useLLM() {
  const context = useContext(LLMContext);
  if (!context) {
    throw new Error('useLLM must be used within a LLMProvider');
  }
  return context;
}

export default LLMContext;
