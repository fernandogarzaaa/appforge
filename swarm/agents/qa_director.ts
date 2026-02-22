import * as fs from 'fs/promises';
import * as path from 'path';
import { QAScoutAgent } from './qa_scout_agent.js';
import { QAValidatorAgent } from './qa_validator_agent.js';
import { QAMutatorAgent } from './qa_mutator_agent.js';

export class QADirector {
    private scout: QAScoutAgent;
    private validator: QAValidatorAgent;
    private mutator: QAMutatorAgent;

    constructor() {
        this.scout = new QAScoutAgent();
        this.validator = new QAValidatorAgent();
        this.mutator = new QAMutatorAgent();
    }

    async executeQAWorkflow(baseUrl: string, routes: string[], targetFeature: string) {
        console.log(`\n👑 [QADirector] Initiating QA Swarm Workflow for: ${targetFeature} at ${baseUrl}`);
        console.log(`👑 [QADirector] Targets: ${routes.join(', ')}`);

        // 1. Scout the routes
        const domMaps = await this.scout.scoutRoutes(routes.map(r => `${baseUrl}${r}`));

        if (Object.keys(domMaps).length === 0) {
            console.error('👑 [QADirector] Workflow aborted: Scout failed to map any DOMs.');
            return;
        }

        const testDir = path.join(process.cwd(), 'tests', 'e2e');
        await fs.mkdir(testDir, { recursive: true });

        // 2. Iterate through discovered routes and generate tests
        for (const [route, domMap] of Object.entries(domMaps)) {
            console.log(`👑 [QADirector] Processing route: ${route}`);

            // 2b. Plan Mutation Sequence
            const mutationSequence = await this.mutator.planMutationSequence(domMap, targetFeature);

            // 3. Validate and generate script
            console.log(`👑 [QADirector] Handing Mutation Sequence for ${route} to Validator...`);
            const testBlock = await this.validator.generateTestScript(domMap, targetFeature, mutationSequence);

            // Extract pure code snippet if the LLM returned markdown
            let scriptContent = typeof testBlock === 'string' ? testBlock : JSON.stringify(testBlock, null, 2);

            // Sometimes consultOracle returns an object with a recommendation property
            if (typeof testBlock === 'object' && testBlock !== null && 'recommendation' in testBlock) {
                scriptContent = testBlock.recommendation;
            }

            if (scriptContent.includes('```')) {
                const match = scriptContent.match(/```(?:typescript|ts|javascript|js)?\n([\s\S]*?)\n```/);
                if (match?.[1]) {
                    scriptContent = match[1];
                }
            }

            // POST-PROCESSING: Make the test more robust
            // Replace relative goto('/') with absolute URL
            scriptContent = scriptContent.replace(/page\.goto\(['"]\/['"]\)/g, `page.goto('${baseUrl}')`);
            // Add timeout to expect
            scriptContent = scriptContent.replace(/toBeVisible\(\)/g, `toBeVisible({ timeout: 15000 })`);

            const fullTestFile = `import { test, expect } from '@playwright/test';\n\n${scriptContent}\n`;

            // 3. Persist the generated test
            const testDir = path.join(process.cwd(), 'tests', 'e2e');
            await fs.mkdir(testDir, { recursive: true });

            const cleanRoute = route.replace(/\//g, '_') || 'root';
            const testPath = path.join(testDir, `generated_swarm_test_${cleanRoute}.spec.ts`);
            await fs.writeFile(testPath, fullTestFile, 'utf8');

            console.log(`👑 [QADirector] Generated Playwright test for ${route} saved to: ${testPath}`);
        }

        console.log(`👑 [QADirector] QA Cycle Complete!`);
    }
}
