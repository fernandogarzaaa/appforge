/**
 * LLM API Client
 * Handles all LLM API calls through the backend
 */

import { getAuthToken } from './appforgeClient';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const withApiBase = (path) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
};

/**
 * Call LLM through backend API
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} LLM response
 */
export async function callLLM(prompt, options = {}) {
  const {
    model = 'gpt-4',
    systemPrompt = null,
    temperature = 0.7,
    maxTokens = 2000,
    jsonSchema = null,
  } = options;

  try {
    const token = getAuthToken();

    const response = await fetch(withApiBase('/api/base44/llm'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        model,
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        temperature,
        maxTokens,
        ...(jsonSchema && { jsonSchema }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'LLM API request failed');
    }

    return {
      success: true,
      response: data.data.text,
      model: data.data.model,
      usage: data.data.usage,
    };
  } catch (error) {
    console.error('LLM API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Streaming LLM call (for real-time responses)
 * @param {string} prompt - The prompt to send
 * @param {Function} onChunk - Callback for each chunk
 * @param {Object} options - Additional options
 */
export async function streamLLM(prompt, onChunk, options = {}) {
  const {
    model = 'gpt-4',
    systemPrompt = null,
    temperature = 0.7,
  } = options;

  try {
    const token = getAuthToken();

    const response = await fetch(withApiBase('/api/base44/llm/stream'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        model,
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', e);
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Streaming LLM Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate embeddings for text
 * @param {string} text - Text to embed
 * @returns {Promise<Object>} Embedding response
 */
export async function generateEmbedding(text) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(withApiBase('/api/embeddings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      embedding: data.data.embedding,
      dimension: data.data.dimension,
    };
  } catch (error) {
    console.error('Embedding API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  callLLM,
  streamLLM,
  generateEmbedding,
};
