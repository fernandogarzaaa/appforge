
import { MultiLLMClient } from '../core/llm.js';
import { Base44Tool } from '../tools/base44.js';
import { FileSystemTool } from '../tools/filesystem.js';
import { SwarmMemory } from '../core/memory.js';
import quantumCore from '../core/quantum_core.js';

export class ProductOwnerAgent {
    base44: Base44Tool;
    fs: FileSystemTool;
    llm: MultiLLMClient;
    memory: SwarmMemory;

    constructor(base44: Base44Tool, fs: FileSystemTool, memory: SwarmMemory) {
        this.base44 = base44;
        this.fs = fs;
        this.llm = new MultiLLMClient(base44);
        this.memory = memory;
    }

    async run() {
        console.log('👔 Product Owner: Analyzing project vision...');

        try {
            // 1. Context Gathering
            const readme = await this.fs.readFile('README.md').catch(() => '');
            const todo = await this.fs.readFile('TODO.md').catch(() => '');

            if (!readme) {
                console.log('   -> No README.md found. Cannot determine vision.');
                return { status: 'idle', reason: 'no_vision' };
            }

            // Consult Oracle for Strategic Direction
            const oracleResult = await quantumCore.consultOracle(
                'What is the highest impact strategic move for this project right now?',
                [
                    'Improve user experience and UI polish',
                    'Refactor core architecture for scalability',
                    'Add new user-facing features',
                    'Enhance documentation and onboarding'
                ],
                ['business_value', 'user_need', 'feasibility']
            );

            console.log(`   🔮 Oracle Guidance: ${oracleResult.recommendation}`);
            console.log(`   📊 Confidence: ${(oracleResult.confidence * 100).toFixed(1)}%`);

            // 2. Check backlog size
            const pendingTasks = todo.split('\n').filter(l => l.includes('TODO:')).length;
            if (pendingTasks > 3) {
                console.log(`   -> Application has ${pendingTasks} pending tasks. Holding off on new ideas.`);
                return { status: 'idle', reason: 'backlog_full', oracle_strategy: oracleResult.recommendation };
            }

            // 3. Brainstorm with Oracle Strategy
            console.log('   -> Brainstorming next strategic move...');
            const response = await this.llm.chat({
                system: `You are the Visionary Product Owner. 
                Your strategic focus is currently: ${oracleResult.recommendation}.
                
                Rules:
                1. Propose SMALL, atomic tasks (implementable in 15-30 mins).
                2. Do not propose things already in TODO.
                3. Focus on high-impact, low-effort changes aligned with the strategic focus.
                4. Output ONLY the task description string.`,

                user: `
                Project Vision (README):
                ${readme.substring(0, 2000)}

                Current Backlog (TODO):
                ${todo}

                What is the ONE next best task? 
                Format: "Implement [Feature Name] to [Benefit]"`
            });

            const newFeature = response.trim().replace(/["']/g, '');
            console.log(`   -> Idea Generated: "${newFeature}"`);

            // 3.5 Check Memory (Have we done this before?)
            const pastWisdom = await this.memory.search(newFeature);
            if (pastWisdom.length > 0 && pastWisdom[0].score > 0.85) {
                console.log(`   -> 🛑 DEJA VU: We already did something similar: "${pastWisdom[0].text}" (Score: ${pastWisdom[0].score}). Skipping.`);
                return { status: 'skipped', reason: 'duplicate_idea' };
            }

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
