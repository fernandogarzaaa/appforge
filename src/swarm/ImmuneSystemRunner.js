import fs from 'fs';
import path from 'path';
import { Orchestrator } from './orchestrator.js';
import { broadcastLog } from '../logger.js';
/**
 * ImmuneSystemRunner
 *
 * Phase 54: Recursive Healing Loop
 * Periodically audits the codebase and triggers autonomous refactors
 * for high-complexity or low-security components.
 */
export class ImmuneSystemRunner {
    orchestrator;
    interval = null;
    isHealing = false;
    constructor() {
        this.orchestrator = new Orchestrator();
    }
    async start(intervalMs = 3600000) {
        broadcastLog('IMMUNE_SYSTEM', 'Autonomous Healing Loop Activated.', 'SUCCESS');
        this.interval = setInterval(() => this.runHealingCycle(), intervalMs);
        // Run once immediately
        this.runHealingCycle();
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        broadcastLog('IMMUNE_SYSTEM', 'Autonomous Healing Loop Suspended.', 'WARN');
    }
    async runHealingCycle() {
        if (this.isHealing)
            return;
        this.isHealing = true;
        try {
            broadcastLog('IMMUNE_SYSTEM', 'Starting Deep Tissue Audit...', 'INFO');
            // 1. Scan for High-Entropy Files
            const highEntropyFiles = await this.scanForEntropy(path.resolve(process.cwd(), 'src'));
            for (const file of highEntropyFiles) {
                broadcastLog('IMMUNE_SYSTEM', `Healing Target Detected: ${file}`, 'WARN');
                const task = `REFAC_HEAL: Refactor ${file} to reduce complexity and harden security. Ensure FAIL_CLOSED policies and zero-trust handshakes.`;
                try {
                    await this.orchestrator.executeTask(task);
                    broadcastLog('IMMUNE_SYSTEM', `Healed: ${file}`, 'SUCCESS');
                }
                catch (e) {
                    broadcastLog('IMMUNE_SYSTEM', `Heal Failed for ${file}: ${e.message}`, 'CRITICAL');
                }
            }
            broadcastLog('IMMUNE_SYSTEM', 'Audit Cycle Complete. System Stabilized.', 'SUCCESS');
        }
        catch (error) {
            broadcastLog('IMMUNE_SYSTEM', `Audit Failure: ${error.message}`, 'CRITICAL');
        }
        finally {
            this.isHealing = false;
        }
    }
    async scanForEntropy(dir) {
        const results = [];
        const files = this.getAllFiles(dir);
        for (const file of files) {
            if (file.endsWith('.test.ts') || file.endsWith('.spec.ts'))
                continue;
            const content = fs.readFileSync(file, 'utf-8');
            const stats = fs.statSync(file);
            // Heuristics for "High Entropy":
            // 1. Files > 500 lines
            // 2. Many nested braces
            // 3. Presence of TODO/FIXME/HACK
            const lines = content.split('\n');
            const lineCount = lines.length;
            const nestingLevel = (content.match(/\{/g) || []).length;
            const hasTechDebt = content.includes('TODO') || content.includes('FIXME') || content.includes('HACK');
            if (lineCount > 500 || nestingLevel > 50 || hasTechDebt) {
                results.push(path.relative(process.cwd(), file));
            }
        }
        return results.slice(0, 3); // Atomic healing: Max 3 files per cycle
    }
    getAllFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                    this.getAllFiles(filePath, fileList);
                }
            }
            else {
                if (file.endsWith('.ts') || file.endsWith('.js')) {
                    fileList.push(filePath);
                }
            }
        });
        return fileList;
    }
}
export const immuneSystem = new ImmuneSystemRunner();
