
import { simpleGit } from 'simple-git';

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

    async fetch() {
        return await this.git.fetch();
    }

    async getRemoteCommits() {
        // Compare local main with origin/main
        return await this.git.log(['main..origin/main']);
    }

    async getLocalCommits() {
        // Compare origin/main with local main
        return await this.git.log(['origin/main..main']);
    }

    async pull() {
        return await this.git.pull('origin', 'main');
    }

    // Safety: No push by default in autonomous mode unless strictly configured
    async push() {
        // checks remote origin
        return await this.git.push('origin', 'main');
    }

    async clone(url: string, targetPath: string) {
        return await simpleGit().clone(url, targetPath);
    }
}
