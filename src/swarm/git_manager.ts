import { exec } from 'child_process';
import { broadcastLog } from '../server';

export class GitManager {
    async commitAndPush(taskDescription: string): Promise<boolean> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const commitMsg = `feat(swarm): ${taskDescription}`;

        return new Promise((resolve) => {
            broadcastLog('GIT_KEEPER', `Saving progress to GitHub...`, 'INFO');

            // 1. Add -> 2. Commit -> 3. Push
            const cmd = `git add . && git commit -m "${commitMsg}" && git push origin main`;

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    // Warning only - don't crash if git fails
                    broadcastLog('GIT_KEEPER', `Git Push Warning: ${stderr}`, 'WARN');
                    resolve(false);
                    return;
                }
                broadcastLog('GIT_KEEPER', `✅ Code Saved: ${commitMsg}`, 'SUCCESS');
                resolve(true);
            });
        });
    }
}
