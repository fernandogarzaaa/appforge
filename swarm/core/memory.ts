
import fs from 'fs';
import path from 'path';
import { MultiLLMClient } from './llm.js';

export interface MemoryItem {
    id: string;
    text: string;
    vector: number[];
    metadata: any;
    timestamp: string;
    score?: number;
}

export class SwarmMemory {
    private filePath: string;
    private items: MemoryItem[] = [];
    private llm: MultiLLMClient;

    constructor() {
        this.filePath = path.resolve('swarm_memory.json');
        this.llm = new MultiLLMClient();
        this.load();
    }

    private load() {
        if (fs.existsSync(this.filePath)) {
            try {
                this.items = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
            } catch (e) {
                console.error('⚠️ Failed to load memory:', e);
                this.items = [];
            }
        }
    }

    private save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2));
    }

    async add(text: string, metadata: any = {}) {
        const vector = await this.llm.getEmbedding(text);
        if (vector.length === 0) return; // Embedding failed

        const item: MemoryItem = {
            id: Math.random().toString(36).substring(7),
            text,
            vector,
            metadata,
            timestamp: new Date().toISOString()
        };

        this.items.push(item);
        this.save();
        console.log(`🧠 Memory Stored: "${text.substring(0, 50)}..."`);
    }

    async search(query: string, limit: number = 3): Promise<MemoryItem[]> {
        const queryVector = await this.llm.getEmbedding(query);
        if (queryVector.length === 0) return [];

        // Calculate Cosine Similarity
        const scoredItems = this.items.map(item => {
            const similarity = this.cosineSimilarity(queryVector, item.vector);
            return { ...item, score: similarity };
        });

        // Sort by Score DESC
        return scoredItems
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
}
