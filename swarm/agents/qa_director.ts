import * as fs from 'fs/promises';
import * as path from 'path';
import { QAScoutAgent } from './qa_scout_agent.js';
import { QAValidatorAgent } from './qa_validator_agent.js';

export class QADirector {
    private scout: QAScoutAgent;
    private validator: QAValidatorAgent;

    constructor() {
        this.scout = new QAScoutAgent();
        this.validator = new QAValidatorAgent();
    }

    async executeQAWorkflow(baseUrl: string, targetFeature: string) {
        console.log(`\n👑 [QADirector] Initiating QA Swarm Workflow for: ${targetFeature} at ${baseUrl}`);

        // 1. Scout the page
        const domMap = await this.scout.scoutRoute(baseUrl);

        if (!domMap) {
            console.error('👑 [QADirector] Workflow aborted: Scout failed to map the DOM.');
            return;
        }

        // 2. Validate and generate script
        console.log(`👑 [QADirector] Handing DOM mapped context to Validator...`);
        const testBlock = await this.validator.generateTestScript(domMap, targetFeature);

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

        const testPath = path.join(testDir, 'generated_swarm_test.spec.ts');
        await fs.writeFile(testPath, fullTestFile, 'utf8');

        console.log(`👑 [QADirector] QA Cycle Complete! Generated Playwright test saved to: ${testPath}`);
    }
}
