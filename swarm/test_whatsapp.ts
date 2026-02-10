
import { whatsappBridge } from './core/whatsapp_bridge.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verify() {
    console.log('🌌 [WHATSAPP VERIFICATION] Testing Sovereign Bridge...\n');

    const number = process.env.WHATSAPP_PHONE_NUMBER;
    if (!number) {
        console.error('❌ ERROR: WHATSAPP_PHONE_NUMBER not found in .env.local');
        console.log('\nPlease add your number to .env.local: WHATSAPP_PHONE_NUMBER=+CountryCodeXXXXXXX');
        return;
    }

    console.log(`📡 Attempting to send "Transcendence Sync" to ${number}...`);

    await whatsappBridge.pushUpdate(`🌌 [PHASE 16] Transcendence Sync Initialized. Remote control active.`);

    console.log('\n✅ Verification Script Complete.');
    console.log('\n⚠️  IMPORTANT: If this is your first time, you MUST run the login command:');
    console.log('   npx openclaw channels login --channel whatsapp');
}

verify().catch(console.error);
