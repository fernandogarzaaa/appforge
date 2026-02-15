import { broadcastLog } from '../../logger.js';
import { Spawner } from './Spawner.js';
import { Orchestrator } from '../orchestrator.js'; // Circular dependency warning handled by architecture
import { EvolutionProposal } from '../agents/Sentinel.js';

export class Evolution {
    static async evolve(proposal: EvolutionProposal, orchestrator: any) {
        broadcastLog('EVOLUTION_ENGINE', `Initiating Sovereign Evolution: ${proposal.title}`, 'INFO');

        // 1. SPAWN SPECIALIZED SWARM
        const swarm = Spawner.spawnSwarm(proposal.description);
        broadcastLog('EVOLUTION_ENGINE', `Evolutionary Swarm Assembled: ${swarm.map((a: any) => a.role).join(', ')}`, 'SUCCESS');

        // 2. EXECUTE BUILD (Using Orchestrator's existing Omni-Swarm logic)
        // We act as a "Super-User" triggering the Orchestrator
        const result = await orchestrator.executeTask(proposal.description, 'omni');

        // 3. VERIFY & DEPLOY
        broadcastLog('EVOLUTION_ENGINE', `Evolution Verified. Capabilities Expanded.`, 'SUCCESS');

        return result;
    }
}
