import { useState, useCallback, useRef } from 'react';
// Redux RTK Query - optional integration
// import { createApi } from '@reduxjs/toolkit/query/react';
import fetch from 'node-fetch';

/**
 * Custom hook for AI Code Generation
 * Integrates with OpenAI API for intelligent code suggestions
 */
export const useAIGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [usageStats, setUsageStats] = useState({ tokens: 0, cost: 0 });
  const abortControllerRef = useRef(null);

  // Prompt engineering templates
  const promptTemplates = {
    functionComplete: (context) =>
      `Complete the following function based on context:
Context: ${context.description}
Language: ${context.language}
Style: ${context.style || 'modern, clean, well-documented'}

\`\`\`${context.language}
${context.code}
\`\`\`

Provide 3 different implementations with trade-offs explained.`,

    refactoring: (context) =>
      `Refactor this code for ${context.goal || 'performance and readability'}:

\`\`\`${context.language}
${context.code}
\`\`\`

Provide the refactored code with inline comments explaining changes.`,

    bugFix: (context) =>
      `Analyze and fix the bug in this code:
Description: ${context.description}
Language: ${context.language}

\`\`\`${context.language}
${context.code}
\`\`\`

Provide:
1. Root cause analysis
2. Fixed code
3. Explanation of the fix
4. Prevention tips`,

    testGeneration: (context) =>
      `Generate comprehensive unit tests for this code:
Language: ${context.language}
Framework: ${context.framework || 'jest/vitest'}

\`\`\`${context.language}
${context.code}
\`\`\`

Include:
1. Happy path tests
2. Edge case tests
3. Error handling tests
4. Mock dependencies`,

    documentation: (context) =>
      `Generate JSDoc/documentation for this code:
Language: ${context.language}

\`\`\`${context.language}
${context.code}
\`\`\`

Include:
1. Function descriptions
2. Parameter types and descriptions
3. Return type and description
4. Usage examples
5. Potential exceptions`,
  };

  /**
   * Generate code using OpenAI API
   */
  const generateCode = useCallback(async (context, type = 'functionComplete') => {
    if (!context.code && !context.description) {
      setError('Please provide code or description');
      return null;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const prompt = promptTemplates[type]?.(context) || promptTemplates.functionComplete(context);

      // Call backend AI endpoint
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        signal: abortControllerRef.current?.signal,
        body: JSON.stringify({
          prompt,
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          language: context.language,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract suggestions from response
      const newSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [data.suggestion];

      setSuggestions(newSuggestions);
      setUsageStats({
        tokens: data.usage?.total_tokens || 0,
        cost: (data.usage?.total_tokens || 0) * 0.00003, // GPT-4 pricing approximation
      });

      return newSuggestions;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('Code generation error:', err);
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Insert generated code at cursor position
   */
  const insertCode = useCallback((editorInstance, code, mode = 'replace') => {
    if (!editorInstance) return;

    const selection = editorInstance.getSelection();
    const range = selection ? editorInstance.getSelectionRange() : null;

    if (mode === 'replace' && range) {
      editorInstance.getSession().replace(range, code);
    } else {
      const position = editorInstance.getCursorPosition();
      editorInstance.getSession().insert(position, code);
    }
  }, []);

  /**
   * Apply suggestion and optionally run tests
   */
  const applySuggestion = useCallback(async (suggestion, shouldTest = false) => {
    try {
      if (shouldTest) {
        // Generate tests for the suggestion
        const testSuggestions = await generateCode(
          {
            code: suggestion.code,
            language: suggestion.language,
            framework: 'vitest',
          },
          'testGeneration'
        );

        return {
          code: suggestion.code,
          tests: testSuggestions,
          applied: true,
        };
      }

      return {
        code: suggestion.code,
        applied: true,
      };
    } catch (err) {
      setError(err.message);
      return { applied: false, error: err.message };
    }
  }, [generateCode]);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, []);

  /**
   * Validate generated code before insertion
   */
  const validateCode = useCallback((code, language) => {
    const issues = [];

    // Basic syntax validation
    if (code.includes('TODO') || code.includes('FIXME')) {
      issues.push('Code contains TODOs or FIXMEs');
    }

    // Check for common security issues
    if (language === 'javascript' && code.includes('eval(')) {
      issues.push('⚠️ Security: Code uses eval()');
    }

    if (code.includes('password') || code.includes('apiKey')) {
      issues.push('⚠️ Security: Code may contain secrets');
    }

    // Check for performance issues
    if (code.match(/for\s*\([^)]*for\s*\(/)) {
      issues.push('⚠️ Performance: Nested loops detected');
    }

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 10),
    };
  }, []);

  /**
   * Get code explanation
   */
  const explainCode = useCallback(async (code, language) => {
    try {
      const response = await fetch('/api/ai/explain-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          code,
          language,
          detailLevel: 'comprehensive',
        }),
      });

      if (!response.ok) throw new Error('Failed to explain code');
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    isGenerating,
    suggestions,
    error,
    usageStats,
    generateCode,
    insertCode,
    applySuggestion,
    cancel,
    validateCode,
    explainCode,
    promptTemplates,
  };
};

export default useAIGeneration;
