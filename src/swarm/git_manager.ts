import { exec } from 'child_process';
import { broadcastLog } from '../server.js';

export class GitManager {
    async commitAndPush(message: string, files: string[] = ['.']): Promise<boolean> {
        return new Promise((resolve) => {
            broadcastLog('GIT_KEEPER', `Running Production Integrity Checks...`, 'INFO');

            // PHASE 33: PRODUCTION LOCKDOWN - NO DEPLOY WITHOUT TESTS
            exec('npm test', (testError, testStdout, testStderr) => {
                if (testError) {
                    broadcastLog('GIT_KEEPER', `❌ Deployment Aborted: Tests Failed.\n${testStderr}`, 'CRITICAL');
                    resolve(false);
                    return;
                }

                broadcastLog('GIT_KEEPER', `✅ Tests This Checks out. Proceeding to GitHub...`, 'SUCCESS');

                // 1. Add -> 2. Commit -> 3. Push
                const filesToAdd = files.join(' ');
                // VIBE CODING: Use the Base44 Builder Bot for deployments
                const cmd = `git config user.name "Base44-builder[bot]" && git config user.email "bot@base44.com" && git add ${filesToAdd} && git commit -m "${message}" && git push origin main`;

                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        // Warning only - don't crash if git fails
                        broadcastLog('GIT_KEEPER', `Git Push Warning: ${stderr}`, 'WARN');
                        resolve(false);
                        return;
                    }
                    broadcastLog('BASE44_BUILDER', `✅ Vibe Code Deployed: ${message}`, 'SUCCESS');
                    resolve(true);
                });
            });
        });
    }

    /**
     * Pushes "Safe Optimizations" to a staging branch for human review.
     * This is used by the Architect agent.
     */
    async pushToStaging(message: string, files: string[]): Promise<boolean> {
        return new Promise((resolve) => {
            broadcastLog('GIT_KEEPER', `Promoting optimization to Staging...`, 'INFO');

            const filesToAdd = files.join(' ');
            // Force the bot identity and push to 'staging' branch
            const cmd = `git config user.name "Base44-builder[bot]" && git config user.email "bot@base44.com" && git checkout -b staging || git checkout staging && git add ${filesToAdd} && git commit -m "${message}" && git push origin staging && git checkout main`;

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    broadcastLog('GIT_KEEPER', `Staging Push Warning: ${stderr}`, 'WARN');
                    resolve(false);
                    return;
                }
                broadcastLog('ARCHITECT', `🚀 Optimized Code Pushed to Staging: ${message}`, 'SUCCESS');
                resolve(true);
            });
        });
    }
}
