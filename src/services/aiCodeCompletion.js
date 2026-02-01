/**
 * AI Code Completion Service
 * Provides intelligent code suggestions using context analysis
 */

import { analyticsService } from './analytics';

class AICodeCompletionService {
  constructor() {
    this.apiEndpoint = import.meta.env.VITE_AI_API_ENDPOINT || '/api/ai/complete';
    this.apiKey = import.meta.env.VITE_AI_API_KEY || '';
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Get code completion suggestions
   */
  async getCompletions(context) {
    const { code, language, cursorPosition, fileName } = context;
    const cacheKey = this.getCacheKey(code, cursorPosition);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check for pending request
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Track completion request
    analyticsService.recordPerformanceMetric('ai_completion_request', 0, {
      language,
      fileName,
    });

    const completionPromise = this.fetchCompletions({
      code,
      language,
      cursorPosition,
      fileName,
      context: this.extractContext(code, cursorPosition),
    });

    this.pendingRequests.set(cacheKey, completionPromise);

    try {
      const result = await completionPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch completions from AI API
   */
  async fetchCompletions(payload) {
    const startTime = performance.now();

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const duration = performance.now() - startTime;

      analyticsService.recordPerformanceMetric('ai_completion_response', duration);

      return {
        suggestions: data.suggestions || [],
        confidence: data.confidence || 0,
        metadata: data.metadata || {},
      };
    } catch (error) {
      console.error('AI completion failed:', error);
      analyticsService.recordPerformanceMetric('ai_completion_error', performance.now() - startTime);
      return { suggestions: [], confidence: 0, metadata: { error: error.message } };
    }
  }

  /**
   * Extract relevant context around cursor
   */
  extractContext(code, cursorPosition) {
    const lines = code.split('\n');
    const beforeCursor = code.substring(0, cursorPosition);
    const afterCursor = code.substring(cursorPosition);

    const lineNumber = beforeCursor.split('\n').length - 1;
    const startLine = Math.max(0, lineNumber - 10);
    const endLine = Math.min(lines.length, lineNumber + 10);

    return {
      beforeCursor: beforeCursor.slice(-500), // Last 500 chars
      afterCursor: afterCursor.slice(0, 500), // Next 500 chars
      surroundingLines: lines.slice(startLine, endLine).join('\n'),
      lineNumber,
    };
  }

  /**
   * Generate cache key
   */
  getCacheKey(code, cursorPosition) {
    return `${code.substring(0, cursorPosition).slice(-100)}_${cursorPosition}`;
  }

  /**
   * Track suggestion acceptance
   */
  trackAcceptance(suggestion, context) {
    analyticsService.trackEvent('ai_suggestion_accepted', {
      language: context.language,
      suggestionLength: suggestion.length,
      confidence: context.confidence,
    });
  }

  /**
   * Track suggestion rejection
   */
  trackRejection(suggestion, context) {
    analyticsService.trackEvent('ai_suggestion_rejected', {
      language: context.language,
      suggestionLength: suggestion.length,
      confidence: context.confidence,
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get inline documentation
   */
  async getDocumentation(symbol, language) {
    try {
      const response = await fetch(`${this.apiEndpoint}/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ symbol, language }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.documentation || null;
    } catch (error) {
      console.error('Documentation fetch failed:', error);
      return null;
    }
  }
}

export const aiCodeCompletionService = new AICodeCompletionService();
export default aiCodeCompletionService;
