/**
 * 🧪 WASM Acceleration Tests
 * 
 * Verifies that the WASM loader works correctly with JavaScript fallback.
 * Since WASM is not built yet, this tests the JS fallback path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the WASM module to simulate it not being available
vi.mock('@/quantum-core/pkg', () => {
    throw new Error('WASM not available in test environment');
});

// Import after mocking
import {
    levenshteinDistance,
    calculateSimilarity,
    measureSystemHealth,
    buildExecutionOrder,
    calculatePerformanceScore,
    quantumAnneal,
    loadQuantumCore,
    isWasmAccelerated
} from '../wasmLoader';

describe('🦀 Quantum Core WASM Loader (JS Fallback)', () => {
    beforeEach(() => {
        // Reset module state between tests
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should load without throwing when WASM unavailable', async () => {
            const result = await loadQuantumCore();
            expect(result).toBeDefined();
            expect(result.usingWasm).toBe(false);
        });

        it('should report WASM not accelerated', async () => {
            await loadQuantumCore();
            const accelerated = isWasmAccelerated();
            expect(accelerated).toBe(false);
        });
    });

    describe('Levenshtein Distance (JS Fallback)', () => {
        it('should calculate distance for identical strings', async () => {
            const distance = await levenshteinDistance('hello', 'hello');
            expect(distance).toBe(0);
        });

        it('should calculate distance for different strings', async () => {
            const distance = await levenshteinDistance('kitten', 'sitting');
            expect(distance).toBe(3);
        });

        it('should handle empty strings', async () => {
            expect(await levenshteinDistance('', 'abc')).toBe(3);
            expect(await levenshteinDistance('abc', '')).toBe(3);
            expect(await levenshteinDistance('', '')).toBe(0);
        });

        it('should handle single character differences', async () => {
            expect(await levenshteinDistance('cat', 'bat')).toBe(1);
            expect(await levenshteinDistance('cats', 'cat')).toBe(1);
        });
    });

    describe('String Similarity (JS Fallback)', () => {
        it('should return 1 for identical strings', async () => {
            const similarity = await calculateSimilarity('test', 'test');
            expect(similarity).toBe(1);
        });

        it('should return value between 0 and 1 for similar strings', async () => {
            const similarity = await calculateSimilarity('hello', 'hallo');
            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThan(1);
            expect(similarity).toBeCloseTo(0.8, 1);
        });

        it('should return 0 for completely different strings of same length', async () => {
            const similarity = await calculateSimilarity('abcd', 'wxyz');
            expect(similarity).toBe(0);
        });
    });

    describe('System Health Metrics (JS Fallback)', () => {
        it('should calculate metrics correctly', async () => {
            const metrics = await measureSystemHealth(10, 2, 3);

            expect(metrics).toBeDefined();
            expect(metrics.entropy).toBeGreaterThanOrEqual(0);
            expect(metrics.coherence).toBeGreaterThanOrEqual(0);
            expect(metrics.stability).toBeGreaterThanOrEqual(0);
        });

        it('should detect superposition state with ghost nodes', async () => {
            const withGhosts = await measureSystemHealth(10, 2, 3);
            expect(withGhosts.superposition_active).toBe(true);
        });

        it('should detect collapsed state without ghost nodes', async () => {
            const noGhosts = await measureSystemHealth(10, 0, 3);
            expect(noGhosts.superposition_active).toBe(false);
        });

        it('should calculate entropy based on ghosts and entanglements', async () => {
            const metrics = await measureSystemHealth(10, 5, 4);
            // entropy = min(100, (5 * 10) + (4 * 5)) = min(100, 70) = 70
            expect(metrics.entropy).toBe(70);
        });
    });

    describe('Workflow Execution Order (JS Fallback)', () => {
        it('should build execution order for simple DAG', async () => {
            const nodes = ['trigger', 'process', 'output'];
            const connections = [
                { from: 'trigger', to: 'process' },
                { from: 'process', to: 'output' }
            ];

            const result = await buildExecutionOrder(nodes, connections);

            expect(result.order).toEqual(['trigger', 'process', 'output']);
            expect(result.hasCycle).toBe(false);
        });

        it('should handle branching workflows', async () => {
            const nodes = ['start', 'a', 'b', 'end'];
            const connections = [
                { from: 'start', to: 'a' },
                { from: 'start', to: 'b' },
                { from: 'a', to: 'end' },
                { from: 'b', to: 'end' }
            ];

            const result = await buildExecutionOrder(nodes, connections);

            expect(result.hasCycle).toBe(false);
            expect(result.order[0]).toBe('start');
            expect(result.order[result.order.length - 1]).toBe('end');
        });

        it('should detect cycles', async () => {
            const nodes = ['a', 'b', 'c'];
            const connections = [
                { from: 'a', to: 'b' },
                { from: 'b', to: 'c' },
                { from: 'c', to: 'a' }  // Cycle!
            ];

            const result = await buildExecutionOrder(nodes, connections);
            expect(result.hasCycle).toBe(true);
        });
    });

    describe('Performance Score (JS Fallback)', () => {
        it('should return 100 for perfect metrics', async () => {
            const score = await calculatePerformanceScore(
                2000,  // LCP (good < 2500)
                50,    // FID (good < 100)
                0.05,  // CLS (good < 0.1)
                1500,  // FCP (good < 1800)
                500    // TTFB (good < 800)
            );
            expect(score).toBe(100);
        });

        it('should return 0 for poor metrics', async () => {
            const score = await calculatePerformanceScore(
                5000,  // LCP (poor > 4000)
                500,   // FID (poor > 300)
                0.5,   // CLS (poor > 0.25)
                4000,  // FCP (poor > 3000)
                2500   // TTFB (poor > 1800)
            );
            expect(score).toBe(0);
        });

        it('should handle missing metrics', async () => {
            const score = await calculatePerformanceScore(
                2000,  // LCP
                null,  // FID not measured
                null,  // CLS not measured
                1500,  // FCP
                null   // TTFB not measured
            );
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('Quantum Annealing (JS Fallback)', () => {
        it('should run annealing optimization', async () => {
            const result = await quantumAnneal(100, {
                initialTemperature: 1000,
                coolingRate: 0.95,
                maxIterations: 100
            });

            expect(result).toBeDefined();
            expect(result.iterations).toBeGreaterThan(0);
            expect(typeof result.bestEnergy).toBe('number');
            expect(result.accelerated).toBe(false); // JS fallback
        });

        it('should use default options', async () => {
            const result = await quantumAnneal(50);
            expect(result.iterations).toBeGreaterThan(0);
            expect(result.accelerated).toBe(false);
        });

        it('should find better energy than initial', async () => {
            const result = await quantumAnneal(100, {
                initialTemperature: 5000,
                coolingRate: 0.99,
                maxIterations: 500
            });
            // Annealing should find equal or better energy
            expect(result.bestEnergy).toBeLessThanOrEqual(100);
        });
    });
});
