import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCausalStore } from '../src/store/useCausalStore';

// Mock the Quantum Engine and Collapse service to avoid external dependencies
vi.mock('../src/services/QuantumCollapse.js', () => {
    return {
        QuantumCollapse: class {
            async collapse(predictedNodes, entanglements) {
                return {
                    decision: { id: 'future-node-1', name: 'Mitigate Node 1', probability: 0.95 },
                    collapsedNodeId: 'future-node-1',
                    confidence: 0.9,
                    quantumReasoning: 'Verified quantum collapse'
                };
            }
        }
    };
});

vi.mock('../src/utils/QuantumEngine.js', () => {
    return {
        QuantumInspiredAI: class {
            measureSystemHealth(nodes, entanglements) {
                return {
                    entropy: 10 + (nodes.length * 2),
                    coherence: 90 - (entanglements.length * 5),
                    stability: 85,
                    superpositionState: nodes.some(n => n.id.startsWith('future-')) ? 'ACTIVE' : 'COLLAPSED',
                    entanglementCount: entanglements.length,
                    timestamp: Date.now()
                };
            }
        }
    };
});

describe('Quantum Evolution: The Grand Cycle', () => {
    beforeEach(() => {
        const store = useCausalStore.getState();
        store.setNodes([]);
        store.clearPrediction();
        useCausalStore.setState({
            collapsedState: null,
            entangledEdges: [],
            quantumMetrics: null
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should execute the full quantum loop: Entangle -> Predict -> Measure -> Collapse -> Remediate', async () => {
        const store = useCausalStore.getState();

        // 1. Setup Initial State (Classical)
        const initialNodes = [{ id: 'node-1', label: 'CPU Metric', position: { x: 0, y: 0 }, data: {} }];
        act(() => store.setNodes(initialNodes));

        // 2. Entanglement (Observer Effect)
        // Simulate a stream packet causing entanglement
        act(() => {
            store.processEntanglement({ id: 'packet-1', metric: 'CPU', value: 90 });
        });

        let currentState = useCausalStore.getState();
        expect(currentState.entangledEdges).toHaveLength(1);
        expect(currentState.entangledEdges[0].target).toBe('node-1');

        // 3. Update Observability (Check Metrics)
        await act(async () => {
            await store.updateQuantumMetrics();
        });
        currentState = useCausalStore.getState();
        expect(currentState.quantumMetrics).toBeDefined();
        // Base entropy 10 + 2 (1 node) = 12
        expect(currentState.quantumMetrics.entropy).toBeGreaterThan(10);

        // 4. Prediction (Superposition)
        act(() => {
            store.predictFuture();
        });
        currentState = useCausalStore.getState();
        expect(currentState.isPredicting).toBe(true);
        expect(currentState.predictedNodes).toHaveLength(1); // Ghost node created

        // 5. Measure System Health (Superposition Check)
        await act(async () => {
            await store.updateQuantumMetrics();
        });
        currentState = useCausalStore.getState();
        expect(currentState.quantumMetrics.superpositionState).toBe('ACTIVE');

        // 6. Quantum Collapse (Decision)
        await act(async () => {
            await store.collapseWavefunction();
        });
        currentState = useCausalStore.getState();
        expect(currentState.collapsedState).toBeDefined();
        expect(currentState.collapsedState.decision.id).toBe('future-node-1');

        // 7. Auto-Remediation (Resolution)
        act(() => {
            store.autoRemediate();
        });
        currentState = useCausalStore.getState();

        // Predictions cleared
        expect(currentState.predictedNodes).toHaveLength(0);
        expect(currentState.isPredicting).toBe(false);
        expect(currentState.collapsedState).toBeNull();

        // Resolution node added
        const resolutionNode = currentState.nodes.find(n => n.id.startsWith('resolution-'));
        expect(resolutionNode).toBeDefined();
        expect(resolutionNode.label).toContain('Mitigate Node 1');

        // 8. Final Observability Check (Collapsed State)
        await act(async () => {
            await store.updateQuantumMetrics();
        });
        currentState = useCausalStore.getState();
        expect(currentState.quantumMetrics.superpositionState).toBe('COLLAPSED');
    });
});
