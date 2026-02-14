import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCausalStore } from '../src/store/useCausalStore';

describe('Quantum Predictive Modeling', () => {
    beforeEach(() => {
        const store = useCausalStore.getState();
        store.setNodes([]);
        store.clearPrediction();
    });

    it('should generate ghost nodes when predictFuture is called', () => {
        const store = useCausalStore.getState();

        // Setup initial state
        const initialNodes = [
            { id: 'node-1', label: 'CPU Usage', position: { x: 0, y: 0 }, data: {} },
            { id: 'node-2', label: 'Latency', position: { x: 100, y: 100 }, data: {} }
        ];

        act(() => {
            store.setNodes(initialNodes);
        });

        // Trigger Prediction
        act(() => {
            store.predictFuture();
        });

        const updatedStore = useCausalStore.getState();
        expect(updatedStore.isPredicting).toBe(true);
        expect(updatedStore.predictedNodes.length).toBe(2);

        // Verify Ghost Node properties
        expect(updatedStore.predictedNodes[0].id).toContain('future-node-1');
        expect(updatedStore.predictedNodes[0].className).toContain('opacity-60');
        expect(updatedStore.predictedNodes[0].data.probability).toBeDefined();
    });

    it('should clear predictions', () => {
        const store = useCausalStore.getState();
        store.setNodes([{ id: 'n1', label: 'test', position: { x: 0, y: 0 }, data: {} }]);

        act(() => {
            store.predictFuture();
        });

        expect(useCausalStore.getState().isPredicting).toBe(true);

        act(() => {
            store.clearPrediction();
        });

        expect(useCausalStore.getState().isPredicting).toBe(false);
        expect(useCausalStore.getState().predictedNodes.length).toBe(0);
    });
});
