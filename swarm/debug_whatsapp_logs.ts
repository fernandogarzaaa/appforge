import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
console.log(`📱 Configured Phone/Group: ${phoneNumber}`);

async function debugPoll() {
    const today = new Date().toISOString().split('T')[0];
    const logPath = `C:/tmp/openclaw/openclaw-${today}.log`;

    if (!fs.existsSync(logPath)) {
        console.error(`❌ Log file not found: ${logPath}`);
        return;
    }

    console.log(`🔍 Analyzing log: ${logPath}`);
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    console.log(`📊 Total lines: ${lines.length}`);
    let inboundCount = 0;

    for (const line of lines) {
        try {
            const data = JSON.parse(line);
            if (data["2"] === "inbound message") {
                inboundCount++;
                let msg = data["1"];
                if (typeof msg === 'string') {
                    msg = JSON.parse(msg);
                }

                console.log(`\n📩 Inbound Found:`);
                console.log(`   From: ${msg.from}`);
                console.log(`   To: ${msg.to}`);
                console.log(`   Body: ${msg.body}`);
                console.log(`   Timestamp: ${msg.timestamp}`);

                const matchFrom = msg.from === phoneNumber;
                const matchTo = msg.to === phoneNumber;
                console.log(`   Matches Config? From: ${matchFrom}, To: ${matchTo}`);
            }
        } catch (e) {
            // skip
        }
    }
    console.log(`\n✅ Summary: Found ${inboundCount} inbound messages.`);
}

debugPoll().catch(console.error);
