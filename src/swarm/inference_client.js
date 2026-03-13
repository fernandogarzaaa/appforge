import dotenv from 'dotenv';
dotenv.config();
import { SovereignInference } from './core/Inference.js';
export const generateText = async (req) => {
    return await SovereignInference.execute(req);
};
export const getOpenAI = async () => {
    const OpenAI = (await import('openai')).default;
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};
export const getAnthropic = async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};
