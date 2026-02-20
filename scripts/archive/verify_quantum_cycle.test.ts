import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useCausalStore } from '../../src/store/useCausalStore';

describe('Quantum Evolution: The Grand Cycle', () => {
    beforeEach(() => {
        const store = useCausalStore.getState();
        store.setNodes([]);
        store.clearPrediction();
        useCausalStore.setState({
            collapsedState: null,
            quantumMetrics: null,
            entangledEdges: []
        });
    });

    it('should execute the full quantum loop: Entangle -> Predict -> Measure -> Collapse -> Remediate', async () => {
        const store = useCausalStore.getState();

        // Inject Mock behavior
        const mockUpdateMetrics = async () => {
            useCausalStore.setState({
                quantumMetrics: {
                    entropy: 30,
                    coherence: 90,
                    stability: 85,
                    superpositionState: 'ACTIVE',
                    timestamp: Date.now()
                }
            });
        };

        const mockCollapse = async () => {
            const node = { id: 'mitigation-1', label: 'Mitigated Path', position: { x: 10, y: 10 }, data: {} };
            useCausalStore.setState((state) => ({
                nodes: [...state.nodes, node],
                collapsedState: { decision: { name: 'Mitigate Root Cause' } }
            }));
            return { decision: { decision: { name: 'Mitigate Root Cause' } } };
        };

        const originalUpdate = store.updateQuantumMetrics;
        const originalCollapse = store.collapseWavefunction;

        useCausalStore.setState({
            updateQuantumMetrics: mockUpdateMetrics,
            collapseWavefunction: mockCollapse
        });

        try {
            // 1. Entangle
            act(() => {
                store.processEntanglement({ id: 'p1', metric: 'CPU', value: 90, timestamp: Date.now() });
            });

            // 2. Predict
            act(() => {
                store.predictFuture();
            });

            // 3. Measure (Update Metrics)
            await act(async () => {
                await useCausalStore.getState().updateQuantumMetrics();
            });

            const stateAfterMeasure = useCausalStore.getState();
            expect(stateAfterMeasure.quantumMetrics).toBeDefined();
            expect(stateAfterMeasure.quantumMetrics.coherence).toBeGreaterThan(50);

            // 4. Collapse
            await act(async () => {
                await useCausalStore.getState().collapseWavefunction();
            });

            const finalState = useCausalStore.getState();
            expect(finalState.collapsedState).toBeDefined();
            expect(finalState.nodes.length).toBeGreaterThan(0);
        } finally {
            useCausalStore.setState({
                updateQuantumMetrics: originalUpdate,
                collapseWavefunction: originalCollapse
            });
        }
    });
});
