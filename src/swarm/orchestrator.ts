import fs from 'fs';
import path from 'path';
import { generateText } from './llm_client.js';
import { GodMode } from './god_mode.js';
import { broadcastLog } from '../server.js';
import { GitManager } from './git_manager.js';
import { execSync } from 'child_process';
import { memoryManager } from './memory_manager.js';
import { swarmComms, SwarmEvent } from './comms.js';

const godMode = new GodMode();
const gitManager = new GitManager();

const SKILLS_DIR = path.resolve(process.cwd(), 'src/swarm/skills');
const QCORE_PATH = process.env.QCORE_PATH || path.resolve(process.cwd(), 'qcore.exe');

export class Orchestrator {
    private async loadSkills() {
        if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR, { recursive: true });
        const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        return files.map(f => f.replace(/\.(ts|js)$/, ''));
    }

    async executeTask(taskDescription: string): Promise<string> {
        broadcastLog('QUANTUM_ENGINE', `Recv Task: ${taskDescription}`, 'INFO');

        try {
            // 0. SKILLS DISCOVERY (Phase 12)
            const skills = await this.loadSkills();
            if (skills.length > 0) {
                broadcastLog('ORCHESTRATOR', `Skills Online: ${skills.join(', ')}`, 'INFO');
            }

            // 1. MEMORY RETRIEVAL (Phase 12)
            const cachedSolution = await memoryManager.retrieve(taskDescription);
            if (cachedSolution) {
                broadcastLog('MEMORY', "Hive Mind Match: Re-using optimized architectural pattern.", 'SUCCESS');
            }

            // 2. QUANTUM SUPERPOSITION (Phase 13)
            broadcastLog('QUANTUM_ENGINE', "Entering Superposition: Simulating 3 paths...", 'INFO');
            const systemPrompt = `You are the Swarm Architect. ${cachedSolution ? `Use this previous solution as reference: ${cachedSolution}` : 'Write complete, production-ready code.'}`;

            const results = await Promise.allSettled([
                generateText({ system: `${systemPrompt} - Path Alpha: Concise and elegant.`, prompt: taskDescription }),
                generateText({ system: `${systemPrompt} - Path Beta: Robust and secure with detailed error handling.`, prompt: taskDescription }),
                generateText({ system: `${systemPrompt} - Path Gamma: Innovative and high-performance.`, prompt: taskDescription })
            ]);

            const paths = results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<string>).value);

            if (paths.length === 0) {
                const errors = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason.message);
                throw new Error(`Quantum Collapse: All paths failed generation. [${errors.join(', ')}]`);
            }

            let solution = "";
            let winnerPath = "";

            // 3. COLLAPSE (Phase 13 Audit)
            for (let i = 0; i < paths.length; i++) {
                let candidate = paths[i].replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
                const pathName = ['Alpha', 'Beta', 'Gamma'][i];

                try {
                    // Use the Rust Q-Core binary for formal verification
                    // Escape candidate for shell execution
                    const escaped = candidate.replace(/"/g, '\\"').replace(/\n/g, ' ');
                    execSync(`"${QCORE_PATH}" "${escaped}"`, { stdio: 'pipe' });

                    solution = candidate;
                    winnerPath = pathName;
                    broadcastLog('Q-CORE', `Collapse Successful: Path ${pathName} validated.`, 'SUCCESS');
                    break;
                } catch (e: any) {
                    const violation = e.stdout?.toString() || e.message;
                    broadcastLog('Q-CORE', `Path ${pathName} Rejected: ${violation}`, 'WARN');

                    // PHASE 14: Mutation Memory - Log failure to God Mode
                    await godMode.refineSwarmIntelligence(`Quantum Rejection [${pathName}]: ${violation}`, taskDescription);
                }
            }

            if (!solution) {
                throw new Error("Quantum Decoherence: All paths rejected by Oracle.");
            }

            broadcastLog('PRODUCT_OWNER', `Winner [${winnerPath}] selected. verifying...`, 'INFO');

            // 4. PERSISTENCE: Write file to disk
            const fileMatch = taskDescription.match(/(src\/[\w\/\.-]+(?=\s|['"]|$))/);
            const filePath = fileMatch ? fileMatch[0].replace(/[.,]$/, '') : 'src/swarm/output.txt';

            const absolutePath = path.resolve(process.cwd(), filePath);
            const dir = path.dirname(absolutePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(absolutePath, solution);

            // 5. MEMORIZE (Phase 12)
            await memoryManager.memorize(taskDescription, solution, ['quantum_build', winnerPath, filePath.split('.').pop() || 'txt']);

            // 6. BROADCAST (Phase 12)
            swarmComms.publish(SwarmEvent.TASK_COMPLETED, { filePath, task: taskDescription, winner: winnerPath });

            broadcastLog('Q-CORE', `Stability Verified. Saved to ${filePath}`, 'SUCCESS');

            // 7. GIT: Auto-commit and push
            await gitManager.commitAndPush(`feat(swarm): Quantum-derived build of ${filePath} [Path ${winnerPath}]`, [filePath, 'APPFORGE_MANIFESTO.md']);

            return solution;

        } catch (error: any) {
            broadcastLog('Q-CORE', `QUANTUM DECOHERENCE: ${error.message}`, 'CRITICAL');

            // TRIGGER GOD MODE
            await godMode.refineSwarmIntelligence(error.message, taskDescription);
            broadcastLog('GOD_MODE', "System Evolved via Oracle feedback. Retrying...", 'WARN');
            throw error;
        }
    }
}

// Keep the legacy function for compatibility if needed
export async function runSwarmTask(taskDescription: string) {
    const orchestrator = new Orchestrator();
    return orchestrator.executeTask(taskDescription);
}
