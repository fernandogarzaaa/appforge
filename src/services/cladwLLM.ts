import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CLAWD_LLM_URL = import.meta.env.VITE_CLAWD_LLM_URL || 'http://localhost:7860';
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

interface ClawdRequest {
  prompt: string;
  context?: string;
  max_tokens?: number;
  temperature?: number;
  use_openrouter?: boolean;
}

interface ClawdResponse {
  response: string;
  coherence: number;
  models_consulted: number;
  cache_hit: boolean;
  generation_time_ms: number;
  cost_usd: number;
}

/**
 * Clawd Hybrid RTX LLM Service
 * Integrates local RTX 2060 + OpenRouter ensemble
 */
export const cladwLLM = {
  /**
   * Generate with quantum consensus
   */
  async generate(request: ClawdRequest): Promise<string> {
    try {
      // Try local Clawd Hybrid first
      const response = await fetch(`${CLAWD_LLM_URL}/ensemble/consensus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          context: request.context,
          max_tokens: request.max_tokens || 512,
          temperature: request.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Clawd LLM unavailable');
      }

      const data: ClawdResponse = await response.json();
      
      // Track metrics
      console.log(`[Clawd] Coherence: ${data.coherence}, Cache: ${data.cache_hit}, Cost: $${data.cost_usd}`);
      
      return data.response;
    } catch (error) {
      console.warn('[Clawd] Local LLM failed, falling back to base44:', error);
      
      // Fallback to base44 default
      const result = await base44.functions.invoke('quantumLLM', {
        prompt: request.prompt,
        context: request.context
      });
      
      return result.data?.response || 'Error generating response';
    }
  },

  /**
   * Stream tokens as they're generated
   */
  async *stream(request: ClawdRequest): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${CLAWD_LLM_URL}/ensemble/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          context: request.context,
          max_tokens: request.max_tokens || 512
        })
      });

      if (!response.ok) throw new Error('Streaming failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.token) yield data.token;
            if (data.done) return;
          }
        }
      }
    } catch (error) {
      console.error('[Clawd] Stream error:', error);
      toast.error('LLM streaming failed');
      throw error;
    }
  },

  /**
   * Check if Clawd LLM is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${CLAWD_LLM_URL}/health`, { timeout: 5000 } as any);
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get coherence metrics
   */
  async getMetrics(): Promise<{
    coherence_avg: number;
    cache_hit_rate: number;
    total_requests: number;
    cost_saved: number;
  }> {
    try {
      const response = await fetch(`${CLAWD_LLM_URL}/metrics`);
      return response.json();
    } catch {
      return {
        coherence_avg: 0,
        cache_hit_rate: 0,
        total_requests: 0,
        cost_saved: 0
      };
    }
  }
};

/**
 * AppForge LLM Provider Integration
 * Compatible with existing AI context
 */
export const cladwLLMProvider = {
  name: 'clawd-hybrid',
  displayName: 'Clawd Hybrid RTX + OpenRouter',
  
  async generate(prompt: string, options?: any) {
    return cladwLLM.generate({
      prompt,
      context: options?.context,
      max_tokens: options?.max_tokens
    });
  },
  
  async stream(prompt: string, options?: any) {
    return cladwLLM.stream({
      prompt,
      context: options?.context,
      max_tokens: options?.max_tokens
    });
  },
  
  async isAvailable() {
    return cladwLLM.isAvailable();
  }
};
