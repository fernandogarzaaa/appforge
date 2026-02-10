
import { createClient } from '@base44/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

async function catchFindings() {
    console.log('🔮 CATCHING SWARM FINDINGS...');

    if (!process.env.BASE44_API_KEY) {
        console.error('❌ BASE44_API_KEY not found');
        return;
    }

    const client = createClient({
        key: process.env.BASE44_API_KEY,
        secret: process.env.BASE44_API_KEY,
        appId: process.env.BASE44_APP_ID,
        serverUrl: process.env.BASE44_API_URL || 'https://appforge.fun'
    });

    try {
        const logs = await client.entities.AuditLog.list({
            filter: {
                action_type: 'ANTIGRAVITY_SIGNAL'
            },
            order: { created_at: 'desc' },
            limit: 20
        });

        // SDK response might be .items or direct array
        const items = Array.isArray(logs) ? logs : (logs.items || logs.data || []);

        const pending = items.filter(l => l.changes && l.changes.status === 'PENDING');

        if (pending.length === 0) {
            console.log('✅ No pending findings at this moment.');
            return;
        }

        console.log(`📡 Caught ${pending.length} Findings from the Swarm:`);
        for (const p of pending) {
            console.log(`\n[${p.id}] Agent Request: ${p.changes.requestId}`);
            console.log(`User Prompt: ${JSON.stringify(p.changes.prompt.user)}`);

            // To respond, you would:
            /*
            await client.entities.AuditLog.update(p.id, {
                changes: { 
                    status: 'COMPLETED', 
                    result: 'Your generated fix or analysis goes here' 
                }
            });
            */
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

catchFindings();
