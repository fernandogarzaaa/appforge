/**
 * types.ts - Core type definitions for the LLM infrastructure
 *
 * Covers model merging, distillation, benchmarking, speculative decoding,
 * and free infrastructure management.
 */
// ─── Model Registry ────────────────────────────────────────────────────────────
export const SUPPORTED_MODELS = [
    'mistralai/Mistral-7B-v0.1',
    'teknium/OpenHermes-2.5-Mistral-7B',
    'HuggingFaceH4/zephyr-7b-beta',
    'Intel/neural-chat-7b-v3-3',
];
