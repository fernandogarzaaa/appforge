import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve .env.local and set env vars BEFORE importing the bridge
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Force BlueBubbles mode for test
process.env.IMESSAGE_TRANSPORT_MODE = 'bluebubbles';

// NOW import the bridge
import { imessageBridge } from './core/imessage_bridge.js';

async function testBlueBubbles() {
    console.log('🌌 [Test] Initiating BlueBubbles Windows-Compatibility Test...');

    // Check for required env vars
    const url = process.env.BLUEBUBBLES_SERVER_URL;
    const pwd = process.env.BLUEBUBBLES_PASSWORD;
    const recipient = process.env.IMESSAGE_RECIPIENT;

    if (!url || !pwd || !recipient) {
        console.warn('⚠️ [Test] Missing BlueBubbles environment variables. Test will perform a logic-only validation.');
        console.log('   - URL:', url || 'MISSING');
        console.log('   - Password:', pwd ? '********' : 'MISSING');
        console.log('   - Recipient:', recipient || 'MISSING');
    }

    try {
        await imessageBridge.start();
        console.log('✅ [Test] Bridge Initialized in BlueBubbles Mode.');

        console.log(`📨 [Test] Attempting BlueBubbles Dispatch to: ${recipient || 'DEMO_TARGET'}`);
        await imessageBridge.pushUpdate(recipient || 'demo@example.com', '🌌 Sovereign Signal: BlueBubbles Bridge Verified from Windows.');

        console.log('✅ [Test] Dispatch attempt complete. Check BlueBubbles logs/app for confirmation.');
    } catch (err) {
        console.error('❌ [Test] BlueBubbles Verification Failed:', err);
    } finally {
        await imessageBridge.stop();
        console.log('🌌 [Test] Sequence Complete.');
    }
}

testBlueBubbles().catch(console.error);
