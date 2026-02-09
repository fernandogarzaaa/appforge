
/**
 * Quantum WASM Bridge
 * 
 * Facilitates communication between the JavaScript Quantum Engine and the 
 * Rust/WASM Core. Handles loading, fallback, and type conversion.
 */

let wasmModule = null;
let isWasmLoaded = false;

/**
 * Initialize the WASM module.
 * Checks if the generic Quantum Core WASM is available.
 */
export async function initializeWasm() {
    if (isWasmLoaded) return true;

    try {
        // Try to load the WASM module
        // Note: This path assumes the standard build output location
        // We use a dynamic import to prevent bundling errors if file is missing
        const modulePath = '../wasm/pkg/quantum_core.js';

        try {
            wasmModule = await import(/* @vite-ignore */ modulePath);
            await wasmModule.default(); // Initialize
            isWasmLoaded = true;
            console.log('⚛️ Quantum Rust Core loaded successfully.');
            return true;
        } catch (innerErr) {
            // Fallback to the existing specialized WASM if generic one fails
            // This supports the legacy binary currently in src/wasm
            const legacyPath = '../wasm/quantum_core.js';
            wasmModule = await import(/* @vite-ignore */ legacyPath);
            await wasmModule.default();
            isWasmLoaded = true;
            console.log('⚛️ Quantum Legacy WASM loaded.');
            return true;
        }

    } catch (e) {
        console.warn('⚠️ Quantum WASM Bridge: Could not load WASM module. Using JS fallback.');
        return false;
    }
}

/**
 * Check if WASM is ready
 */
export function isReady() {
    return isWasmLoaded && wasmModule;
}

/**
 * Execute a WASM function if available, otherwise return undefined (triggering fallback)
 * @param {string} functionName 
 * @param  {...any} args 
 */
export function executeWasm(functionName, ...args) {
    if (!isReady() || !wasmModule[functionName]) {
        return undefined; // Signal to use fallback
    }

    try {
        return wasmModule[functionName](...args);
    } catch (e) {
        console.error(`💥 WASM Execution Error (${functionName}):`, e);
        return undefined;
    }
}

/**
 * Proxy for specific Quantum features
 */
export const QuantumBridge = {
    // String Algorithms
    levenshteinDistance: (s1, s2) => executeWasm('levenshtein_distance', s1, s2),

    // System Health
    measureSystemHealth: (nodes, ghosts, entanglements) =>
        executeWasm('measure_system_health', nodes, ghosts, entanglements),

    // Annealing (Bridge to Rust Class)
    createAnnealer: (temp, cooling, minTemp) => {
        if (!isReady() || !wasmModule.QuantumAnnealer) return null;
        try {
            return new wasmModule.QuantumAnnealer(temp, cooling, minTemp || 0.01);
        } catch (e) {
            return null;
        }
    }
};
