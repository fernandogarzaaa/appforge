import { base44 } from '@/api/base44Client';

/**
 * AI Code Comments Generator
 * Auto-generate JSDoc/TSDoc comments using AI
 */
export class AICommentGenerator {
  /**
   * Generate comment for a function
   */
  static async generateFunctionComment(functionCode, language = 'javascript') {
    try {
      const prompt = `Generate a concise JSDoc comment for this ${language} function. Include @param, @returns, and @description tags:

${functionCode}

Return only the JSDoc comment block, no explanation.`;

      const response = await this._callAIAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error generating function comment:', error);
      return null;
    }
  }

  /**
   * Generate comment for a class
   */
  static async generateClassComment(classCode, language = 'javascript') {
    try {
      const prompt = `Generate a concise JSDoc comment for this ${language} class. Include @class and @description tags:

${classCode}

Return only the JSDoc comment block.`;

      const response = await this._callAIAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error generating class comment:', error);
      return null;
    }
  }

  /**
   * Explain complex code
   */
  static async explainCode(code, language = 'javascript') {
    try {
      const prompt = `Explain this ${language} code in simple terms. Be concise and focus on what it does and why:

${code}

Keep the explanation under 100 words.`;

      const response = await this._callAIAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error explaining code:', error);
      return null;
    }
  }

  /**
   * Generate type annotations
   */
  static async generateTypeAnnotations(code, language = 'javascript') {
    try {
      const prompt = `Add comprehensive type annotations to this ${language} code:

${code}

Return only the annotated code.`;

      const response = await this._callAIAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error generating types:', error);
      return null;
    }
  }

  /**
   * Helper: Call AI API
   */
  static async _callAIAPI(prompt) {
    // Use LLM context or fallback to API
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        temperature: 0.7,
        maxTokens: 500,
      }),
    });

    if (!response.ok) throw new Error('AI API error');
    const data = await response.json();
    return data.text || data.content;
  }
}

/**
 * Hook for AI code comments
 */
export function useAIComments() {
  const generateComment = async (code, type = 'function', language = 'javascript') => {
    switch (type) {
      case 'function':
        return AICommentGenerator.generateFunctionComment(code, language);
      case 'class':
        return AICommentGenerator.generateClassComment(code, language);
      case 'explain':
        return AICommentGenerator.explainCode(code, language);
      case 'types':
        return AICommentGenerator.generateTypeAnnotations(code, language);
      default:
        return null;
    }
  };

  return { generateComment };
}
