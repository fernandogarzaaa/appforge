import { EnhancedQuantumEngine } from './enhanced_quantum_engine_v2.js';
import { AIRequest } from './llm.js';
import { sovereignLLM } from './sovereign_llm.js';
import { sovereignModel } from './sovereign_model.js';
import { hyperBrain } from './sovereign_hyper_brain.js';
import { willowPatterns } from './willow_patterns.js';
import { Base44Tool } from '../tools/base44.js';
import swarmKnowledge from './knowledge.js';

/**
 * 🌌 QUANTUM CONSENSUS CLIENT
 * 
 * Replaces linear fallback with a decentralized, multi-vector intelligence pulse.
 * Every response is a synthesis of multiple brain layers, weighted by resonance.
 */
export class QuantumConsensusClient {
    private engine: EnhancedQuantumEngine;

    constructor(base44: Base44Tool) {
        this.engine = new EnhancedQuantumEngine();

        // Initialize the Quantum Swarm with our 3 Brain Layers
        this.engine.sw.add('physical_brain', 'SOVEREIGN_MODEL');
        this.engine.sw.add('synthetic_brain', 'SOVEREIGN_LLM');
        this.engine.sw.add('hyper_brain', 'WILLOW_ACCELERATED');
    }

    async chat(request: AIRequest): Promise<string> {
        console.log('🌀 [QuantumConsensus] Orchestrating decentralized intelligence pulse...');

        // 1. Concurrent Execution: Get proposals from all available brain layers
        const proposals = await this.collectProposals(request);

        if (proposals.length === 0) {
            return "🚨 [Cognitive Error] Total wave-function collapse: No brain layers responded.";
        }

        // 2. Quantum Solve: Use the engine to find the most coherent synthesis
        // We evaluate based on stability, resonance with knowledge, and clarity
        const criteria = ['stability', 'coherence', 'alignment', 'clarity'];
        const solveResult = await this.engine.solve(request.user, proposals, criteria);

        const bestResponse = solveResult.osb || solveResult.ob;

        const willowStatus = willowPatterns.getStatus();
        console.log(`✨ [QuantumConsensus] Synthesis Complete. Coherence: ${(solveResult.coh * 100).toFixed(2)}% | Fidelity: ${(willowStatus.fidelity * 100).toFixed(2)}%`);

        return bestResponse.content;
    }

    private async collectProposals(request: AIRequest): Promise<any[]> {
        const proposals: any[] = [];

        // --- SOVEREIGN DIRECTIVE (Zero Regression) ---
        // Ensure all models are aware of the stabilized state
        await swarmKnowledge.load();
        const stableList = swarmKnowledge.knowledge.stable_files || [];
        const stableFilesStr = stableList.length > 0 ? `\n- IMMUTABLE COGNITIVE LOCK: ${stableList.join(', ')}. DO NOT modify.` : '';
        const directive = `\n\n⚖️ SOVEREIGN DIRECTIVE:${stableFilesStr}\nMaintain wave-function stability. Prioritize ES standard imports.`;

        const optimizedRequest = {
            ...request,
            system: request.system + directive
        };

        const tasks = [
            // Layer 1: Physical Brain (Local)
            (async () => {
                try {
                    const res = await sovereignModel.chat(optimizedRequest);
                    if (res) return { source: 'physical_brain', content: res.choices[0].message.content, confidence: 1.0 };
                } catch (e) { return null; }
            })(),
            // Layer 2: Synthetic Brain (Gateway)
            (async () => {
                try {
                    const res = await sovereignLLM.chat(optimizedRequest);
                    if (res) return { source: 'synthetic_brain', content: res.choices[0].message.content, confidence: 0.8 };
                } catch (e) { return null; }
            })(),
            // Layer 3: Hyper Intelligence (Willow-Accelerated local expert)
            (async () => {
                try {
                    const res = await hyperBrain.chat(optimizedRequest);
                    if (res) return { source: 'hyper_brain', content: res, confidence: 0.95 };
                } catch (e) { return null; }
            })()
        ];

        const results = await Promise.all(tasks);
        return results.filter(r => r !== null && r !== undefined);
    }
}
