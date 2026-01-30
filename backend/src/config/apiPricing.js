/**
 * API Pricing Configuration
 * Real-time pricing models for supported AI providers
 * Updated: January 2026
 */

export const API_PRICING = {
  // OpenAI Pricing (per 1K tokens)
  openai: {
    provider: 'OpenAI',
    models: {
      'gpt-4o': {
        input: 0.005,      // $0.005 per 1K input tokens
        output: 0.015,     // $0.015 per 1K output tokens
        costModel: 'tokens'
      },
      'gpt-4-turbo': {
        input: 0.01,       // $0.01 per 1K input tokens
        output: 0.03,      // $0.03 per 1K output tokens
        costModel: 'tokens'
      },
      'gpt-3.5-turbo': {
        input: 0.0005,     // $0.0005 per 1K input tokens
        output: 0.0015,    // $0.0015 per 1K output tokens
        costModel: 'tokens'
      }
    },
    baseUrl: 'https://api.openai.com/v1',
    documentation: 'https://platform.openai.com/pricing'
  },

  // Anthropic Pricing (per 1M tokens)
  anthropic: {
    provider: 'Anthropic',
    models: {
      'claude-3-opus': {
        input: 15,         // $15 per 1M input tokens
        output: 75,        // $75 per 1M output tokens
        costModel: 'tokens'
      },
      'claude-3-sonnet': {
        input: 3,          // $3 per 1M input tokens
        output: 15,        // $15 per 1M output tokens
        costModel: 'tokens'
      },
      'claude-3-haiku': {
        input: 0.8,        // $0.8 per 1M input tokens
        output: 4,         // $4 per 1M output tokens
        costModel: 'tokens'
      }
    },
    baseUrl: 'https://api.anthropic.com',
    documentation: 'https://www.anthropic.com/pricing'
  },

  // Google Pricing
  google: {
    provider: 'Google',
    models: {
      'gemini-2.0-flash': {
        input: 0.075,      // $0.075 per 1M input tokens
        output: 0.3,       // $0.3 per 1M output tokens
        costModel: 'tokens'
      },
      'gemini-1.5-pro': {
        input: 1.25,       // $1.25 per 1M input tokens
        output: 5,         // $5 per 1M output tokens
        costModel: 'tokens'
      },
      'gemini-1.5-flash': {
        input: 0.075,      // $0.075 per 1M input tokens
        output: 0.3,       // $0.3 per 1M output tokens
        costModel: 'tokens'
      }
    },
    baseUrl: 'https://generativelanguage.googleapis.com',
    documentation: 'https://ai.google.dev/pricing'
  },

  // Hugging Face Pricing
  'hugging-face': {
    provider: 'Hugging Face',
    models: {
      'text-generation': {
        input: 0.0001,     // $0.0001 per token (estimated)
        output: 0.0002,    // $0.0002 per token (estimated)
        costModel: 'tokens'
      },
      'image-generation': {
        input: 0.01,       // $0.01 per image
        output: 0.01,      // $0.01 per image
        costModel: 'images'
      }
    },
    baseUrl: 'https://api-inference.huggingface.co',
    documentation: 'https://huggingface.co/pricing'
  },

  // Stripe (for payment processing)
  stripe: {
    provider: 'Stripe',
    fee: {
      percentage: 2.9,     // 2.9% per transaction
      fixed: 0.30          // + $0.30 fixed fee
    },
    documentation: 'https://stripe.com/pricing'
  },

  // AWS (Bedrock for AI models)
  aws: {
    provider: 'AWS Bedrock',
    models: {
      'claude-opus': {
        input: 15,         // $15 per 1M input tokens
        output: 75,        // $75 per 1M output tokens
        costModel: 'tokens'
      },
      'claude-sonnet': {
        input: 3,          // $3 per 1M input tokens
        output: 15,        // $15 per 1M output tokens
        costModel: 'tokens'
      }
    },
    baseUrl: 'https://bedrock.amazonaws.com',
    documentation: 'https://aws.amazon.com/bedrock/pricing/'
  }
};

/**
 * Cost Calculator Function
 * @param {string} provider - Provider name (openai, anthropic, google, etc.)
 * @param {string} model - Model name
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Cost in dollars
 */
export const calculateApiCost = (provider, model, inputTokens = 0, outputTokens = 0) => {
  const providerConfig = API_PRICING[provider];
  if (!providerConfig) return 0;

  const modelConfig = providerConfig.models?.[model];
  if (!modelConfig) return 0;

  let cost = 0;

  if (modelConfig.costModel === 'tokens') {
    // Handle different token counting bases (1K vs 1M)
    const tokenBase = provider === 'anthropic' || provider === 'aws' ? 1000000 : 1000;
    
    cost += (inputTokens / tokenBase) * modelConfig.input;
    cost += (outputTokens / tokenBase) * modelConfig.output;
  } else if (modelConfig.costModel === 'images') {
    // For image models, input/output represent count
    cost = (inputTokens + outputTokens) * modelConfig.input;
  }

  return Math.round(cost * 10000) / 10000; // Round to 4 decimals
};

export default { API_PRICING, calculateApiCost };
