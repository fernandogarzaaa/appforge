import { QuantumSwarmCore } from '../core/quantum_core.js';

export class QAValidatorAgent {
    private quantumCore: QuantumSwarmCore;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
    }

    async generateTestScript(domMap: any, targetFeature: string, mutationSequence: any[] = []): Promise<string> {
        console.log(`🛡️ [QAValidatorAgent] Analyzing DOM map and mutation sequence to assert feature: ${targetFeature}`);

        if (!domMap || !domMap.interactables) {
            return `// Error: Invalid DOM Map provided`;
        }

        const simplifiedMap = JSON.stringify({
            title: domMap.title,
            headings: domMap.headings,
            interactables: domMap.interactables.slice(0, 15)
        });

        const prompt = `Based on the following semantic DOM map and mutation sequence, write a complete Playwright test block that verifies the "${targetFeature}". 
CRITICAL: Use the exact 'text' or 'id' found in the 'interactables' list below to create locators. 

Mutation Sequence (Target Actions):
${JSON.stringify(mutationSequence, null, 2)}

DOM Context: ${simplifiedMap}`;

        const testBlock = await this.quantumCore.consultOracle(
            prompt,
            [
                `test('verifies ${targetFeature}', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=${targetFeature || 'App'}').first()).toBeVisible();
});`,
                `test('interacts with ${targetFeature}', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('button', { hasText: /${targetFeature}/i }).first();
    await expect(btn).toBeVisible();
});`,
                `test('validates core UI elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
});`
            ],
            ['reliability', 'locator_strength']
        );

        return typeof testBlock === 'string' ? testBlock : testBlock.recommendation || testBlock;
    }
}
