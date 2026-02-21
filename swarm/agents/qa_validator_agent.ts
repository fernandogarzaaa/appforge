import { QuantumSwarmCore } from '../core/quantum_core.js';

export class QAValidatorAgent {
    private quantumCore: QuantumSwarmCore;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
    }

    async generateTestScript(domMap: any, targetFeature: string): Promise<string> {
        console.log(`🛡️ [QAValidatorAgent] Analyzing DOM map to assert feature: ${targetFeature}`);

        if (!domMap || !domMap.interactables) {
            return `// Error: Invalid DOM Map provided`;
        }

        const simplifiedMap = JSON.stringify({
            title: domMap.title,
            headings: domMap.headings,
            interactables: domMap.interactables.slice(0, 15) // take top 15 to avoid massive prompts
        });

        const prompt = `Based on the following semantic DOM map, write a complete Playwright test block that verifies the "${targetFeature}". 
CRITICAL: Use the exact 'text' or 'id' found in the 'interactables' list below to create locators. DO NOT make up text.
If you see a button that looks like a wallet or connect button, use its exact text (e.g., "Select Wallet").

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
