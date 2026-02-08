import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCausalStore } from '../src/store/useCausalStore';

// Mock the dynamic import of QuantumCollapse service
vi.mock('../src/services/QuantumCollapse.js', () => {
    return {
        QuantumCollapse: class {
            async collapse(predictedNodes, entanglements) {
                return {
                    decision: { id: 'future-node-1', name: 'Mitigate Node 1', probability: 0.95 },
                    collapsedNodeId: 'future-node-1',
                    confidence: 0.9,
                    quantumReasoning: 'Mocked quantum collapse'
                };
            }
        }
    };
});

describe('Quantum Collapse Evolution', () => {
    beforeEach(() => {
        const store = useCausalStore.getState();
        store.setNodes([]);
        store.clearPrediction();
        useCausalStore.setState({ collapsedState: null });
    });

    it('should collapse wavefunction when predictions exist', async () => {
        const store = useCausalStore.getState();

        // 1. Setup Ghost State (Predictions)
        const predictedNodes = [
            { id: 'future-node-1', label: 'Node 1 ?', position: { x: 0, y: 0 }, data: { probability: 0.8 } }
        ];

        // 2. Setup Entanglement Context
        const entanglements = [
            { id: 'e1', target: 'node-1', source: 'stream', strength: 50, isQuantum: true }
        ];

        // Manually set state since predictFuture is internal
        act(() => {
            useCausalStore.setState({
                predictedNodes,
                isPredicting: true,
                entangledEdges: entanglements
            });
        });

        // 3. Trigger Collapse
        await act(async () => {
            await store.collapseWavefunction();
        });

        const updatedStore = useCausalStore.getState();

        expect(updatedStore.collapsedState).toBeDefined();
        expect(updatedStore.collapsedState.decision.id).toBe('future-node-1');
        expect(updatedStore.collapsedState.quantumReasoning).toBe('Mocked quantum collapse');
    });
});
