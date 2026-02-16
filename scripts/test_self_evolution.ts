import { SingularityEngine } from '../swarm/core/singularity_engine.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');

async function testSelfEvolution() {
    console.log('🧪 [TestSelfEvolution] Starting verification...');

    const engine = new SingularityEngine();

    // Create a temporary file to patch
    const testFile = 'swarm/core/evolution_target_test.ts';
    const initialContent = `
/**
 * Test file for autonomous evolution
 */
export function testEvolution() {
    console.log("Initial state");
}
`;
    await fs.writeFile(path.join(PROJECT_ROOT, testFile), initialContent, 'utf8');

    console.log(`📝 Created test file: ${testFile}`);

    // Mock Reality/Evolution Mode
    process.env.EVOLUTION_REALIZATION_DISABLED = 'false';

    // We can't easily mock the Oracle response here without deeper integration,
    // but we can manually invoke the patcher to verify it works, 
    // and then simulate a cycle that CALLS the engine.

    console.log('🔄 Executing self-improvement cycle (Simulated)...');

    // We'll perform a "Manual Realization" to verify the Patcher integration in the Engine
    // (This is what realizeImprovements does internally)

    const patchData = {
        targetContent: 'console.log("Initial state");',
        replacementContent: 'console.log("Autonomous realization achieved at " + new Date().toISOString());'
    };

    // Access private patcher for test (casting to any)
    const engineAny = engine as any;
    const patchResult = await engineAny.patcher.applyPatches(testFile, [patchData]);

    if (patchResult.success) {
        console.log('✅ [Patcher] Successfully applied autonomous patch.');
        const updatedContent = await fs.readFile(path.join(PROJECT_ROOT, testFile), 'utf8');
        if (updatedContent.includes('Autonomous realization achieved')) {
            console.log('✅ [Verification] Content mismatch resolved. Realization confirmed.');
        } else {
            console.error('❌ [Verification] Content update failed!');
        }
    } else {
        console.error(`❌ [Patcher] Patch failed: ${patchResult.error}`);
    }

    // Cleanup
    await fs.unlink(path.join(PROJECT_ROOT, testFile));
    console.log('🧹 Cleanup complete.');
}

testSelfEvolution().catch(console.error);
