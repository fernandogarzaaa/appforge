import { realitySensor } from '../swarm/core/reality_sensor.js';
import { SingularityEngine } from '../swarm/core/singularity_engine.js';
import { p2pResonance } from '../swarm/core/p2p_resonance.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');

async function testCIPulse() {
    console.log('🧪 [Test] Starting CI-Aligned Pulse Verification...');

    // 1. Setup CI environment mock
    process.env.GITHUB_ACTIONS = 'true';
    process.env.GITHUB_RUN_ID = '999999999';
    process.env.GITHUB_EVENT_NAME = 'push';

    // 2. Inject failure signals
    const logPath = path.join(PROJECT_ROOT, 'build_logs.txt');
    fs.writeFileSync(logPath, 'ERROR: Build failed in GH Actions.');

    // 3. Scan Reality
    const signals = await realitySensor.scan();
    const hasCI = signals.some(s => s.type === 'CI_ACTIVE');
    const hasFailure = signals.some(s => s.type === 'BUILD_FAILURE');

    console.log(`   ✅ CI Signal Detected: ${hasCI}`);
    console.log(`   ✅ Failure Signal Detected: ${hasFailure}`);

    if (!hasCI || !hasFailure) {
        throw new Error('Test Failed: RealitySensor did not detect CI environment or injected failure.');
    }

    // 4. Verify Intelligence Pulse logic (simplified)
    console.log('\n🧠 2. Verifying Pulse Synthesis...');
    const singularity = new SingularityEngine();
    await singularity.executeSelfImprovementCycle();

    console.log('\n✨ SUCCESS: CI-Aligned Inception Pulse verified.');

    // Cleanup
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
}

testCIPulse().catch(err => {
    console.error('❌ CI Pulse Test Failed:', err.message);
    process.exit(1);
});
