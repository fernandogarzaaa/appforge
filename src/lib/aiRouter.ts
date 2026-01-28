/**
 * AI Model Router - Intelligently routes prompts to the best AI model
 * Supports: ChatGPT, Claude, Gemini, Grok, and Base44 (fallback)
 * 
 * Routing Logic:
 * - Code analysis & generation → ChatGPT (GPT-4)
 * - Long-form content & reasoning → Claude (Opus)
 * - Multi-modal & vision tasks → Gemini (Pro)
 * - Creative & experimental → Grok (2)
 * - Default fallback → Base44 LLM
 */

export enum AIModel {
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  GROK = 'grok',
  BASE44 = 'base44' // Fallback
}

export interface AIRouterConfig {
  preferredModel?: AIModel;
  fallbackToBase44?: boolean;
  enableAutoRouting?: boolean;
  retryOnFailure?: boolean;
}

export interface RoutingDecision {
  selectedModel: AIModel;
  confidence: number; // 0-1
  reason: string;
  alternativeModels: AIModel[];
}

interface PromptAnalysis {
  type: 'code' | 'content' | 'reasoning' | 'vision' | 'creative' | 'general';
  complexity: 'simple' | 'moderate' | 'complex';
  requiresContext: boolean;
  isMultiModal: boolean;
}

/**
 * Analyze the user's prompt to determine the best AI model
 */
export function analyzePrompt(prompt: string): PromptAnalysis {
  const lowerPrompt = prompt.toLowerCase();
  
  // Code-related keywords
  const codeKeywords = ['code', 'function', 'implement', 'debug', 'refactor', 'optimize', 'class', 'method', 'api', 'sql', 'javascript', 'typescript', 'python', 'react', 'component', 'error', 'bug', 'fix'];
  const codeMatches = codeKeywords.filter(k => lowerPrompt.includes(k)).length;
  
  // Reasoning-related keywords (complex analysis)
  const reasoningKeywords = ['analyze', 'explain', 'compare', 'evaluate', 'pros', 'cons', 'trade-offs', 'strategic', 'implications', 'research', 'study', 'investigate'];
  const reasoningMatches = reasoningKeywords.filter(k => lowerPrompt.includes(k)).length;
  
  // Vision/Image keywords
  const visionKeywords = ['image', 'photo', 'visual', 'picture', 'screenshot', 'diagram', 'chart', 'design', 'mockup', 'ui', 'layout'];
  const visionMatches = visionKeywords.filter(k => lowerPrompt.includes(k)).length;
  
  // Content creation keywords
  const contentKeywords = ['write', 'create', 'generate', 'compose', 'draft', 'article', 'blog', 'story', 'email', 'copy', 'social', 'content'];
  const contentMatches = contentKeywords.filter(k => lowerPrompt.includes(k)).length;
  
  // Creative keywords
  const creativeKeywords = ['creative', 'brainstorm', 'idea', 'innovative', 'novel', 'experimental', 'imagine', 'explore', 'artistic'];
  const creativeMatches = creativeKeywords.filter(k => lowerPrompt.includes(k)).length;

  // Determine prompt type
  let type: PromptAnalysis['type'] = 'general';
  if (codeMatches > 2) type = 'code';
  else if (reasoningMatches > 2) type = 'reasoning';
  else if (visionMatches > 2) type = 'vision';
  else if (contentMatches > 2) type = 'content';
  else if (creativeMatches > 2) type = 'creative';

  // Determine complexity
  const complexity: PromptAnalysis['complexity'] = 
    prompt.length > 500 ? 'complex' :
    prompt.length > 200 ? 'moderate' :
    'simple';

  // Check if it requires context
  const requiresContext = ['given', 'previous', 'following', 'above', 'below'].some(k => lowerPrompt.includes(k));
  
  // Check if multimodal
  const isMultiModal = visionMatches > 0 && (codeMatches > 0 || contentMatches > 0);

  return {
    type,
    complexity,
    requiresContext,
    isMultiModal
  };
}

/**
 * Route a prompt to the best AI model based on analysis
 */
