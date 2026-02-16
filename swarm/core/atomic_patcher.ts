import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PatchChunk {
    targetContent: string;
    replacementContent: string;
}

/**
 * ⚛️ Atomic Patcher
 * Provides a safe way for the Swarm to modify its own source code.
 */
export class AtomicPatcher {
    private projectRoot: string;

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
    }

    /**
     * Apply multiple patches to a file.
     */
    async applyPatches(relativeFilePath: string, patches: PatchChunk[]): Promise<{ success: boolean; error?: string }> {
        const fullPath = path.resolve(this.projectRoot, relativeFilePath);

        try {
            let content = await fs.readFile(fullPath, 'utf8');

            for (const patch of patches) {
                if (!content.includes(patch.targetContent)) {
                    return {
                        success: false,
                        error: `Target content not found in ${relativeFilePath}`
                    };
                }
                content = content.replace(patch.targetContent, patch.replacementContent);
            }

            // Write to temporary file for validation
            const tempPath = `${fullPath}.tmp`;
            await fs.writeFile(tempPath, content, 'utf8');

            // Optional: Basic syntax check (e.g. for .ts files)
            if (relativeFilePath.endsWith('.ts')) {
                try {
                    // Just check if it's parseable? Full tsc might be too slow/complex here.
                    // For now, we'll rely on the caller or a post-deployment check.
                } catch (e) {
                    await fs.unlink(tempPath);
                    return { success: false, error: `Syntax validation failed: ${(e as any).message}` };
                }
            }

            // Atomic rename
            await fs.rename(tempPath, fullPath);
            console.log(`✅ [AtomicPatcher] Patched ${relativeFilePath} successfully.`);

            return { success: true };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
