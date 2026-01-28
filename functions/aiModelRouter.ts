/**
 * AI Model Router Serverless Function
 * Handles API calls to ChatGPT, Claude, Gemini, Grok with fallback to Base44
 * 
 * Endpoints:
 * POST /functions/aiModelRouter
 *   - action: "route" | "query" | "analyze"
 *   - prompt: string
 *   - model?: AIModel (override routing)
 *   - config?: AIRouterConfig
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

interface AIRequest {
  action: 'route' | 'query' | 'analyze';
  prompt: string;
  model?: string; // Override model selection
  config?: {
    preferredModel?: string;
    fallbackToBase44?: boolean;
    enableAutoRouting?: boolean;
    retryOnFailure?: boolean;
  };
}

interface AIResponse {
  success: boolean;
  model: string;
  response: string;
  routing?: {
    selectedModel: string;
    confidence: number;
    reason: string;
    alternativeModels: string[];
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/**
 * Call ChatGPT (OpenAI) API
 */
async function callChatGPT(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(`ChatGPT error: ${data.error?.message || 'Unknown error'}`);
  }

  return {
    text: data.choices[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
  };
}

/**
 * Call Claude (Anthropic) API
 */
async function callClaude(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Anthropic API key not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(`Claude error: ${data.error?.message || 'Unknown error'}`);
  }

  return {
    text: data.content[0]?.text || '',
    tokens: data.usage?.output_tokens || 0,
  };
}

/**
 * Call Gemini (Google) API
 */
