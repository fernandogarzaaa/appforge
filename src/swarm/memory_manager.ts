import fs from 'fs';
import path from 'path';
import { generateText } from './llm_client';

const MEMORY_DIR = path.resolve(process.cwd(), 'src/swarm/memory');

export interface Memory {
    id: string;
    task: string;
    solution: string;
    timestamp: number;
    tags: string[];
}

export class MemoryManager {
    constructor() {
        if (!fs.existsSync(MEMORY_DIR)) {
            fs.mkdirSync(MEMORY_DIR, { recursive: true });
        }
    }

    async memorize(task: string, solution: string, tags: string[] = []) {
        const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const memory: Memory = {
            id,
            task,
            solution,
            timestamp: Date.now(),
            tags
        };

        const filePath = path.join(MEMORY_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
        console.log(`🧠 MEMORIZED: ${id} [${tags.join(', ')}]`);
        return id;
    }

    async retrieve(taskDescription: string): Promise<string | null> {
        const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.json'));
        if (files.length === 0) return null;

        const memories: Memory[] = files.map(f => {
            return JSON.parse(fs.readFileSync(path.join(MEMORY_DIR, f), 'utf-8'));
        });

        // Use LLM to find the most relevant memory
        const prompt = `
Given the current task: "${taskDescription}"
And the following stored memories of previous solutions:
${memories.map(m => `ID: ${m.id} | TASK: ${m.task} | TAGS: ${m.tags.join(', ')}`).join('\n')}

Identify the ID of the most relevant memory that can help solve the current task. 
If none are relevant, return "NONE".
Only return the ID or "NONE".
`;

        const bestId = await generateText({
            system: "You are the Swarm Memory Retrieval unit. Your goal is to find architectural patterns from the past.",
            prompt: prompt,
            model: 'llama3', // Use local model for quick retrieval
            temperature: 0.1
        });

        const match = memories.find(m => m.id === bestId.trim());
        if (match) {
            console.log(`🔍 RETRIEVED MEMORY: ${match.id}`);
            return match.solution;
        }

        return null;
    }
}

export const memoryManager = new MemoryManager();
