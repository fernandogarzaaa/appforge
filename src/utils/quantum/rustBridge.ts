import init, { QuantumState } from '../../quantum-core/pkg/quantum_core';

export type QuantumModelResponse = {
  text: string;
  confidence: number;
};

let initPromise: Promise<void> | null = null;

const wasmUrl = new URL('../../quantum-core/pkg/quantum_core_bg.wasm', import.meta.url);

export const initQuantumCore = async () => {
  if (!initPromise) {
    initPromise = init(wasmUrl).catch((error) => {
      // Reset so subsequent calls can retry
      initPromise = null;
      throw error;
    }) as Promise<void>;
  }
  return initPromise;
};

/**
 * Runs the Rust-based Coherent Interference algorithm to derive a consensus probability.
 */
export const validateWithRust = async (modelResponses: QuantumModelResponse[]) => {
  if (!modelResponses || modelResponses.length === 0) {
    return 0;
  }

  try {
    await initQuantumCore();
  } catch (error) {
    console.error('[QuantumCore] Failed to initialize WASM module', error);
    return fallbackConsensus(modelResponses);
  }

  const [primary, ...others] = modelResponses;
  const qState = QuantumState.new(primary.confidence);

  others.forEach((comparison) => {
    const semanticAgreement = calculateSimilarity(primary.text, comparison.text);
    qState.apply_interference(comparison.confidence, semanticAgreement);
  });

  return qState.measure_probability();
};

// Lightweight token-overlap similarity used when WASM is available
const calculateSimilarity = (textA: string, textB: string): number => {
  const aTokens = tokenize(textA);
  const bTokens = tokenize(textB);
  if (aTokens.size === 0 || bTokens.size === 0) return 0.0;
  const intersection = [...aTokens].filter((t) => bTokens.has(t)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
};

const tokenize = (text: string): Set<string> => {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
};

// If WASM init fails, fall back to an averaged confidence.
const fallbackConsensus = (modelResponses: QuantumModelResponse[]): number => {
  const avg =
    modelResponses.reduce((sum, r) => sum + Math.max(0, r.confidence), 0) /
    modelResponses.length;
  return Math.min(Math.max(avg, 0), 1);
};
