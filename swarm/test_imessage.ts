import { imessageBridge } from './core/imessage_bridge.js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testIMessage() {
    console.log('🌌 [Test] Initiating Sovereign iMessage Signal Test...');

    try {
        await imessageBridge.start();

        const target = process.env.IMESSAGE_RECIPIENT || 'test@example.com';
        const message = "🌌 Sovereign Signal: iMessage Bridge Online. Extraction Complete.";

        await imessageBridge.pushUpdate(target, message);

        console.log('✅ [Test] Signal dispatched.');

        // Keep process alive briefly to catch any errors or notifications
        setTimeout(() => {
            console.log('🏁 [Test] Shutting down.');
            process.exit(0);
        }, 5000);

    } catch (err) {
        console.error('❌ [Test] Bridge Failure:', err);
        process.exit(1);
    }
}

testIMessage();
