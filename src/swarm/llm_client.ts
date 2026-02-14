import dotenv from 'dotenv';

dotenv.config();

interface LLMRequest {
    model?: string; // e.g., 'llama3', 'gpt-4o', 'claude-3-5-sonnet-20240620'
    system: string;
    prompt: string;
    temperature?: number;
}

import { SovereignInference } from './core/Inference.js';

/**
 * ⚛️ SOVEREIGN LLM CLIENT
 * Optimized for local-first inference.
 * Cloud SDKs are lazy-loaded only if explicitly requested.
 */
export const generateText = async (req: LLMRequest) => {
    // Phase 44: Enforce Sovereign Inference (Local Ollama)
    return await SovereignInference.execute(req);
};

// Lazy loaders for cloud SDKs (Reserved for specialized hybrid tasks)
export const getOpenAI = async () => {
    const OpenAI = (await import('openai')).default;
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

export const getAnthropic = async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};
