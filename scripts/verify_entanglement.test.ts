import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCausalStore } from '../src/store/useCausalStore';

describe('Quantum Entanglement Evolution', () => {
    beforeEach(() => {
        const store = useCausalStore.getState();
        store.setNodes([]);
    });

    it('should correlate stream packet with matching node', () => {
        const store = useCausalStore.getState();

        // Setup existing node
        const initialNodes = [
            { id: 'node-cpu', label: 'CPU Usage', position: { x: 0, y: 0 }, data: {} }
        ];

        act(() => {
            store.setNodes(initialNodes);
        });

        // Simulate incoming packet correlated with CPU
        const packet = {
            id: 'pkt-1',
            metric: 'CPU',
            value: 85.5,
            timestamp: Date.now()
        };

        // Process Entanglement
        act(() => {
            store.processEntanglement(packet);
        });

        const updatedStore = useCausalStore.getState();
        expect(updatedStore.entangledEdges.length).toBeGreaterThan(0);

        const beam = updatedStore.entangledEdges[0];
        expect(beam.target).toBe('node-cpu');
        expect(beam.source).toBe('stream');
        expect(beam.isQuantum).toBe(true);
        expect(beam.details.value).toBe(85.5);
    });

    it('should maintain max 5 entanglement beams', () => {
        const store = useCausalStore.getState();
        store.setNodes([{ id: 'n1', label: 'CPU', position: { x: 0, y: 0 }, data: {} }]);

        // Add 6 packets
        for (let i = 0; i < 6; i++) {
            act(() => {
                store.processEntanglement({ id: `pkt-${i}`, metric: 'CPU', value: i, timestamp: Date.now() });
            });
        }

        const updatedStore = useCausalStore.getState();
        expect(updatedStore.entangledEdges.length).toBeLessThanOrEqual(5);
        expect(updatedStore.entangledEdges[updatedStore.entangledEdges.length - 1].details.value).toBe(5);
    });
});
