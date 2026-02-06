/**
 * Base44 Service
 * Backend integration for Base44 platform and LLM routing
 */

import { createError } from '../utils/helpers.js';
import logger from '../config/logger.js';
import { getCachedData, setCachedData } from '../utils/caching.js';
import UserCredits from '../models/UserCredits.js';
import quantumLLMService from './quantumLLMService.js';
import multiLLMService from './multiLLMService.js';

class Base44Service {
  constructor() {
    this.appId = process.env.BASE44_APP_ID;
    this.serviceToken = process.env.BASE44_SERVICE_TOKEN;
    this.apiUrl = process.env.BASE44_API_URL || 'https://appforge.fun';
    this.username = process.env.BASE44_USERNAME;
    this.password = process.env.BASE44_PASSWORD;
    this.token = null;
    this.tokenExpiry = null;

    // Quantum LLM configuration
    this.quantumEnabled = process.env.QUANTUM_DEFAULT_MODE === 'quantum';
    this.quantumLLM = quantumLLMService;
    this.multiLLM = multiLLMService;

    // Legacy OpenAI configuration
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    if (!this.username || !this.password) {
      logger.warn('[Base44Service] Base44 credentials not configured. Base44 platform features will be limited.');
    }

    if (!this.openaiApiKey) {
      logger.warn('[Base44Service] OpenAI API key not configured. AI features will use limited fallbacks.');
    }

    logger.info(`[Base44Service] Quantum LLM mode: ${this.quantumEnabled ? 'ENABLED ✓' : 'Disabled'}`);
  }

  /**
   * Authenticate with Base44 and get access token
   */
  async authenticate() {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Check cache
    const cachedToken = await getCachedData('base44:auth:token');
    if (cachedToken) {
      this.token = cachedToken.token;
      this.tokenExpiry = cachedToken.expiry;
      return this.token;
    }

    if (!this.username || !this.password) {
      throw createError(500, 'Base44 credentials not configured');
    }

    try {
      logger.info('[Base44Service] Authenticating with Base44');

      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();
      this.token = data.token;
      // Tokens typically expire in 24 hours, cache for 23 hours
      this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

      // Cache token
      await setCachedData('base44:auth:token', {
        token: this.token,
        expiry: this.tokenExpiry,
      }, 82800); // 23 hours

      logger.info('[Base44Service] Authentication successful');
      return this.token;

    } catch (error) {
      logger.error('[Base44Service] Authentication error:', error);
      throw createError(500, 'Failed to authenticate with Base44: ' + error.message);
    }
  }