export function routeToModel(
  prompt: string,
  config: AIRouterConfig = {}
): RoutingDecision {
  const {
    preferredModel,
    fallbackToBase44 = true,
    enableAutoRouting = true
  } = config;

  // If user prefers a specific model, use it
  if (preferredModel && enableAutoRouting === false) {
    return {
      selectedModel: preferredModel,
      confidence: 1.0,
      reason: `Using user-preferred model: ${preferredModel}`,
      alternativeModels: [AIModel.BASE44]
    };
  }

  const analysis = analyzePrompt(prompt);

  let selectedModel: AIModel = AIModel.BASE44;
  let confidence = 0.5;
  let reason = '';
  const alternatives: AIModel[] = [];

  // Route based on analysis
  switch (analysis.type) {
    case 'code':
      selectedModel = AIModel.CHATGPT;
      confidence = 0.95;
      reason = 'Code generation/analysis - GPT-4 is excellent at this';
      alternatives.push(AIModel.CLAUDE, AIModel.GEMINI, AIModel.BASE44);
      break;

    case 'reasoning':
      selectedModel = AIModel.CLAUDE;
      confidence = 0.9;
      reason = 'Complex reasoning and analysis - Claude Opus excels at deep thinking';
      alternatives.push(AIModel.CHATGPT, AIModel.GEMINI, AIModel.BASE44);
      break;

    case 'vision':
      selectedModel = AIModel.GEMINI;
      confidence = 0.85;
      reason = 'Vision/image tasks - Gemini has strong multimodal capabilities';
      alternatives.push(AIModel.CLAUDE, AIModel.CHATGPT, AIModel.BASE44);
      break;

    case 'creative':
      selectedModel = AIModel.GROK;
      confidence = 0.8;
      reason = 'Creative and experimental tasks - Grok has unique creative capabilities';
      alternatives.push(AIModel.CLAUDE, AIModel.CHATGPT, AIModel.BASE44);
      break;

    case 'content':
      selectedModel = AIModel.CLAUDE;
      confidence = 0.85;
      reason = 'Content creation - Claude produces high-quality long-form content';
      alternatives.push(AIModel.CHATGPT, AIModel.GROK, AIModel.BASE44);
      break;

    case 'general':
    default:
      // Use preference or round-robin for general tasks
      if (preferredModel) {
        selectedModel = preferredModel;
        confidence = 0.7;
        reason = `General task with user preference for ${preferredModel}`;
      } else {
        // Default to Claude for general queries (best all-rounder)
        selectedModel = AIModel.CLAUDE;
        confidence = 0.7;
        reason = 'General query - Claude is a well-rounded choice';
      }
      alternatives.push(AIModel.CHATGPT, AIModel.GEMINI, AIModel.GROK, AIModel.BASE44);
      break;
  }

  // Adjust confidence based on complexity
  if (analysis.complexity === 'complex') {
    confidence = Math.min(confidence + 0.05, 1.0);
  } else if (analysis.complexity === 'simple') {
    confidence = Math.max(confidence - 0.1, 0.5);
  }

  // Add fallback
  if (fallbackToBase44 && !alternatives.includes(AIModel.BASE44)) {
    alternatives.push(AIModel.BASE44);
  }

  return {
    selectedModel,
    confidence,
    reason,
    alternativeModels: alternatives.slice(0, 3)
  };
}

/**
 * Get the API configuration for a model
 */
export function getModelConfig(model: AIModel): {
  name: string;
  apiKey: string | undefined;
  endpoint: string;
  version?: string;
  maxTokens?: number;
} {
  const configs: Record<AIModel, any> = {
    [AIModel.CHATGPT]: {
      name: 'OpenAI GPT-4',
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      version: 'gpt-4-turbo-preview',
      maxTokens: 4096
    },
    [AIModel.CLAUDE]: {
      name: 'Anthropic Claude 3 Opus',
      apiKey: process.env.ANTHROPIC_API_KEY,
      endpoint: 'https://api.anthropic.com/v1/messages',
      version: 'claude-3-opus-20240229',
      maxTokens: 4096
    },
    [AIModel.GEMINI]: {
      name: 'Google Gemini Pro',
      apiKey: process.env.GEMINI_API_KEY,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      version: 'gemini-pro',
      maxTokens: 4096
    },
    [AIModel.GROK]: {
      name: 'Grok 2',
      apiKey: process.env.GROK_API_KEY,
      endpoint: 'https://api.x.ai/v1/chat/completions',
      version: 'grok-2',
      maxTokens: 4096
    },
    [AIModel.BASE44]: {
      name: 'Base44 LLM',
      apiKey: process.env.BASE44_API_KEY,
      endpoint: 'base44-internal',
      maxTokens: 4096
    }
  };

  return configs[model] || configs[AIModel.BASE44];
}

