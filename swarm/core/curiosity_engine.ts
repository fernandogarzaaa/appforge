import * as fs from 'fs/promises';
import * as path from 'path';
import { Base44Tool } from '../tools/base44.js';
import quantumCore from './quantum_core.js';
import swarmKnowledge from './knowledge.js';

interface CuriosityBounty {
    file: string;
    whyInteresting: string;
    hypothesis: string;
    priority: number;
}

export class CuriosityEngine {
    base44: Base44Tool;
    private projectRoot: string;

    constructor(base44: Base44Tool) {
        this.base44 = base44;
        this.projectRoot = process.cwd();
    }

    /**
     * Scans the codebase for "neglected" or "interesting" files.
     * Heuristics:
     * 1. Low edit frequency (Forgotten knowledge)
     * 2. High complexity (Hidden bugs)
     * 3. Unexplored areas (No tests)
     */
    async scanForNovelty(limit: number = 3): Promise<CuriosityBounty[]> {
        console.log('🕵️ [Curiosity] Scanning for neglected artifacts...');

        // Simple heuristic: Find TS files in src/ or swarm/ that haven't been touched in a while
        // For simulation, we'll pick random files from key directories
        const candidates = await this.findCandidateFiles();
        const bounties: CuriosityBounty[] = [];

        for (const file of candidates.slice(0, limit)) {
            // Quantum Consult: Is this interesting?
            const analysis = await quantumCore.consultOracle(
                `Analyze this filename: ${file}. Why might it be interesting to explore or refactor? Return a short hypothesis.`,
                ['Potential Technical Debt', 'Hidden Feature', 'Optimization Candidate', 'Security Risk']
            );

            bounties.push({
                file,
                whyInteresting: analysis.recommendation,
                hypothesis: ('reasoning' in analysis ? (analysis as any).reasoning : undefined) || 'Autonomous exploration of neglected code.',
                priority: analysis.confidence
            });
        }

        return bounties;
    }

    async synthesizeBounty(bounty: CuriosityBounty): Promise<void> {
        console.log(`✨ [Curiosity] Synthesizing Bounty for: ${path.basename(bounty.file)}`);

        try {
            // Create a formal task in Base44
            await this.base44.client.entities.Task.create({
                description: `[Curiosity] Explore ${path.basename(bounty.file)}`,
                status: 'OPEN',
                metadata: {
                    type: 'CURIOSITY_EXPLORATION',
                    target: bounty.file,
                    hypothesis: bounty.hypothesis,
                    priority: 'LOW' // Curiosity is low urgency, high potential
                }
            });
            console.log(`   ✅ Bounty Created: Exlpore ${path.basename(bounty.file)}`);
        } catch (error: any) {
            const message = error?.message || '';
            const status = error?.status || error?.response?.status;

            if (status === 401 || status === 403 || message.includes('401') || message.includes('Authentication')) {
                console.warn(`   ⚠️ [Curiosity] Auth Failure: ${message}. Persisting bounty locally only.`);
                // Fallback: append to a local curiosity log if cloud is unavailable
                const localLog = path.join(this.projectRoot, 'src/data/local_bounties.json');
                let bounties = [];
                try {
                    const data = await fs.readFile(localLog, 'utf8');
                    bounties = JSON.parse(data);
                } catch (e) { }
                bounties.push({ ...bounty, timestamp: new Date().toISOString() });
                await fs.writeFile(localLog, JSON.stringify(bounties, null, 2));
            } else {
                throw error;
            }
        }
    }

    private async findCandidateFiles(): Promise<string[]> {
        const dirs = ['swarm/core', 'src/utils', 'scripts'];
        let candidates: { file: string; mtimeMs: number }[] = [];

        for (const dir of dirs) {
            try {
                const fullDir = path.join(this.projectRoot, dir);
                const entries = await fs.readdir(fullDir);

                for (const entry of entries) {
                    if (entry.endsWith('.ts') || entry.endsWith('.js')) {
                        const filePath = path.join(dir, entry);
                        const fullPath = path.join(fullDir, entry);
                        const stats = await fs.stat(fullPath);
                        candidates.push({ file: filePath, mtimeMs: stats.mtimeMs });
                    }
                }
            } catch (e) { }
        }

        // Sort by age first to narrow down candidates
        candidates.sort((a, b) => a.mtimeMs - b.mtimeMs);

        // Take top 20 "oldest" candidates and run git check on them
        const topCandidates = candidates.slice(0, 20);
        const { execSync } = await import('child_process');
        const scored: { file: string; score: number }[] = [];

        for (const cand of topCandidates) {
            let commitCount = 0;
            try {
                // Fast check: count commits to see how active it is
                commitCount = parseInt(execSync(`git rev-list --count HEAD -- "${cand.file}"`, {
                    cwd: this.projectRoot,
                    encoding: 'utf8',
                    timeout: 1000 // 1s limit per file
                }).trim());
            } catch (e) {
                commitCount = 10; // Default if git fails or times out
            }

            const ageDays = (Date.now() - cand.mtimeMs) / (1000 * 60 * 60 * 24);
            const score = (100 / (commitCount + 1)) + ageDays;
            scored.push({ file: cand.file, score });
        }

        // Sort by neglect score (Highest score = most interesting/neglected)
        return scored.sort((a, b) => b.score - a.score).map(c => c.file);
    }
}
