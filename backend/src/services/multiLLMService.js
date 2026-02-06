/**
 * Multi-LLM Service
 * Supports OpenAI, Claude, Gemini, Grok with real API implementations
 */

import { createError } from '../utils/helpers.js';
import logger from '../config/logger.js';

class MultiLLMService {
  constructor() {
    // API Keys
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.grokKey = process.env.GROK_API_KEY;

    this.providerOrder = this.parseProviderOrder(
      process.env.LLM_PROVIDER_ORDER || process.env.LLM_PROVIDERS
    );
    this.providerHealth = {};
    this.failureCounts = {};
    this.healthCooldownMs = Number(process.env.LLM_HEALTH_COOLDOWN_MS) || 120000;

    // API Endpoints
    this.endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
      grok: 'https://api.x.ai/v1/chat/completions', // X.AI endpoint
    };

    // Model mappings
    this.modelMappings = {
      'chatgpt': { provider: 'openai', model: 'gpt-4' },
      'gpt-4': { provider: 'openai', model: 'gpt-4' },
      'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-turbo-preview' },
      'gpt-3.5-turbo': { provider: 'openai', model: 'gpt-3.5-turbo' },
      'claude': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      'claude-3-opus': { provider: 'anthropic', model: 'claude-3-opus-20240229' },
      'claude-3-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      'claude-3-haiku': { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
      'gemini': { provider: 'gemini', model: 'gemini-pro' },
      'gemini-pro': { provider: 'gemini', model: 'gemini-pro' },
      'gemini-ultra': { provider: 'gemini', model: 'gemini-1.5-pro-latest' },
      'grok': { provider: 'grok', model: 'grok-beta' },
      'grok-2': { provider: 'grok', model: 'grok-beta' },
      'base44': { provider: 'openai', model: 'gpt-3.5-turbo' }, // Fallback
    };

    this.logConfigStatus();
  }

  parseProviderOrder(raw) {
    if (!raw) {
      return ['openai', 'anthropic', 'gemini', 'grok'];
    }

    return raw
      .split(',')
      .map((provider) => provider.trim().toLowerCase())
      .filter(Boolean);
  }

  logConfigStatus() {
    logger.info('[MultiLLMService] Configuration Status:');
    logger.info(`  - OpenAI: ${this.openaiKey ? '✓ Configured' : '✗ Missing'}`);
    logger.info(`  - Anthropic (Claude): ${this.anthropicKey ? '✓ Configured' : '✗ Missing'}`);
    logger.info(`  - Google (Gemini): ${this.geminiKey ? '✓ Configured' : '✗ Missing'}`);
    logger.info(`  - X.AI (Grok): ${this.grokKey ? '✓ Configured' : '✗ Missing'}`);
  }

  isProviderEnabled(provider) {
    switch (provider) {
      case 'openai':
        return Boolean(this.openaiKey);
      case 'anthropic':
        return Boolean(this.anthropicKey);
      case 'gemini':
        return Boolean(this.geminiKey);
      case 'grok':
        return Boolean(this.grokKey);
      default:
        return false;
    }
  }

  isProviderHealthy(provider) {
    const status = this.providerHealth[provider];
    if (!status) {
      return true;
    }

    if (status.healthy) {
      return true;
    }

    return Date.now() - status.lastFailureAt > this.healthCooldownMs;
  }

  markProviderFailure(provider, error) {
    const current = this.failureCounts[provider] || 0;
    this.failureCounts[provider] = current + 1;
    this.providerHealth[provider] = {
      healthy: false,
      lastFailureAt: Date.now(),
      lastError: error?.message || String(error),
    };
  }

  markProviderSuccess(provider) {
    this.failureCounts[provider] = 0;
    this.providerHealth[provider] = {
      healthy: true,
      lastFailureAt: null,
      lastError: null,
    };
  }

  getProviderDefaults(provider) {
    switch (provider) {
      case 'openai':
        return { provider: 'openai', model: 'gpt-4' };
      case 'anthropic':
        return { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' };
      case 'gemini':
        return { provider: 'gemini', model: 'gemini-pro' };
      case 'grok':
        return { provider: 'grok', model: 'grok-beta' };
      default:
        return null;
    }
  }

  resolveModel(modelId, options = {}) {
    const mapping = this.modelMappings[modelId];
    if (mapping && this.isProviderEnabled(mapping.provider) && this.isProviderHealthy(mapping.provider)) {
      return mapping;
    }

    const fallbackProviders = (options.fallbackProviders || this.providerOrder)
      .map((provider) => provider.toLowerCase());

    for (const provider of fallbackProviders) {
      if (!this.isProviderEnabled(provider) || !this.isProviderHealthy(provider)) {
        continue;
      }

      const fallback = this.getProviderDefaults(provider);
      if (fallback) {
        return fallback;
      }
    }

    return null;
  }

  /**
   * Call LLM with automatic provider routing
   */
  async callLLM(modelId, prompt, options = {}) {
    const mapping = this.modelMappings[modelId];
    if (!mapping) {
      throw createError(400, `Unknown model: ${modelId}`);
    }

    const resolved = this.resolveModel(modelId, options);
    if (!resolved) {
      throw createError(503, 'No LLM providers are configured or healthy');
    }

    const { provider, model } = resolved;
    logger.info(`[MultiLLMService] Routing ${modelId} → ${provider}/${model}`);

    try {
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(model, prompt, options);
        case 'anthropic':
          return await this.callClaude(model, prompt, options);
        case 'gemini':
          return await this.callGemini(model, prompt, options);
        case 'grok':
          return await this.callGrok(model, prompt, options);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`[MultiLLMService] Error with ${provider}:`, error.message);
      this.markProviderFailure(provider, error);

      // Fallback to OpenAI if available
      if (provider !== 'openai' && this.openaiKey) {
        logger.warn(`[MultiLLMService] Falling back to OpenAI GPT-3.5`);
        const result = await this.callOpenAI('gpt-3.5-turbo', prompt, options);
        this.markProviderSuccess('openai');
        return result;
      }

      throw createError(500, `LLM call failed: ${error.message}`);
    }
  }

  /**
   * OpenAI API Implementation
   */
  async callOpenAI(model, prompt, options = {}) {
    if (!this.openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = '',
    } = options;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(this.endpoints.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    this.markProviderSuccess('openai');

    return {
      provider: 'openai',
      model,
      text: data.choices[0].message.content,
      usage: data.usage,
      raw: data,
    };
  }

  /**
   * Anthropic Claude API Implementation
   */
  async callClaude(model, prompt, options = {}) {
    if (!this.anthropicKey) {
      throw new Error('Anthropic API key not configured');
    }

    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = '',
    } = options;

    const messages = [
      { role: 'user', content: prompt }
    ];

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const response = await fetch(this.endpoints.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Claude API error: ${response.status}`);
    }

    const data = await response.json();

    this.markProviderSuccess('anthropic');

    return {
      provider: 'anthropic',
      model,
      text: data.content[0].text,
      usage: data.usage,
      raw: data,
    };
  }

  /**
   * Google Gemini API Implementation
   */
  async callGemini(model, prompt, options = {}) {
    if (!this.geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = '',
    } = options;

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const endpoint = `${this.endpoints.gemini}/${model}:generateContent?key=${this.geminiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned no candidates');
    }

    const text = data.candidates[0].content.parts[0].text;

    this.markProviderSuccess('gemini');

    return {
      provider: 'gemini',
      model,
      text,
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0,
      },
      raw: data,
    };
  }

  /**
   * X.AI Grok API Implementation
   */
  async callGrok(model, prompt, options = {}) {
    if (!this.grokKey) {
      throw new Error('Grok API key not configured');
    }

    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = '',
    } = options;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(this.endpoints.grok, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.grokKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Grok API error: ${response.status}`);
    }

    const data = await response.json();

    this.markProviderSuccess('grok');

    return {
      provider: 'grok',
      model,
      text: data.choices[0].message.content,
      usage: data.usage,
      raw: data,
    };
  }

  /**
   * Generate embeddings (used by quantum holographic consensus)
   */
  async generateEmbedding(text, model = 'text-embedding-3-small') {
    if (!this.openaiKey) {
      throw new Error('OpenAI API key required for embeddings');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      embedding: data.data[0].embedding,
      model: data.model,
      usage: data.usage,
    };
  }

  /**
   * Get available models based on configured API keys
   */
  getAvailableProviders() {
    const available = [];

    if (this.openaiKey) {
      available.push({
        name: 'OpenAI',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        strengths: ['reasoning', 'code', 'analysis'],
      });
    }

    if (this.anthropicKey) {
      available.push({
        name: 'Anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        strengths: ['reasoning', 'safety', 'long-context'],
      });
    }

    if (this.geminiKey) {
      available.push({
        name: 'Google',
        models: ['gemini-pro', 'gemini-ultra'],
        strengths: ['multimodal', 'reasoning', 'search'],
      });
    }

    if (this.grokKey) {
      available.push({
        name: 'xAI',
        models: ['grok-2'],
        strengths: ['creative', 'real-time', 'conversational'],
      });
    }

    return available;
  }

  getProviderHealth() {
    const providers = ['openai', 'anthropic', 'gemini', 'grok'];
    return providers.reduce((acc, provider) => {
      acc[provider] = {
        enabled: this.isProviderEnabled(provider),
        healthy: this.isProviderHealthy(provider),
        failures: this.failureCounts[provider] || 0,
        lastError: this.providerHealth[provider]?.lastError || null,
      };
      return acc;
    }, {});
  }
}

// Singleton instance
const multiLLMService = new MultiLLMService();

export default multiLLMService;
export { MultiLLMService };
