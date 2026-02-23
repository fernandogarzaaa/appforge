import { createError } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

const CLAWD_LLM_URL = process.env.CLAWD_LLM_URL || 'http://localhost:7860';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Clawd Hybrid RTX LLM Backend Service
 * Proxies requests to local RTX 2060 + OpenRouter ensemble
 */

export const cladwLLMService = {
  /**
   * Generate with quantum consensus
   */
  async generate(prompt: string, options: any = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`[ClawdLLM] Generating for prompt: ${prompt.substring(0, 50)}...`);
      
      const response = await fetch(`${CLAWD_LLM_URL}/ensemble/consensus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: options.context,
          max_tokens: options.max_tokens || 512,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw createError(503, 'Clawd LLM service unavailable');
      }

      const data = await response.json();
      
      logger.info(`[ClawdLLM] Generated in ${Date.now() - startTime}ms, coherence: ${data.coherence}`);
      
      return {
        success: true,
        response: data.response,
        coherence: data.coherence,
        models_consulted: data.models_consulted,
        cache_hit: data.cache_hit,
        generation_time_ms: data.generation_time_ms,
        cost_usd: data.cost_usd
      };
    } catch (error) {
      logger.error('[ClawdLLM] Generation failed:', error);
      throw createError(500, 'LLM generation failed: ' + error.message);
    }
  },

  /**
   * Get LLM health and metrics
   */
  async getHealth() {
    try {
      const response = await fetch(`${CLAWD_LLM_URL}/health`, { timeout: 5000 } as any);
      return response.json();
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  },

  /**
   * Get coherence metrics
   */
  async getMetrics() {
    try {
      const response = await fetch(`${CLAWD_LLM_URL}/metrics`);
      return response.json();
    } catch (error) {
      return null;
    }
  }
};

/**
 * HTTP Handler for /functions/cladwLLM
 */
export default async function handler(req: any, res: any, next: any) {
  try {
    const { prompt, context, max_tokens, temperature } = req.body;
    
    if (!prompt) {
      throw createError(400, 'Prompt is required');
    }

    const result = await cladwLLMService.generate(prompt, {
      context,
      max_tokens,
      temperature
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
