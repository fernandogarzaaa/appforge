import { AgentPersona } from './Spawner.js';
import { broadcastLog } from '../../logger.js';

export interface WorldState {
    intent: string;
    artifacts: { [key: string]: string }; // filename -> content
    status: 'PLANNING' | 'BUILDING' | 'REVIEWING' | 'COMPLETE';
    logs: string[];
}

export class Handoff {
    private state: WorldState;

    constructor(intent: string) {
        this.state = {
            intent,
            artifacts: {},
            status: 'PLANNING',
            logs: []
        };
    }

    /**
     * executeHandoff:
     * Simulates the round-robin execution of agents.
     */
    async executeHandoff(swarm: AgentPersona[]): Promise<WorldState> {
        broadcastLog('HANDOFF', 'Initiating Universal Handoff Protocol...', 'INFO');

        for (const agent of swarm) {
            await this.agentAct(agent);
        }

        this.state.status = 'REVIEWING';
        return this.state;
    }

    private async agentAct(agent: AgentPersona) {
        broadcastLog('HANDOFF', `Pass Token >> [${agent.role}]: Active`, 'INFO');

        // SIMULATION: Agents doing work
        // In reality, this calls the LLM with the current World State + Agent Persona

        const workLog = `[${agent.role}] executing directives: ${agent.directives.join(', ')}`;
        this.state.logs.push(workLog);

        await new Promise(r => setTimeout(r, 500)); // Simulate think time
    }

    getState() {
        return this.state;
    }
}