async function callGemini(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Gemini API key not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(`Gemini error: ${data.error?.message || 'Unknown error'}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const tokens = data.usageMetadata?.totalTokenCount || 0;

  return { text, tokens };
}

/**
 * Call Grok (X.AI) API
 */
async function callGrok(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = Deno.env.get('GROK_API_KEY');
  if (!apiKey) throw new Error('Grok API key not configured');

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-2',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(`Grok error: ${data.error?.message || 'Unknown error'}`);
  }

  return {
    text: data.choices[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
  };
}

/**
 * Call Base44 LLM (fallback)
 */
async function callBase44(
  prompt: string,
  base44Client: any
): Promise<{ text: string; tokens: number }> {
  const response = await base44Client.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
      },
    },
  });

  return {
    text: typeof response === 'string' ? response : response.response || '',
    tokens: 0, // Base44 doesn't track tokens
  };
}

/**
 * Route and execute query based on analysis
 */
async function executeQuery(
  prompt: string,
  model: string,
  base44Client: any
): Promise<AIResponse> {
  let result;
  let selectedModel = model;
  let error: string | undefined;

  try {
    switch (model.toLowerCase()) {
      case 'chatgpt':
      case 'openai':
        result = await callChatGPT(prompt);
        selectedModel = 'ChatGPT (GPT-4)';
        break;

      case 'claude':
      case 'anthropic':
        result = await callClaude(prompt);
        selectedModel = 'Claude (Opus)';
        break;

      case 'gemini':
      case 'google':
        result = await callGemini(prompt);
        selectedModel = 'Gemini (Pro)';
        break;

      case 'grok':
      case 'xai':
        result = await callGrok(prompt);
        selectedModel = 'Grok (2)';
        break;

      case 'base44':
      default:
        result = await callBase44(prompt, base44Client);
        selectedModel = 'Base44 LLM';
    }
  } catch (err) {
    error = (err as Error).message;

    // Fallback to Base44
    if (model !== 'base44') {
      console.warn(`Failed to use ${model}, falling back to Base44:`, error);
      try {
        result = await callBase44(prompt, base44Client);
        selectedModel = 'Base44 LLM (Fallback)';
        error = `Primary model failed, fell back to Base44: ${error}`;
      } catch (fallbackErr) {
        return {
          success: false,
          model: 'base44',
          response: '',
          error: `All models failed. Original: ${error}, Fallback: ${(fallbackErr as Error).message}`,
        };
      }
    } else {
      return {
        success: false,
        model: selectedModel,
        response: '',
        error,
      };
    }
  }

  return {
    success: true,
    model: selectedModel,
    response: result.text,
    usage: {
      promptTokens: 0,
      completionTokens: result.tokens,
      totalTokens: result.tokens,
    },
    error,
  };
}

/**
 * Analyze prompt to determine best model
 */
function analyzeAndRoute(prompt: string): {
  selectedModel: string;
  confidence: number;
  reason: string;
  alternatives: string[];
} {
  const lowerPrompt = prompt.toLowerCase();

  // Code detection
  const codeKeywords = [
    'code',
    'function',
    'debug',
    'error',
    'implement',
    'refactor',
  ];
  const codeScore = codeKeywords.filter((k) => lowerPrompt.includes(k)).length;

  // Reasoning detection
  const reasoningKeywords = ['analyze', 'explain', 'compare', 'evaluate'];
  const reasoningScore = reasoningKeywords.filter((k) =>
    lowerPrompt.includes(k)
  ).length;

  // Vision detection
  const visionKeywords = ['image', 'photo', 'visual', 'diagram', 'design'];
  const visionScore = visionKeywords.filter((k) => lowerPrompt.includes(k))
    .length;

  // Creative detection
  const creativeKeywords = ['creative', 'brainstorm', 'idea', 'novel'];
  const creativeScore = creativeKeywords.filter((k) =>
    lowerPrompt.includes(k)
  ).length;

  // Determine best model
  if (codeScore >= reasoningScore && codeScore >= visionScore && codeScore >= creativeScore) {
    return {
      selectedModel: 'chatgpt',
      confidence: 0.95,
      reason: 'Code generation/analysis detected - ChatGPT excels at this',
      alternatives: ['claude', 'gemini', 'base44'],
    };
  }

  if (reasoningScore >= visionScore && reasoningScore >= creativeScore) {
    return {
      selectedModel: 'claude',
      confidence: 0.9,
      reason: 'Complex reasoning detected - Claude is best for deep analysis',
      alternatives: ['chatgpt', 'gemini', 'base44'],
    };
  }

  if (visionScore >= creativeScore) {
    return {
      selectedModel: 'gemini',
      confidence: 0.85,
      reason: 'Vision/multimodal task detected - Gemini has strong capabilities',
      alternatives: ['claude', 'chatgpt', 'base44'],
    };
  }

  if (creativeScore > 0) {
    return {
      selectedModel: 'grok',
      confidence: 0.8,
      reason: 'Creative task detected - Grok has unique creative abilities',
      alternatives: ['claude', 'chatgpt', 'base44'],
    };
  }

  // Default to Claude for general queries
  return {
    selectedModel: 'claude',
    confidence: 0.7,
    reason: 'General query - Claude is a well-rounded choice',
    alternatives: ['chatgpt', 'gemini', 'grok', 'base44'],
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as AIRequest;
    const { action, prompt, model, config } = body;

    if (!prompt || prompt.trim().length === 0) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    switch (action) {
      case 'route': {
        // Analyze and return routing recommendation
        const routing = analyzeAndRoute(prompt);
        return Response.json({
          success: true,
          model: routing.selectedModel,
          routing,
        });
      }

      case 'analyze': {
        // Just return analysis without executing
        const routing = analyzeAndRoute(prompt);
        return Response.json({
          success: true,
          routing,
        });
      }

      case 'query': {
        // Route and execute
        const routing = analyzeAndRoute(prompt);
        const selectedModel = model || routing.selectedModel;

        const result = await executeQuery(selectedModel, selectedModel, base44);

        return Response.json({
          ...result,
          routing: config?.enableAutoRouting !== false ? routing : undefined,
        });
      }

      default:
        return Response.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Router error:', error);
    return Response.json(
      {
        success: false,
        model: 'error',
        response: '',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
});
