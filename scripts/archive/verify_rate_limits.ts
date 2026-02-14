
import { createClient } from '@base44/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

async function verifyTiming() {
    console.log('📡 [VERIFICATION] ANALYZING SIGNAL TIMING...');

    const client = createClient({
        key: process.env.BASE44_API_KEY,
        secret: process.env.BASE44_API_KEY,
        appId: process.env.BASE44_APP_ID,
        serverUrl: process.env.BASE44_API_URL || 'https://appforge.fun'
    } as any);

    try {
        const logs = await client.entities.AuditLog.list({
            filter: { action_type: 'ANTIGRAVITY_SIGNAL' },
            order: { created_at: 'desc' },
            limit: 10
        });

        const items = Array.isArray(logs) ? logs : (logs.items || logs.data || []);

        console.log(`Found ${items.length} recent signals.`);

        items.forEach((item, index) => {
            console.log(`[${index}] ${item.created_at} - ${item.description} - Status: ${item.changes?.status}`);
        });

        if (items.length > 1) {
            const t1 = new Date(items[0].created_at).getTime();
            const t2 = new Date(items[1].created_at).getTime();
            const diff = Math.abs(t1 - t2);
            console.log(`\nDelta between last two signals: ${diff}ms`);

            if (diff > 500) {
                console.log('✅ Jitter detected! Signals are staggered.');
            } else {
                console.log('⚠️ Signals are very close. Jitter might be minimal or not yet active in this window.');
            }
        }

    } catch (e) {
        console.error('❌ Audit Error:', e.message);
    }
}

verifyTiming();
