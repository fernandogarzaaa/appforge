import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';
import { GitTool } from '../tools/git.js';
import { SwarmMemory } from '../core/memory.js';
import { SentinelAgent } from '../agents/Sentinel.js';
import { BugHunterAgent } from '../agents/BugHunter.js';
import { OptimizerAgent } from '../agents/Optimizer.js';
import { ProductOwnerAgent } from '../agents/ProductOwner.js';
import { AntigravityAgent } from '../agents/Antigravity.js';
import { LibrarianAgent } from '../agents/Librarian.js';
import { SwarmKnowledge } from './knowledge.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SHADOW SWARM
 * A parallel lifecycle for high-risk evolutionary exploration.
 */
export class ShadowSwarm {
    id: string;
    knowledge: SwarmKnowledge;
    base44: Base44Tool;

    constructor(forkId: string) {
        this.id = forkId;
        this.base44 = new Base44Tool();
        this.knowledge = new SwarmKnowledge();
    }

    async initialize() {
        console.log(`🧬 [SHADOW-SWARM] Initializing fork: ${this.id}`);
        // Detach knowledge core
        const rootKnowledge = path.resolve(__dirname, '../../src/data/swarm_knowledge.json');
        const forkPath = path.resolve(__dirname, `../../src/data/swarm_knowledge_${this.id}.json`);

        try {
            await fs.copyFile(rootKnowledge, forkPath);
            // Initialize knowledge instance with fork path
            this.knowledge = new SwarmKnowledge(forkPath);
            await this.knowledge.load();
            console.log(`   → Knowledge detached to ${this.id} branch.`);
        } catch (e) {
            console.error(`   ❌ Failed to detach knowledge: ${e}`);
        }
    }

    async runCycle() {
        console.log(`🧬 [SHADOW-SWARM] Starting cognitive fork cycle: ${this.id}`);

        const fst = new FileSystemTool();
        const git = new GitTool();
        const memory = new SwarmMemory(fst);

        const sentinel = new SentinelAgent(this.base44);
        const bugHunter = new BugHunterAgent(this.base44, fst);
        const optimizer = new OptimizerAgent(this.base44);
        const productOwner = new ProductOwnerAgent(this.base44, fst, memory);
        const antigravity = new AntigravityAgent(this.base44, fst, git);
        const librarian = new LibrarianAgent(this.base44);

        // Execute agents in high-risk mode
        console.log(`   → Executing parallel agent branches...`);
        const results = await Promise.all([
            sentinel.run(),
            bugHunter.run(),
            optimizer.run(),
            productOwner.run(),
            antigravity.run(),
            librarian.run()
        ]);

        const summary = results.map(r => r.status).join(', ');
        await this.knowledge.recordTaskOutcome(
            { type: 'shadow_fork', id: this.id },
            'success',
            `Shadow Cycle ${this.id} findings: ${summary}`
        );

        console.log(`✅ [SHADOW-SWARM] Cycle ${this.id} complete.`);
        return { id: this.id, results, knowledgeBranch: this.knowledge.knowledgeFilePath };
    }

    async cleanup() {
        const forkPath = this.knowledge.knowledgeFilePath;
        if (forkPath && forkPath.includes(this.id)) {
            await fs.unlink(forkPath);
            console.log(`🧬 [SHADOW-SWARM] Branch ${this.id} cleaned up.`);
        }
    }
}
