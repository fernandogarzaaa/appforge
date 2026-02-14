import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

interface LLMRequest {
    model?: string; // e.g., 'llama3', 'gpt-4o', 'claude-3-5-sonnet-20240620'
    system: string;
    prompt: string;
    temperature?: number;
}

import { SovereignInference } from './core/Inference.js';

export const generateText = async (req: LLMRequest) => {
    return await SovereignInference.execute(req);
};
