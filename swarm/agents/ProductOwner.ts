
import { MultiLLMClient } from '../core/llm.js';
import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';

export class ProductOwnerAgent {
    base44: Base44Tool;
    fs: FileSystemTool;
    llm: MultiLLMClient;

    constructor(base44: Base44Tool, fs: FileSystemTool) {
        this.base44 = base44;
        this.fs = fs;
        this.llm = new MultiLLMClient();
    }

    async run() {
        console.log('👔 Product Owner: Analyzing project vision...');

        try {
            // 1. Gather Context
            const readme = await this.fs.readFile('README.md').catch(() => '');
            const todo = await this.fs.readFile('TODO.md').catch(() => '');

            // If no README, we can't really dream.
            if (!readme) {
                console.log('   -> No README.md found. Cannot determine vision.');
                return { status: 'idle', reason: 'no_vision' };
            }

            // 2. Check if we already have enough work
            const pendingTasks = todo.split('\n').filter(l => l.includes('TODO:')).length;
            if (pendingTasks > 3) {
                console.log(`   -> Application has ${pendingTasks} pending tasks. Holding off on new ideas.`);
                return { status: 'idle', reason: 'backlog_full' };
            }

            // 3. Dream of a new feature
            console.log('   -> Brainstorming next strategic move...');
            const response = await this.llm.chat({
                system: `You are the Visionary Product Owner for this software project. 
                Your goal is to invent the next meaningful feature or improvement based on the README.
                
                Rules:
                1. Propose SMALL, atomic tasks (implementable in 15-30 mins).
                2. Do not propose things already in TODO.
                3. Focus on high-impact, low-effort changes first.
                4. Output ONLY the task description string.`,

                user: `
                Project Vision (README):
                ${readme.substring(0, 2000)}

                Current Backlog (TODO):
                ${todo}

                What is the ONE next best task for the development team? 
                Format: "Implement [Feature Name] to [Benefit]"`
            });

            const newFeature = response.trim().replace(/["']/g, '');
            console.log(`   -> Idea Generated: "${newFeature}"`);

            // 4. Update Backlog
            const newTodoLine = `- [ ] TODO: [GOD_MODE] ${newFeature}`;
            const updatedTodo = todo + '\n' + newTodoLine;

            await this.fs.writeFile('TODO.md', updatedTodo);

            await this.base44.logActivity('PRODUCT_OWNER', `Created new strategic task: ${newFeature}`);

            return { status: 'new_task_created', task: newFeature };

        } catch (error: any) {
            console.error('❌ Product Owner Error:', error.message);
            return { status: 'error', error: error.message };
        }
    }
}
