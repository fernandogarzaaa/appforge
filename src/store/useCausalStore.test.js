import { describe, it, expect, beforeEach } from 'vitest';
import { useCausalStore } from './useCausalStore';
describe('Quantum Causal Store', () => {
    beforeEach(() => {
        useCausalStore.setState({ nodes: [], edges: [], history: [], historyIndex: -1 });
    });
    it('should initialize with quantum default threshold', () => {
        const { threshold } = useCausalStore.getState();
        expect(threshold).toBe(70);
    });
    it('should update nodes', () => {
        const newNodes = [{ id: '1', label: 'Root Cause', position: { x: 0, y: 0 }, data: {} }];
        useCausalStore.getState().setNodes(newNodes);
        expect(useCausalStore.getState().nodes).toEqual(newNodes);
    });
    it('should handle time travel (history)', () => {
        // 1. Initial State
        const initialNodes = [{ id: '1', label: 'A', position: { x: 0, y: 0 }, data: {} }];
        useCausalStore.getState().setNodes(initialNodes);
        // 2. Change State (Should push to history)
        const nextNodes = [...initialNodes, { id: '2', label: 'B', position: { x: 10, y: 10 }, data: {} }];
        useCausalStore.getState().setNodes(nextNodes);
        // Check if history updated (This detects if our "Quantum Evolution" missed a gene)
        expect(useCausalStore.getState().history.length).toBeGreaterThan(0);
        // 3. Undo
        useCausalStore.getState().undo();
        expect(useCausalStore.getState().nodes).toEqual(initialNodes);
    });
});
