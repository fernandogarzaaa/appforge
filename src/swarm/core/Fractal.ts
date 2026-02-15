
import { Spawner } from '../factory_core/Spawner.js';
import { generateText } from '../inference_client.js';
import { broadcastLog } from '../../logger.js';

export interface MicroTask {
    id: string;
    description: string;
    assigned_role: string;
    complexity: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    result?: string;
}

export class FractalManager {
    /**
     * Decomposes a large task into self-similar micro-tasks.
     */
    static async decompose(task: string): Promise<MicroTask[]> {
        broadcastLog('FRACTAL', `Fracturing Task: "${task}"`, 'INFO');

        const prompt = `
            Analyze this complex task and break it down into atomic, self-contained micro-tasks.
            Task: "${task}"
            
            Return a JSON array of objects with:
            - description: specific instruction
            - assigned_role: best agent role for this (e.g., "React Specialist", "Rust Engineer")
            - complexity: 0.1 to 1.0
        `;

        try {
            const response = await generateText({ system: "You are a Fractal Architect.", prompt });
            const tasks = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());

            return tasks.map((t: any, i: number) => ({
                id: `fractal_${Date.now()}_${i}`,
                ...t,
                status: 'PENDING'
            }));
        } catch (e) {
            broadcastLog('FRACTAL', "Decomposition Failed. Executing as Monolith.", 'WARN');
            return [];
        }
    }

    /**
     * Parallel execution of micro-tasks using ephemeral swarms.
     */
    static async executeUnknown(microTasks: MicroTask[]): Promise<string[]> {
        broadcastLog('FRACTAL', `Spinning up ${microTasks.length} Ephemeral Agents...`, 'INFO');

        const results = await Promise.all(microTasks.map(async (task) => {
            // Spawn a single-purpose agent for this micro-task
            const agent = Spawner.spawnAgent(task.assigned_role);
            broadcastLog('FRACTAL', `fractal_agent_${task.id} (${task.assigned_role}) active.`, 'INFO');

            // Simple execution simulation for now - in real world would use Orchestrator logic recursively
            // For now, we just ask the LLM to solve the chunk
            const solution = await generateText({
                system: `You are ${task.assigned_role}. Solve this micro-task precisely.`,
                prompt: task.description
            });

            return `[${task.assigned_role}]: ${solution}`;
        }));

        return results;
    }
}
