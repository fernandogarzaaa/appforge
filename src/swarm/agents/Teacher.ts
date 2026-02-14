import fs from 'fs';
import path from 'path';
import { broadcastLog } from '../../server.js';

export class Teacher {
    private MEMORY_DIR = path.resolve(process.cwd(), 'memory/synthetic_data');
    private DATA_FILE = path.join(this.MEMORY_DIR, 'fine_tuning.jsonl');

    constructor() {
        if (!fs.existsSync(this.MEMORY_DIR)) {
            fs.mkdirSync(this.MEMORY_DIR, { recursive: true });
        }
    }

    /**
     * harvestLesson:
     * Saves a successful prompt-code pair to the fine-tuning dataset.
     */
    async harvestLesson(prompt: string, code: string, validationLog: string): Promise<void> {
        const lesson = {
            prompt,
            completion: code,
            validation: validationLog,
            timestamp: new Date().toISOString(),
            metadata: {
                source: 'AppForge_Swarm_v1',
                rating: 5 // Implicit 5-star rating for passing Iron Guard
            }
        };

        // Append to JSONL file
        const entry = JSON.stringify(lesson) + '\n';
        fs.appendFileSync(this.DATA_FILE, entry);

        broadcastLog('TEACHER', `Harvested new synthetic training example.`, 'SUCCESS');
    }
}
