/**
 * 🛡️ SWARM GUARD - Mutation Safety Protocol
 * Ensures the swarm does not mutate critical system files or GitHub workflows.
 */

export function validateMutation(changedFiles: string[]): void {
    const allowedPrefixes = ['swarm/', 'docs/', 'src/'];
    const forbiddenPatterns = [
        '.github/workflows/',
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'tsconfig.node.json',
        'vite.config.ts',
        'vitest.config.ts'
    ];

    for (const file of changedFiles) {
        // Check if path is outside allowed areas
        const isAllowed = allowedPrefixes.some(prefix => file.startsWith(prefix));
        if (!isAllowed) {
            throw new Error(`🛡️ [SwarmGuard] Violation: Mutation outside allowed directories detected: ${file}`);
        }

        // Check for forbidden files
        const isForbidden = forbiddenPatterns.some(pattern => file.includes(pattern));
        if (isForbidden) {
            throw new Error(`🛡️ [SwarmGuard] Violation: Mutation of critical system file blocked: ${file}`);
        }
    }

    console.log('🛡️ [SwarmGuard] Mutation validated. All changes within safe boundaries.');
}
