import { whatsappBridge } from './core/whatsapp_bridge.js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runTest() {
    console.log('🚀 [Test] Starting Direct WhatsApp Bridge Delivery Test...');

    // Initialize the bridge
    await whatsappBridge.start();

    // Poll for connection (up to 10 minutes)
    console.log('⏳ [Test] Waiting for connection (Timeout: 10m)...');
    let attempts = 0;
    while (!(whatsappBridge as any).isConnected && attempts < 600) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    if (!(whatsappBridge as any).isConnected) {
        console.error('❌ [Test] Connection timeout. Please ensure you have scanned the QR code.');
        process.exit(1);
    }

    console.log('✅ [Test] Bridge Connected. Sending message...');

    const message = '🌌 [DIRECT SOVEREIGN SIGNAL]\n' +
        'Status: ONLINE\n' +
        'Verification: SUCCESSFUL\n' +
        'Latency: < 1s\n' +
        'The Direct Bridge is now fully operational within the swarm core.';

    await whatsappBridge.pushUpdate(message);

    console.log('🏁 [Test] Final signal dispatched. Terminating test in 5s...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    process.exit(0);
}

runTest().catch(err => {
    console.error('❌ [Test] Fatal Error:', err);
    process.exit(1);
});
