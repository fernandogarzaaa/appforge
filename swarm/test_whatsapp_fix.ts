import { whatsappBridge } from './core/whatsapp_bridge.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verifyBridge() {
    console.log('🧪 [Verification] Replaying WhatsApp Logs through Bridge (Internal Mode)...');

    // 1. Force timestamp to 0 to process all of today's logs
    (whatsappBridge as any).lastProcessedTimestamp = 0;

    // 2. Poll commands
    const commands = await whatsappBridge.pollCommands();

    console.log(`\n📊 Results: Found ${commands.length} valid commands in logs.`);
    for (const cmd of commands) {
        console.log(`   🔸 Command identified: ${cmd}`);
    }

    if (commands.length > 0) {
        console.log('\n✅ VERIFICATION SUCCESS: Bridge is correctly parsing and matching logs.');
    } else {
        console.warn('\n⚠️ VERIFICATION INCOMPLETE: No commands found in logs. (Maybe no messages sent today?)');

        const today = new Date().toISOString().split('T')[0];
        const logPath = `C:/tmp/openclaw/openclaw-${today}.log`;
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf-8');
            const hasInbound = content.includes('inbound message');
            console.log(`🔍 Raw Log check: "inbound message" exists? ${hasInbound}`);
        }
    }
}

verifyBridge().catch(console.error);
