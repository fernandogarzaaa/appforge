import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { sovereignBridge } from './core/sovereign_bridge.js';

async function testUnifiedBridge() {
    console.log('🌌 [Test] Initiating Unified Sovereign Bridge Verification...');

    // Check state
    const bhUrl = process.env.BLUEBUBBLES_SERVER_URL;
    const waPhone = process.env.WHATSAPP_PHONE_NUMBER;

    console.log(`🔍 [Test] Environment State:`);
    console.log(`   - BlueBubbles Server: ${bhUrl || 'NOT CONFIGURED'}`);
    console.log(`   - WhatsApp Recipient: ${waPhone || 'NOT CONFIGURED'}`);

    try {
        await sovereignBridge.start();
        console.log('✅ [Test] Bridge Ready.');

        console.log('📡 [Test] Dispatching Unified Test Pulse...');
        await sovereignBridge.pushUpdate('🌌 Sovereign Signal: Unified Bridge Verification (Resilience Test)');

        console.log('✅ [Test] Pulse Dispatched in Unified Mode.');
    } catch (err) {
        console.error('❌ [Test] Unified Verification Failed:', err);
    } finally {
        await sovereignBridge.stop();
        console.log('🌌 [Test] Sequence Complete.');
    }
}

testUnifiedBridge().catch(console.error);
