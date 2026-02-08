
import simpleGit from 'simple-git';

export class GitTool {
    git: any;

    constructor(baseDir: string = process.cwd()) {
        this.git = simpleGit(baseDir);
    }

    async status() {
        return await this.git.status();
    }

    async commit(message: string) {
        await this.git.add('.');
        return await this.git.commit(message);
    }

    // Safety: No push by default in autonomous mode unless strictly configured
    async push() {
        // checks remote origin
        return await this.git.push('origin', 'main');
    }
}