  /**
   * Call Base44 function
   * @param {string} functionName - Name of the Base44 function
   * @param {Object} params - Function parameters
   * @param {Object} options - Options (userId for credit tracking)
   */
  async callFunction(functionName, params = {}, options = {}) {
    try {
      const token = await this.authenticate();

      logger.info(`[Base44Service] Calling function: ${functionName}`);

      const response = await fetch(`${this.apiUrl}/api/functions/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(this.serviceToken ? { 'X-Service-Token': this.serviceToken } : {}),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error(`[Base44Service] Function call failed:`, error);
        throw new Error(error.message || `Function ${functionName} failed`);
      }

      const data = await response.json();

      // Track usage if userId provided
      if (options.userId) {
        await this.trackUsage(options.userId, functionName, params, data);
      }

      return data;

    } catch (error) {
      logger.error(`[Base44Service] Error calling function ${functionName}:`, error);
      throw createError(500, `Base44 function call failed: ${error.message}`);
    }
  }

  /**
   * Call LLM with intelligent routing
   * @param {string} model - Model name (e.g., 'quantum', 'gpt-4', 'claude-3')
   * @param {string} prompt - User prompt
   * @param {Object} options - Model options and userId
   */
  async callLLM(model, prompt, options = {}) {
    try {
      const {
        userId,
        temperature = 0.7,
        maxTokens = 2000,
        systemPrompt = '',
        taskType = 'general',
        forceEnsemble = false,
        ...otherOptions
      } = options;

      // Route to Quantum LLM for quantum/base44 models
      if (model === 'quantum' || model === 'base44' || this.quantumEnabled) {
        logger.info(`[Base44Service] Routing to Quantum LLM (model: ${model})`);

        const result = await this.quantumLLM.quantumQuery(prompt, {
          systemPrompt,
          temperature,
          maxTokens,
          taskType,
          forceEnsemble: forceEnsemble || model === 'quantum',
          userId,
        });

        // Track usage
        if (userId && result.usage) {
          await this.trackLLMUsage(userId, 'quantum', prompt, result);
        }

        return {
          text: result.response,
          usage: result.usage,
          model: result.model,
          quantumMetrics: result.quantumMetrics,
          raw: result,
        };
      }

      // Route to specific LLM provider
      logger.info(`[Base44Service] Routing to Multi-LLM service (model: ${model})`);

      const result = await this.multiLLM.callLLM(model, prompt, {
        systemPrompt,
        temperature,
        maxTokens,
        ...otherOptions,
      });

      // Track usage
      if (userId && result.usage) {
        await this.trackLLMUsage(userId, model, prompt, result);
      }

      return {
        text: result.text,
        usage: result.usage,
        model: result.model,
        provider: result.provider,
        raw: result,
      };

    } catch (error) {
      logger.error(`[Base44Service] Error calling LLM ${model}:`, error);
      throw createError(500, `LLM call failed: ${error.message}`);
    }
  }

  /**
   * Stream LLM response using OpenAI
   * @param {string} model - Model name
   * @param {string} prompt - User prompt
   * @param {Object} options - Model options
   * @returns {ReadableStream} Stream of response chunks
   */
  async streamLLM(model, prompt, options = {}) {
    try {
      // Validate OpenAI API key
      if (!this.openaiApiKey) {
        throw createError(500, 'OpenAI API key not configured');
      }

      const {
        temperature = 0.7,
        maxTokens = 2000,
        systemPrompt = '',
        ...otherOptions
      } = options;

      // Map model names
      const modelMap = {
        'base44': 'gpt-3.5-turbo',
        'chatgpt': 'gpt-4',
        'gpt-4': 'gpt-4',
        'gpt-3.5-turbo': 'gpt-3.5-turbo',
        'claude': 'gpt-4',
        'claude-3-opus': 'gpt-4',
        'gemini': 'gpt-3.5-turbo',
        'gemini-pro': 'gpt-3.5-turbo',
      };

      const openaiModel = modelMap[model] || this.defaultModel;
      logger.info(`[Base44Service] Streaming OpenAI LLM: ${openaiModel}`);

      // Build messages
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      // Call OpenAI streaming API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
          ...otherOptions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error(`[Base44Service] OpenAI streaming error:`, error);
        throw new Error(error.error?.message || `LLM streaming ${model} failed`);
      }

      return response.body;

    } catch (error) {
      logger.error(`[Base44Service] Error streaming LLM ${model}:`, error);
      throw createError(500, `LLM streaming failed: ${error.message}`);
    }
  }

  /**
   * Get available LLM models
   */
  async getAvailableModels() {
    try {
      const token = await this.authenticate();

      // Check cache first
      const cached = await getCachedData('base44:models');
      if (cached) {
        return cached;
      }

      const response = await fetch(`${this.apiUrl}/api/ai/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const models = await response.json();

      // Cache for 1 hour
      await setCachedData('base44:models', models, 3600);

      return models;

    } catch (error) {
      logger.error('[Base44Service] Error fetching models:', error);
      // Return default models as fallback
      return [
        { id: 'base44', name: 'Base44 Default', provider: 'base44' },
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
      ];
    }
  }

  /**
   * Track function usage for billing
   * @private
   */
  async trackUsage(userId, functionName, params, response) {
    try {
      await UserCredits.findOneAndUpdate(
        { userId },
        {
          $inc: { 'usage.base44.calls': 1 },
          $push: {
            'usage.base44.history': {
              $each: [{
                function: functionName,
                timestamp: new Date(),
                cost: 0.01, // Base cost per function call
              }],
              $slice: -100, // Keep last 100 entries
            },
          },
        },
        { upsert: true }
      );

      logger.debug(`[Base44Service] Tracked usage for user ${userId}`);

    } catch (error) {
      logger.error('[Base44Service] Error tracking usage:', error);
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }

  /**
   * Track LLM usage for billing
   * @private
   */
  async trackLLMUsage(userId, model, prompt, response) {
    try {
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this._calculateCost(model, tokensUsed);

      await UserCredits.findOneAndUpdate(
        { userId },
        {
          $inc: {
            'usage.base44.tokens': tokensUsed,
            'usage.base44.cost': cost,
          },
          $push: {
            'usage.base44.history': {
              $each: [{
                model,
                tokens: tokensUsed,
                cost,
                timestamp: new Date(),
              }],
              $slice: -100,
            },
          },
        },
        { upsert: true }
      );

      logger.debug(`[Base44Service] Tracked LLM usage for user ${userId}: ${tokensUsed} tokens, $${cost.toFixed(4)}`);

    } catch (error) {
      logger.error('[Base44Service] Error tracking LLM usage:', error);
    }
  }

  /**
   * Calculate cost based on model and tokens
   * @private
   */
  _calculateCost(model, tokens) {
    const pricing = {
      'base44': 0.0001, // $0.0001 per 1K tokens
      'gpt-4': 0.03, // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.002,
      'claude-3-opus': 0.015,
      'claude-3-sonnet': 0.003,
      'claude-3-haiku': 0.00025,
    };

    const rate = pricing[model] || 0.001; // Default rate
    return (tokens / 1000) * rate;
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      const isAuthenticated = !!this.token || !!(await this.authenticate().catch(() => null));

      return {
        configured: !!(this.username && this.password),
        authenticated: isAuthenticated,
        apiUrl: this.apiUrl,
        hasServiceToken: !!this.serviceToken,
      };
    } catch (error) {
      return {
        configured: !!(this.username && this.password),
        authenticated: false,
        apiUrl: this.apiUrl,
        error: error.message,
      };
    }
  }
}

// Singleton instance
const base44Service = new Base44Service();

export default base44Service;
export { Base44Service };
