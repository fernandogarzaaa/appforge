import { whatsappBridge } from './swarm/core/whatsapp_bridge.js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, 'swarm/.env.local') });

async function sendTest() {
    console.log('📱 [Transmission] Initiating Sovereign Signal Test...');

    // Ensure bridge has the latest JID from env
    (whatsappBridge as any).phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;

    if (!whatsappBridge.getPhoneNumber()) {
        console.error('❌ Error: WHATSAPP_PHONE_NUMBER not set in .env.local');
        return;
    }

    const message = '🌌 [SOVEREIGN SIGNAL]\n' +
        'Status: VERIFIED\n' +
        'Phase: 23 (Distributed Sovereignty)\n' +
        'Timestamp: ' + new Date().toISOString() + '\n' +
        'Sovereign expansion sequence ready for activation.';

    try {
        await whatsappBridge.pushUpdate(message);
        console.log('✅ Signal Sent Successfully. Check your WhatsApp group.');
    } catch (err) {
        console.error('❌ Transmission Failed:', err);
    }
}

sendTest().catch(console.error);
