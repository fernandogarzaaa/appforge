import { exec } from 'child_process';
import { broadcastLog } from '../server';

export class GitManager {
    async commitAndPush(taskDescription: string): Promise<boolean> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const branchName = `swarm/feature-${timestamp}`;
        const commitMsg = `feat(swarm): ${taskDescription}`;

        return new Promise((resolve) => {
            broadcastLog('GIT_KEEPER', `Saving progress...`, 'INFO');

            // Execute Git Commands Sequence
            // 1. Add All -> 2. Commit -> 3. Push
            const cmd = `git add . && git commit -m "${commitMsg}" && git push origin main`;

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    broadcastLog('GIT_KEEPER', `Commit Failed: ${stderr}`, 'WARN');
                    resolve(false);
                    return;
                }
                broadcastLog('GIT_KEEPER', `Code pushed to GitHub: ${commitMsg}`, 'SUCCESS');
                resolve(true);
            });
        });
    }
}
