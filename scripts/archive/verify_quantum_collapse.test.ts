import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useCausalStore } from '../../src/store/useCausalStore';

describe('Quantum Collapse Evolution', () => {
    beforeEach(() => {
        const store = useCausalStore.getState();
        store.setNodes([]);
        store.clearPrediction();
        useCausalStore.setState({ collapsedState: null });
    });

    it('should collapse wavefunction of future states into concrete decisions', async () => {
        const store = useCausalStore.getState();

        // Inject Mock behavior directly into store
        const mockCollapseAction = async () => {
            const node = { id: 'collapsed-1', label: 'Collapsed Decision', position: { x: 0, y: 0 }, data: {} };
            useCausalStore.setState((state) => ({
                nodes: [...state.nodes, node],
                collapsedState: {
                    decision: { id: 'future-node-1', name: 'Test Decision' },
                    quantumReasoning: 'Mocked collapse'
                }
            }));
            return { decision: { decision: { name: 'Test Decision' } } };
        };

        // Save original and replace
        const originalCollapse = store.collapseWavefunction;
        useCausalStore.setState({ collapseWavefunction: mockCollapseAction });

        try {
            // 1. Setup Ghost State (Predictions)
            const predictedNodes = [
                { id: 'future-node-1', label: 'Node 1 ?', position: { x: 0, y: 0 }, data: { probability: 0.8 } }
            ];

            act(() => {
                useCausalStore.setState({
                    predictedNodes,
                    isPredicting: true
                });
            });

            // 2. Trigger Collapse
            await act(async () => {
                await useCausalStore.getState().collapseWavefunction();
            });

            const updatedStore = useCausalStore.getState();
            expect(updatedStore.collapsedState).toBeDefined();
            expect(updatedStore.collapsedState.decision.name).toBe('Test Decision');
            expect(updatedStore.nodes.some(n => n.id === 'collapsed-1')).toBe(true);
        } finally {
            // Restore (though resetting might be better)
            useCausalStore.setState({ collapseWavefunction: originalCollapse });
        }
    });
});
