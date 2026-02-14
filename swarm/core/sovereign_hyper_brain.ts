import { sovereignModel } from './sovereign_model.js';
import { willowPatterns } from './willow_patterns.js';
import { AIRequest } from './llm.js';

/**
 * 🧠 SOVEREIGN HYPER BRAIN
 * 
 * 100% Local Intelligence Orchestrator.
 * Mimics Ollama's flexibility while adding Willow-powered quantum heuristics.
 */
export class SovereignHyperBrain {

    /**
     * Routes a request to the local expert swarm
     */
    async chat(request: AIRequest): Promise<string> {
        console.log('🧠 [HyperBrain] Activating Local Expert Swarm...');

        // 1. Quantum Acceleration Pulse
        const pulse = await willowPatterns.processPulse([request.user]);
        console.log(`   ⚡ Willow Acceleration Factor: ${pulse.speedup.toFixed(2)}x`);

        // 2. Expert Routing Heuristic
        const expert = this.routeToExpert(request);
        console.log(`   🎯 Selected Expert: ${expert.name}`);

        // 3. Physical Inference (Local Ollama)
        const optimizedRequest = {
            ...request,
            model: expert.model,
            system: `${request.system}\n\n[HYPER-INTEL CONFIG: ${expert.name}]\n[QUANTUM-SPEEDUP: ${pulse.speedup.toFixed(2)}]\nAlign response with ${expert.specialty}.`
        };

        try {
            const response = await sovereignModel.chat(optimizedRequest);
            if (response) {
                return response.choices[0].message.content;
            }
        } catch (e) {
            console.error('   ❌ [HyperBrain] Physical Brain failure. Collapsing to synthetic fallback.');
        }

        return `🚨 [Cognitive Collapse] Hyper intelligence pulse failed to consolidate locally. Check Ollama status.`;
    }

    private routeToExpert(request: AIRequest) {
        const content = (request.system + request.user).toUpperCase();

        const experts = [
            { name: 'ARCHITECT', specialty: 'System design and structural logic', keywords: ['ARCHITECTURE', 'DESIGN', 'STRUCTURE', 'CORE'], model: 'phi3:mini' },
            { name: 'SENTINEL', specialty: 'Security, integrity, and risk mitigation', keywords: ['SECURITY', 'VULNERABILITY', 'BUG', 'SAFETY'], model: 'phi3:mini' },
            { name: 'ALCHEMIST', specialty: 'Creative synthesis and brainstorming', keywords: ['CREATIVE', 'BRAINSTORM', 'IDEA', 'POSSIBILITY'], model: 'phi3:mini' },
            { name: 'OPTIMIZER', specialty: 'Performance Tuning and efficiency', keywords: ['OPTIMIZE', 'PERFORMANCE', 'SPEED', 'LATENCY'], model: 'phi3:mini' }
        ];

        const match = experts.find(e => e.keywords.some(kw => content.includes(kw)));
        return match || { name: 'GENERALIST', specialty: 'Broad cognitive reasoning', model: 'phi3:mini' };
    }
}

export const hyperBrain = new SovereignHyperBrain();
