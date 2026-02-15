import { generateText } from '../inference_client.js';
import { broadcastLog } from '../../logger.js';
import fs from 'fs';
import path from 'path';

export class Architect {

    /**
     * scanAndOptimize:
     * Scans the codebase for inefficient patterns (e.g. nested loops, heavy sync operations).
     * Proposes a Rust migration plan for the most critical bottlenecks.
     */
    /**
     * scanAndOptimize:
     * Scans the codebase and systematically optimizes for Objectives.
     */
    async scanAndOptimize(srcDir: string): Promise<void> {
        broadcastLog('ARCHITECT', 'Starting Objective-Based Audit...', 'INFO');

        const files = this.findLargeFiles(srcDir);

        if (files.length === 0) {
            broadcastLog('ARCHITECT', 'System is clean. No major refactoring needed.', 'SUCCESS');
            return;
        }

        // Define Objectives
        const objectives = [
            { id: 'SEC_01', metric: 'SECURITY', target_value: 0 },
            { id: 'CMP_01', metric: 'COMPLEXITY', target_value: 20 } // Max nesting/blocks
        ];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            const { ObjectiveOptimizer } = await import('../../core/objective/Optimizer.js');

            for (const obj of objectives) {
                // @ts-ignore
                const isOptimal = ObjectiveOptimizer.evaluate(content, obj);

                if (!isOptimal) {
                    broadcastLog('ARCHITECT', `VIOLATION: ${path.basename(file)} failed ${obj.metric} check.`, 'WARN');

                    // Generate Refactor Plan
                    // @ts-ignore
                    const prompt = ObjectiveOptimizer.getRefactorPrompt(content, obj);

                    // In a fully autonomous loop, we would execute this prompt via the Refiner.
                    // For now, we log the intent to the Sovereign Memory.
                    this.logRefactorIntent(file, obj.metric, prompt);
                }
            }
        }
    }

    private logRefactorIntent(file: string, metric: string, prompt: string) {
        const memoryPath = path.resolve(process.cwd(), 'memory/architect_backlog.json');
        let backlog = [];
        try {
            if (fs.existsSync(memoryPath)) {
                backlog = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
            }
        } catch (e) { }

        backlog.push({
            file,
            metric,
            timestamp: new Date().toISOString(),
            status: 'PENDING_REVIEW'
        });

        fs.writeFileSync(memoryPath, JSON.stringify(backlog, null, 2));
        broadcastLog('ARCHITECT', `Refactor Intent logged for ${path.basename(file)}`, 'INFO');
    }

    private findLargeFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') {
                    this.findLargeFiles(filePath, fileList);
                }
            } else {
                if (file.endsWith('.ts') && stat.size > 5000) {
                    fileList.push(filePath);
                }
            }
        }
        return fileList;
    }
}
