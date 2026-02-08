import { describe, it, expect, beforeEach } from 'vitest';
import { useCausalStore } from '../src/store/useCausalStore';

describe('⏳ Quantum Time Travel (Timeline)', () => {
    beforeEach(() => {
        // Reset Store
        useCausalStore.setState({ nodes: [], edges: [], history: [{ nodes: [], edges: [] }], historyIndex: 0 });
    });

    it('should support jumpTo (Random Access Time Travel)', () => {
        const store = useCausalStore.getState();

        // 1. Create History
        // State 0: Genesis
        store.setNodes([{ id: '1', label: 'Genesis', position: { x: 0, y: 0 }, data: {} }]);
        // State 1: Nodes Added

        useCausalStore.getState().setEdges([{ id: 'e1', source: '1', target: '2', strength: 50 }]);
        // State 2: Edge Added

        const finalState = useCausalStore.getState();
        expect(finalState.history.length).toBe(3); // 0 (empty) + 1 (nodes) + 1 (edges) = 3 states
        expect(finalState.historyIndex).toBe(2);

        // 2. Jump to Genesis (State 0)
        finalState.jumpTo(0);
        const jumpedState = useCausalStore.getState();
        expect(jumpedState.historyIndex).toBe(0);
        expect(jumpedState.nodes.length).toBe(0); // Should be empty per initialization

        // 3. Jump to Middle (State 1)
        finalState.jumpTo(1);
        const midState = useCausalStore.getState();
        expect(midState.historyIndex).toBe(1);
        expect(midState.nodes.length).toBe(1); // Should have the node
        expect(midState.edges.length).toBe(0); // Should NOT have the edge yet
    });

    it('should prevent jumping to invalid timelines', () => {
        const store = useCausalStore.getState();
        store.jumpTo(999); // Future timeline (invalid)
        expect(useCausalStore.getState().historyIndex).toBe(0);

        store.jumpTo(-1); // Before Big Bang (invalid)
        expect(useCausalStore.getState().historyIndex).toBe(0);
    });
});
