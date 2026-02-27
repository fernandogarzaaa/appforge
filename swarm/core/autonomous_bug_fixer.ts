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

    /**
     * Recursive Repair: Swarm loops until stability or max attempts reached.
     */
    async recursiveRepair(initialFiles: string[], maxAttempts: number = 3) {
        let attempts = 0;
        let filesToFix = [...initialFiles];

        while (filesToFix.length > 0 && attempts < maxAttempts) {
            attempts++;
            console.log(`🧬 [BugFixer] Recursive Repair Attempt ${attempts}/${maxAttempts}`);

            for (const file of filesToFix) {
                const fullPath = path.resolve(this.projectRoot, file);
                if (!fs.existsSync(fullPath)) continue;
                const fileContent = fs.readFileSync(fullPath, 'utf8');

                const consultation = await this.core.consultOracle(
                    `Generate a specific, safe logic or typing fix for '${file}' to satisfy stability.
                    File snippet:
                    ${fileContent.substring(0, 3000)}
                    Return ONLY a JSON object with 'targetContent' and 'replacementContent'.
                    Whitespace must be exact.`,
                    ['GENERATE_PATCH'],
                    ['safety', 'integrity']
                );

                if (consultation.confidence > 0.6) {
                    await this.applyDynamicPatch(file, (consultation as any).reasoning || consultation.recommendation || '');
                }
            }

            // After patching, we should ideally verify stability (e.g. via an external build check)
            // For now, we clear the list to simulate a single pass or we'd re-scan.
            filesToFix = [];
        }
    }

    private async handleCodeDebt(signal: EnvironmentSignal) {
        const filesToAnalyze = signal.payload?.files || [];
        if (filesToAnalyze.length === 0) return;

        for (const fileLine of filesToAnalyze) {
            const fileName = fileLine.split(' ')[1] || fileLine;
            if (!fileName.endsWith('.ts') && !fileName.endsWith('.js') && !fileName.endsWith('.tsx')) continue;

            console.log(`   🛠️ Analyzing ${fileName} for true AI self-healing...`);

            const fullPath = path.resolve(this.projectRoot, fileName);
            if (!fs.existsSync(fullPath)) continue;

            const fileContent = fs.readFileSync(fullPath, 'utf8');

            const patchQuestion = `Generate a specific, safe, and effective logic or typing fix for '${fileName}' to repair code debt or build failures.
            File snippet:
            ${fileContent.substring(0, 3000)}
            
            Return ONLY a JSON object with 'targetContent' (existing code block to replace) and 'replacementContent' (new corrected code block).
            Whitespace must be exact.`;

            const consultation = await this.core.consultOracle(
                patchQuestion,
                ['GENERATE_PATCH'],
                ['safety', 'quality']
            );

            console.log(`   ✨ Oracle attempted patch generation with confidence: ${(consultation.confidence * 100).toFixed(1)}%`);

            if (consultation.confidence > 0.6) {
                await this.applyDynamicPatch(fileName, (consultation as any).reasoning || consultation.recommendation || '');
            }
        }
    }

    private async applyDynamicPatch(fileName: string, rawPatch: string) {
        const patches: PatchChunk[] = [];

        try {
            const jsonMatch = rawPatch.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const patchData: PatchChunk = JSON.parse(jsonMatch[0]);
                if (patchData.targetContent && patchData.replacementContent) {
                    patches.push(patchData);
                }
            }
        } catch (e) {
            console.warn(`   ⚠️ [BugFixer] Failed to parse Oracle patch: ${(e as any).message}`);
        }

        if (patches.length > 0) {
            const result = await this.patcher.applyPatches(fileName, patches);
            if (result.success) {
                console.log(`   🔐 [BugFixer] Successfully applied AI self-healing patch to ${fileName}`);
            } else {
                console.warn(`   ⚠️ [BugFixer] AI Patch failed to apply on ${fileName}: ${result.error}`);
            }
        }
    }
}
