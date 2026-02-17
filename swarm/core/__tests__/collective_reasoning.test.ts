import { describe, it, expect, vi } from 'vitest';
import { SingularityEngine } from '../singularity_engine';
import { P2PResonance } from '../p2p_resonance';

vi.mock('../p2p_resonance');

describe('SingularityEngine: Collective Reasoning', () => {
    it('should aggregate high confidence consensus', async () => {
        const engine = new SingularityEngine();

        // Mock peer thoughts
        const mockThoughts = [
            { nodeId: 'node-1', thought: 'Optimize Mesh', confidence: 0.9, context: 'test' },
            { nodeId: 'node-2', thought: 'Optimize Mesh', confidence: 0.85, context: 'test' },
            { nodeId: 'node-3', thought: 'Optimize Mesh', confidence: 0.95, context: 'test' }
        ];

        // Inject specific resonance buffer state (simulated)
        // Since resonanceBuffer is private, we access it via cast or we test the public method handling it.
        // For this unit test, we'll verify the weighted scoring logic directly if exposed, 
        // or mock the dependency return.

        // We will assume a public method or helper is used. 
        // If logic is internal, we might test the effect: `executeSelfImprovementCycle` with mock network data.

        // However, a purer test of the scoring math:
        const consensusScore = (engine as any).calculateConsensusScore(mockThoughts);
        expect(consensusScore).toBeGreaterThan(0.8);
    });

    it('should reject low confidence noise', () => {
        const engine = new SingularityEngine();
        const mockThoughts = [
            { nodeId: 'node-1', thought: 'Random Noise', confidence: 0.2, context: 'test' },
            { nodeId: 'node-2', thought: 'Divergent Idea', confidence: 0.3, context: 'test' }
        ];

        const consensusScore = (engine as any).calculateConsensusScore(mockThoughts);
        expect(consensusScore).toBeLessThan(0.4);
    });
});
