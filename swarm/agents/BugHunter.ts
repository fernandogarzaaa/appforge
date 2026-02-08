
import { MultiLLMClient } from '../core/llm.js';
import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';

export class BugHunterAgent {
    base44: Base44Tool;
    fs: FileSystemTool;
    llm: MultiLLMClient;

    constructor(base44: Base44Tool, fs: FileSystemTool) {
        this.base44 = base44;
        this.fs = fs;
        this.llm = new MultiLLMClient();
    }

    async run() {
        console.log('🐞 BugHunter scanning code...');
        const files = await this.fs.listFiles('src/**/*.js');
        let issues = [];

        // Analyze a sample file using Multi-LLM
        if (files.length > 0) {
            const sampleFile = files[0];
            const content = await this.fs.readFile(sampleFile);

            const analysis = await this.llm.chat({
                system: 'You are a QA Engineer. Find bugs in this code.',
                user: `File: ${sampleFile}\n\nCode:\n${content.substring(0, 1000)}`
            });
            // console.log('BugHunter AI Analysis:', analysis);
        }

        for (const file of files.slice(0, 5)) {
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
