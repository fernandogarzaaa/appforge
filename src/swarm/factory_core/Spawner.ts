import { broadcastLog } from '../../logger.js';

export interface AgentPersona {
    role: string;
    description: string;
    directives: string[];
}

export class Spawner {
    /**
     * spawnSwarm:
     * Analyzes the prompt and generates a list of specialized agents.
     */
    static spawnAgent(role: string): AgentPersona {
        return {
            role: role,
            description: `Ephemeral Fractal Agent: ${role}`,
            directives: ['Solve Micro-Task', 'Report back to FractalManager']
        };
    }

    static spawnSwarm(intent: string): AgentPersona[] {
        broadcastLog('SPAWNER', `Analyzing Intent: "${intent}" to spawn agents...`, 'INFO');

        // SIMULATION: In a real system, an LLM would generate these personas dynamically.
        // Here we use heuristic logic to simulate the "Pivot".

        const swarm: AgentPersona[] = [];

        if (intent.toLowerCase().includes('solar') || intent.toLowerCase().includes('energy') || intent.toLowerCase().includes('city') || intent.toLowerCase().includes('spatial')) {
            swarm.push({
                role: 'SpatialArchitect',
                description: 'Designs 3D environments and resource grids.',
                directives: ['Optimize spatial layout', 'Ensure efficient resource flow']
            });
            swarm.push({
                role: 'PhysicsEngine',
                description: 'Simulates physical constraints.',
                directives: ['Enforce gravity/thermodynamics', 'Calculate structural integrity']
            });
            swarm.push({
                role: 'InterfaceDesigner',
                description: 'Creates user controls for the simulation.',
                directives: ['Intuitive camera controls', 'Real-time data visualization']
            });
        } else if (intent.toLowerCase().includes('defi') || intent.toLowerCase().includes('token') || intent.toLowerCase().includes('economy')) {
            swarm.push({
                role: 'TokenomicsDesigner',
                description: 'Designs the economic model.',
                directives: ['Ensure sustainable inflation', 'Prevent rug-pull vectors']
            });
            swarm.push({
                role: 'SmartContractArchitect',
                description: 'Writes the Rust/Solidity code.',
                directives: ['Use SafeMath', 'Prevent Reentrancy']
            });
            swarm.push({
                role: 'SecurityAuditor',
                description: 'Audits code for vulnerabilities.',
                directives: ['Check for exploits', 'Verify access controls']
            });
        } else {
            // Universal Fallback
            swarm.push({
                role: 'LogicVanguard',
                description: 'Analyzes core logic requirements.',
                directives: ['Identify key algorithms', 'Structure data flow']
            });
            swarm.push({
                role: 'FullStackBuilder',
                description: 'Implements the end-to-end solution.',
                directives: ['Follow clean code', 'Ensure type mastery']
            });
        }

        broadcastLog('SPAWNER', `Spawned ${swarm.length} Agents: ${swarm.map(a => a.role).join(', ')}`, 'SUCCESS');
        return swarm;
    }

    static async distillDNA(intent: string, swarm: AgentPersona[]) {
        const DNA_PATH = 'memory/dna_registry.json';
        let registry: any = {};

        try {
            const fs = await import('fs');
            if (fs.existsSync(DNA_PATH)) {
                registry = JSON.parse(fs.readFileSync(DNA_PATH, 'utf-8'));
            }

            registry[intent] = {
                timestamp: new Date().toISOString(),
                agents: swarm
            };

            fs.writeFileSync(DNA_PATH, JSON.stringify(registry, null, 2));
            broadcastLog('DNA_DISTILLERY', `Preserved Swarm DNA for intent: "${intent}"`, 'SUCCESS');
        } catch (e) {
            console.error("Failed to save DNA", e);
        }
    }
}
