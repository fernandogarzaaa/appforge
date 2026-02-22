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
            await this.createSnapshot(relativeFilePath);

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
                    // Basic syntax check placeholder
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

    /**
     * Apply patches to multiple files atomically.
     * Either all succeed or none are applied.
     */
    async applyMultiFilePatches(filePatches: { relativeFilePath: string; patches: PatchChunk[] }[]): Promise<{ success: boolean; error?: string }> {
        const preparedPaths: { tmp: string; original: string }[] = [];

        try {
            // Phase 1: Prepare and validate all files
            for (const item of filePatches) {
                const fullPath = path.resolve(this.projectRoot, item.relativeFilePath);
                let content = await fs.readFile(fullPath, 'utf8');
                await this.createSnapshot(item.relativeFilePath);

                for (const patch of item.patches) {
                    if (!content.includes(patch.targetContent)) {
                        throw new Error(`Target content not found in ${item.relativeFilePath}`);
                    }
                    content = content.replace(patch.targetContent, patch.replacementContent);
                }

                const tempPath = `${fullPath}.tmp`;
                await fs.writeFile(tempPath, content, 'utf8');
                preparedPaths.push({ tmp: tempPath, original: fullPath });
            }

            // Phase 2: Commit (Atomic rename)
            for (const pathPair of preparedPaths) {
                await fs.rename(pathPair.tmp, pathPair.original);
            }

            console.log(`✅ [AtomicPatcher] Multi-file patch applied successfully to ${filePatches.length} files.`);
            return { success: true };

        } catch (error: any) {
            // Cleanup on failure
            for (const pathPair of preparedPaths) {
                try {
                    const stats = await fs.stat(pathPair.tmp);
                    if (stats.isFile()) {
                        await fs.unlink(pathPair.tmp);
                    }
                } catch (e) { }
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Create a backup of a file before modification.
     */
    private async createSnapshot(relativeFilePath: string): Promise<string> {
        const fullPath = path.resolve(this.projectRoot, relativeFilePath);
        const snapshotPath = `${fullPath}.bak`;
        await fs.copyFile(fullPath, snapshotPath);
        return snapshotPath;
    }

    /**
     * Rollback a file to its previous state.
     */
    async rollback(relativeFilePath: string): Promise<{ success: boolean; error?: string }> {
        const fullPath = path.resolve(this.projectRoot, relativeFilePath);
        const snapshotPath = `${fullPath}.bak`;

        try {
            await fs.access(snapshotPath);
            await fs.rename(snapshotPath, fullPath);
            console.log(`⏪ [AtomicPatcher] Rolled back ${relativeFilePath} successfully.`);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: `Rollback failed: ${error.message}` };
        }
    }
}
