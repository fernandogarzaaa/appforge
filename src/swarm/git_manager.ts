import { exec } from 'child_process';
import { broadcastLog } from '../server.js';

export class GitManager {
    async commitAndPush(message: string, files: string[] = ['.']): Promise<boolean> {
        return new Promise((resolve) => {
            broadcastLog('GIT_KEEPER', `Saving progress to GitHub...`, 'INFO');

            // 1. Add -> 2. Commit -> 3. Push
            const filesToAdd = files.join(' ');
            const cmd = `git add ${filesToAdd} && git commit -m "${message}" && git push origin main`;

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    // Warning only - don't crash if git fails
                    broadcastLog('GIT_KEEPER', `Git Push Warning: ${stderr}`, 'WARN');
                    resolve(false);
                    return;
                }
                broadcastLog('GIT_KEEPER', `✅ Code Saved: ${message}`, 'SUCCESS');
                resolve(true);
            });
        });
    }
}
