import init, { QuantumState } from '../../quantum-core/pkg/quantum_core';
let initPromise = null;
const wasmUrl = new URL('../../quantum-core/pkg/quantum_core_bg.wasm', import.meta.url);
export const initQuantumCore = async () => {
    if (!initPromise) {
        initPromise = init(wasmUrl)
            .then(() => undefined)
            .catch((error) => {
            initPromise = null;
            throw error;
        });
    }
    return initPromise;
};
/**
 * Runs the Rust-based Coherent Interference algorithm to derive a consensus probability.
 */
export const validateWithRust = async (modelResponses) => {
    if (!modelResponses || modelResponses.length === 0) {
        return 0;
    }
    try {
        await initQuantumCore();
    }
    catch (error) {
        console.error('[QuantumCore] Failed to initialize WASM module', error);
        return fallbackConsensus(modelResponses);
    }
    const [primary, ...others] = modelResponses;
    const qState = new QuantumState(primary.confidence);
    others.forEach((comparison) => {
        const semanticAgreement = calculateSimilarity(primary.text, comparison.text);
        qState.apply_interference(comparison.confidence, semanticAgreement);
    });
    return qState.measure_probability();
};
// Lightweight token-overlap similarity used when WASM is available
const calculateSimilarity = (textA, textB) => {
    const aTokens = tokenize(textA);
    const bTokens = tokenize(textB);
    if (aTokens.size === 0 || bTokens.size === 0)
        return 0.0;
    const intersection = [...aTokens].filter((t) => bTokens.has(t)).length;
    const union = new Set([...aTokens, ...bTokens]).size;
    return union === 0 ? 0 : intersection / union;
};
const tokenize = (text) => {
    return new Set(text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean));
};
// If WASM init fails, fall back to an averaged confidence.
const fallbackConsensus = (modelResponses) => {
    const avg = modelResponses.reduce((sum, r) => sum + Math.max(0, r.confidence), 0) /
        modelResponses.length;
    return Math.min(Math.max(avg, 0), 1);
};
