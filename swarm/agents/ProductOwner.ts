
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
        console.log('👔 Product Owner: Analyzing technical context and project vision...');

        try {
            // 1. Context Gathering (Technical + Vision)
            const readme = await this.fs.readFile('README.md').catch(() => '');
            const todo = await this.fs.readFile('TODO.md').catch(() => '');
            const pkg = await this.fs.readFile('package.json').catch(() => '{}');
            const buildLogs = await this.fs.readFile('build_logs.txt').catch(() => '');

            // Recursive scan for technical awareness (top 2 levels for brevity)
            const srcStructure = await this.scanDirectory('src', 2);

            if (!readme) {
                console.log('   -> No README.md found. Cannot determine vision.');
                return { status: 'idle', reason: 'no_vision' };
            }

            const pkgData = JSON.parse(pkg);
            const deps = Object.keys(pkgData.dependencies || {}).join(', ');

            // Dynamic Strategy Assessment
            const hasOversizedChunks = buildLogs.includes('larger than 500 kB');
            const testCount = await this.countFiles('tests', ['.ts', '.tsx']);
            const srcCount = await this.countFiles('src', ['.ts', '.tsx']);
            const testParity = srcCount > 0 ? testCount / srcCount : 1;

            const strategies = [
                'Performance: Fix oversized JS chunks and optimize builds',
                'Stability: Increase test coverage (Current Parity: ' + (testParity * 100).toFixed(1) + '%)',
                'Features: Add new user-facing functionality using: ' + deps.substring(0, 100),
                'UX: Polish the premium design system and UI interactions'
            ];

            // Consult Oracle for Strategic Direction
            const oracleResult = await quantumCore.consultOracle(
                'Determine the highest impact engineering move based on current project health.',
                strategies,
                ['technical_debt', 'performance', 'stability', 'user_value']
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
                system: `You are the Engineering-Led Product Owner for AppForge.
                Your strategic focus is: ${oracleResult.recommendation}.
                
                Product Architecture Context:
                - Dependencies: ${deps}
                - Source Structure: ${srcStructure}
                
                Rules:
                1. Propose SMALL, atomic engineering tasks.
                2. Explicitly align with the current roadmap Phases (Phase 1: Stability, Phase 2: Features, Phase 3: Scaling).
                3. Do not propose things already in TODO.
                4. Focus on high-impact technical improvements.
                5. Output format: PHASE_X | Implement [Task] to [Benefit]`,

                user: `
                Project README:
                ${readme.substring(0, 1500)}

                Current Roadmap (TODO):
                ${todo}

                What is the ONE next best engineering task?`
            });

            const rawIdea = response.trim().replace(/["']/g, '');
            const [targetPhase, newFeature] = rawIdea.includes('|')
                ? rawIdea.split('|').map(s => s.trim())
                : ['PHASE 2', rawIdea];

            console.log(`   -> Idea Generated: [${targetPhase}] "${newFeature}"`);

            // 3.5 Check Memory (Have we done this before?)
            const pastWisdom = await this.memory.search(newFeature);
            if (pastWisdom.length > 0 && pastWisdom[0].score > 0.85) {
                console.log(`   -> 🛑 DEJA VU: We already did something similar: "${pastWisdom[0].text}" (Score: ${pastWisdom[0].score}). Skipping.`);
                return { status: 'skipped', reason: 'duplicate_idea' };
            }

            // 4. Update Backlog (Phase-Aware Insertion)
            const newTodoLine = `- [ ] TODO: [GOD_MODE] ${newFeature}`;
            let updatedTodo = todo;

            const phaseMarker = targetPhase.toUpperCase();
            if (todo.includes(phaseMarker)) {
                // Insert after the phase header
                const lines = todo.split('\n');
                const phaseIndex = lines.findIndex(l => l.toUpperCase().includes(phaseMarker));
                lines.splice(phaseIndex + 1, 0, newTodoLine);
                updatedTodo = lines.join('\n');
            } else {
                updatedTodo = todo + '\n' + newTodoLine;
            }

            await this.fs.writeFile('TODO.md', updatedTodo);

            await this.base44.logActivity('PRODUCT_OWNER', `Created new strategic task: ${newFeature}`).catch(() => { });

            return { status: 'new_task_created', task: newFeature };

        } catch (error: any) {
            console.error('❌ Product Owner Error:', error.message);
            return { status: 'error', error: error.message };
        }
    }

    private async scanDirectory(path: string, maxDepth: number): Promise<string> {
        try {
            const files = await this.fs.listFiles(`${path}/**/*`);
            return files.slice(0, 20).join(', ') + (files.length > 20 ? '...' : '');
        } catch {
            return '[Error scanning directory]';
        }
    }

    private async countFiles(path: string, extensions: string[]): Promise<number> {
        try {
            const pattern = `${path}/**/*{${extensions.join(',')}}`;
            const files = await this.fs.listFiles(pattern);
            return files.length;
        } catch {
            return 0;
        }
    }
}
