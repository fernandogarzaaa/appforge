
import { OpenAI } from 'openai';
import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';

export class BugHunterAgent {
    base44: Base44Tool;
    fs: FileSystemTool;
    openai: OpenAI;

    constructor(base44: Base44Tool, fs: FileSystemTool) {
        this.base44 = base44;
        this.fs = fs;
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async run() {
        console.log('🐞 BugHunter scanning code...');
        // Scan for generic issues like console.log or TODOs
        const files = await this.fs.listFiles('src/**/*.js');
        let issues = [];

        for (const file of files.slice(0, 5)) { // Limit scan for demo
            const content = await this.fs.readFile(file);
            if (content.includes('TODO')) {
                issues.push({ file, type: 'TODO found' });
            }
        }

        if (issues.length > 0) {
            await this.base44.logActivity('BUG_HUNTER', `Found ${issues.length} potential issues.`);
            return { status: 'bugs_found', issues };
        }

        return { status: 'clean' };
    }
}
