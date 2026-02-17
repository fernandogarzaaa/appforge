import { EnvironmentSignal } from './reality_sensor.js';
import { AtomicPatcher, PatchChunk } from './atomic_patcher.js';
import { QuantumSwarmCore } from './quantum_core.js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 🛠️ Autonomous Bug Fixer
 * Enables the swarm to recursively patch its own source code bugs.
 */
export class AutonomousBugFixer {
    private patcher: AtomicPatcher;
    private core: QuantumSwarmCore;
    private projectRoot: string;

    constructor(projectRoot: string, core: QuantumSwarmCore) {
        this.projectRoot = projectRoot;
        this.patcher = new AtomicPatcher(projectRoot);
        this.core = core;
    }

    /**
     * Processes an environment signal and decides if a self-patch is required.
     */
    async processSignal(signal: EnvironmentSignal) {
        if (signal.type === 'DEBT_ACCUMULATION' || signal.type === 'BUILD_FAILURE') {
            console.log(`🔧 [BugFixer] Detected ${signal.type}. Initiating self-healing protocol...`);
            await this.handleCodeDebt(signal);
        }
    }

    private async handleCodeDebt(signal: EnvironmentSignal) {
        // In a real scenario, we'd use the payload to identify which files to fix.
        // For Phase 90, we simulate fixing a common lint issue or missing comment.

        const filesToAnalyze = signal.payload.files || [];
        if (filesToAnalyze.length === 0) return;

        for (const fileLine of filesToAnalyze) {
            const fileName = fileLine.split(' ')[1] || fileLine;
            if (!fileName.endsWith('.ts') && !fileName.endsWith('.js')) continue;

            console.log(`   🛠️ Analyzing ${fileName} for potential patches...`);

            // Consult Oracle for a fix logic
            const consultation = await this.core.consultOracle(
                `How should I fix code debt in ${fileName}?`,
                ['Refactor functions', 'Add missing types', 'Add documentation', 'Strict null checks'],
                ['quality', 'maintainability']
            );

            console.log(`   ✨ Oracle recommends: ${consultation.recommendation}`);

            // If confidence is high, apply a "standard" improvement
            if (consultation.confidence > 0.8) {
                await this.applyStandardImprovement(fileName, consultation.recommendation);
            }
        }
    }

    private async applyStandardImprovement(fileName: string, type: string) {
        const fullPath = path.resolve(this.projectRoot, fileName);
        if (!fs.existsSync(fullPath)) return;

        const patches: PatchChunk[] = [];

        if (type.includes('documentation')) {
            // Find a place to add a holographic header if missing
            const content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('HOLOGRAPHIC_VERSION')) {
                patches.push({
                    targetContent: 'import',
                    replacementContent: `/** HOLOGRAPHIC_VERSION: 1.0.0 (Self-Patched) */\nimport`
                });
            }
        }

        if (patches.length > 0) {
            const result = await this.patcher.applyPatches(fileName, patches);
            if (result.success) {
                console.log(`   🔐 [BugFixer] Successfully applied ${type} patch to ${fileName}`);
            } else {
                console.warn(`   ⚠️ [BugFixer] Patch failed for ${fileName}: ${result.error}`);
            }
        }
    }
}