/**
 * Format a prompt for a specific model
 */
export function formatPromptForModel(prompt: string, model: AIModel): string {
  // Different models may need different formatting
  // This is where we can add model-specific prompt engineering
  
  switch (model) {
    case AIModel.CHATGPT:
      return prompt; // OpenAI handles standard prompts well

    case AIModel.CLAUDE:
      // Claude works well with clear structure
      return `Please help with the following:

${prompt}

Provide a clear, well-reasoned response.`;

    case AIModel.GEMINI:
      // Gemini can handle various formats
      return prompt;

    case AIModel.GROK:
      // Grok appreciates directness and context
      return `Task: ${prompt}

Please provide a thoughtful response.`;

    case AIModel.BASE44:
      return prompt;

    default:
      return prompt;
  }
}

/**
 * Get fallback chain for a model
 */
export function getFallbackChain(model: AIModel): AIModel[] {
  const chains: Record<AIModel, AIModel[]> = {
    [AIModel.CHATGPT]: [AIModel.CLAUDE, AIModel.GEMINI, AIModel.GROK, AIModel.BASE44],
    [AIModel.CLAUDE]: [AIModel.CHATGPT, AIModel.GEMINI, AIModel.GROK, AIModel.BASE44],
    [AIModel.GEMINI]: [AIModel.CLAUDE, AIModel.CHATGPT, AIModel.GROK, AIModel.BASE44],
    [AIModel.GROK]: [AIModel.CLAUDE, AIModel.CHATGPT, AIModel.GEMINI, AIModel.BASE44],
    [AIModel.BASE44]: [] // No fallback from Base44
  };

  return chains[model] || [AIModel.BASE44];
}

/**
 * Calculate model availability based on API keys
 */
export function getAvailableModels(): AIModel[] {
  const available: AIModel[] = [];

  if (process.env.OPENAI_API_KEY) available.push(AIModel.CHATGPT);
  if (process.env.ANTHROPIC_API_KEY) available.push(AIModel.CLAUDE);
  if (process.env.GEMINI_API_KEY) available.push(AIModel.GEMINI);
  if (process.env.GROK_API_KEY) available.push(AIModel.GROK);
  
  // Base44 is always available as fallback
  available.push(AIModel.BASE44);

  return available;
}

/**
 * Main router function - takes a prompt and returns the best model to use
 */
export function smartRoute(
  prompt: string,
  config: AIRouterConfig = {}
): {
  model: AIModel;
  decision: RoutingDecision;
  fallbacks: AIModel[];
  available: AIModel[];
  formattedPrompt: string;
} {
  const available = getAvailableModels();
  const decision = routeToModel(prompt, config);
  
  // Ensure selected model is available
  let selectedModel = decision.selectedModel;
  if (!available.includes(selectedModel)) {
    // Find first available alternative
    const fallbacks = getFallbackChain(selectedModel);
    selectedModel = fallbacks.find(m => available.includes(m)) || AIModel.BASE44;
  }

  const formattedPrompt = formatPromptForModel(prompt, selectedModel);

  return {
    model: selectedModel,
    decision: { ...decision, selectedModel },
    fallbacks: getFallbackChain(selectedModel),
    available,
    formattedPrompt
  };
}

/**
 * Get router statistics and insights
 */
export function getRouterStats(): {
  supportedModels: string[];
  availableModels: string[];
  routingRules: Record<string, string>;
} {
  return {
    supportedModels: Object.values(AIModel),
    availableModels: getAvailableModels(),
    routingRules: {
      code: 'ChatGPT (GPT-4)',
      reasoning: 'Claude (Opus)',
      vision: 'Gemini (Pro)',
      creative: 'Grok (2)',
      content: 'Claude (Opus)',
      general: 'Claude (Opus)'
    }
  };
}
