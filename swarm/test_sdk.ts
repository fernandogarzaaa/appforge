import { openclaw } from 'openclaw';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testSDK() {
    console.log('🧪 Testing OpenClaw SDK directly...');
    const target = process.env.WHATSAPP_PHONE_NUMBER;

    if (!target) {
        console.error('Target JID not found');
        return;
    }

    try {
        // Attempting to send via SDK if available
        // Note: I need to guess the API since I haven't seen the SDK docs
        // Usually it might be openclaw.sendMessage(...)
        console.log(`📡 Attempting send to ${target}...`);

        // This is a guess - checking if openclaw has any send methods
        console.log('Available OpenClaw keys:', Object.keys(openclaw || {}));

    } catch (e) {
        console.error('SDK test failed:', e);
    }
}

testSDK();
