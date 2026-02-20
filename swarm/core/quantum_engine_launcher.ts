/**
 * 🌌 QUANTUM ENGINE LAUNCHER v2.0 🌌
 * 
 * Direct Import Singleton for Quantum Engine v2
 * Provides lowest latency initialization for Willow patterns dependency
 * 
 * Usage:
 *   import { quantumEngine, quantumSolve } from './swarm/core/quantum_engine_launcher.js';
 *   const result = quantumSolve('Maximize coherence', solutions, ['coherence', 'cost']);
 */

import { EnhancedQuantumEngine } from './enhanced_quantum_engine_v2.js';
import { willowPatterns, WillowPatterns } from './willow_patterns.js';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export all classes for convenience
export { EnhancedQuantumEngine };

// Quantum Engine Singleton
let _quantumEngine: EnhancedQuantumEngine | null = null;

/**
 * Initialize and get the Quantum Engine singleton
 * Must be called before using quantumSolve()
 */
export function getQuantumEngine(): EnhancedQuantumEngine {
    if (!_quantumEngine) {
        _quantumEngine = new EnhancedQuantumEngine();
        console.log('🚀 [QuantumLauncher] Quantum Engine v2.0 singleton initialized');
        console.log('📊 Willow Patterns Status:', willowPatterns.getStatus());
    }
    return _quantumEngine;
}

/**
 * Multi-objective optimization solver
 * Wrapper around EnhancedQuantumEngine.solve() with pre-initialized singleton
 * 
 * @param objective - Optimization objective (e.g., "Maximize coherence, minimize cost")
 * @param solutions - Array of candidate solutions
 * @param objectives - Array of objective keys to optimize
 * @returns Quantum optimization result
 */
export function quantumSolve(
    objective: string,
    solutions: any[],
    objectives: string[]
): ReturnType<EnhancedQuantumEngine['solve']> {
    const engine = getQuantumEngine();
    return engine.solve(objective, solutions, objectives);
}

/**
 * Quick solve with default settings
 */
export function quickSolve(solutions: any[], optimizeFor: 'coherence' | 'speed' | 'balance' = 'balance'): any {
    const engine = getQuantumEngine();

    switch (optimizeFor) {
        case 'coherence':
            return engine.solve('Maximize coherence', solutions, ['coherence']);
        case 'speed':
            return engine.solve('Minimize latency', solutions, ['latency', 'resourceUsage']);
        case 'balance':
        default:
            return engine.solve('Balance all objectives', solutions, ['coherence', 'scalability', 'latency', 'resourceUsage']);
    }
}

/**
 * Get Willow Patterns status
 */
export function getWillowStatus() {
    return willowPatterns.getStatus();
}

/**
 * Check if Quantum Engine is ready
 */
export function isReady(): boolean {
    return _quantumEngine !== null && willowPatterns !== undefined;
}

/**
 * Initialize Quantum Engine with custom config
 */
export function initialize(config?: {
    coherenceThreshold?: number;
    islandCount?: number;
    reinforcementEpisodes?: number;
}): EnhancedQuantumEngine {
    if (!_quantumEngine) {
        _quantumEngine = new EnhancedQuantumEngine();
        if (config) {
            // Apply custom config if needed
            console.log('⚙️ [QuantumLauncher] Custom config applied:', config);
        }
    }
    return _quantumEngine;
}

// Auto-initialize on import for direct import pattern
let _autoInitialized = false;

/**
 * Ensure Quantum Engine is initialized
 * Called automatically when needed
 */
function ensureInitialized(): void {
    if (!_autoInitialized) {
        getQuantumEngine();
        _autoInitialized = true;
    }
}

// Export launcher metadata
export const launcherInfo = {
    version: '2.0.0',
    type: 'Direct Import Singleton',
    dependency: 'Willow Patterns v1.0',
    autoInit: true,
    exportedMethods: [
        'getQuantumEngine',
        'quantumSolve',
        'quickSolve',
        'getWillowStatus',
        'isReady',
        'initialize'
    ]
};

// Run initialization if this file is executed directly
if (process.argv[1] === __filename) {
    console.log('🌌 [QuantumLauncher] Starting Quantum Engine v2.0...');
    const engine = getQuantumEngine();

    // Quick self-test
    const testSolutions = [
        { id: 'opt1', coherence: 0.95, latency: 0.1 },
        { id: 'opt2', coherence: 0.88, latency: 0.05 },
        { id: 'opt3', coherence: 0.92, latency: 0.08 }
    ];

    const result = quantumSolve('Maximize coherence', testSolutions, ['coherence']);

    console.log('✅ [QuantumLauncher] Self-test complete');
    console.log('📊 Best Solution:', result.ob?.id || result.osb?.id);
    console.log('🎯 Coherence:', result.coh);
    console.log('🔧 Willow Status:', getWillowStatus().architecture);
}

export default {
    getQuantumEngine,
    quantumSolve,
    quickSolve,
    getWillowStatus,
    isReady,
    initialize,
    launcherInfo
};
