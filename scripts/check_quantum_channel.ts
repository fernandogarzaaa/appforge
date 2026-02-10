
import { Base44Tool } from '../swarm/tools/base44.js';

async function checkPendingSignals() {
    console.log('🔍 Checking Quantum Channel for pending signals...');
    const base44 = new Base44Tool();

    try {
        const logs = await base44.client.entities.AuditLog.list({
            filter: {
                action_type: 'ANTIGRAVITY_SIGNAL',
                entity_id: 'llm_request'
            },
            order: { created_at: 'desc' },
            limit: 10
        });

        const pending = logs.filter((log: any) => log.changes?.status === 'PENDING');

        if (pending.length > 0) {
            console.log(`📡 Found ${pending.length} PENDING signals!`);
            pending.forEach((p: any) => {
                console.log(`   - ID: ${p.changes.requestId} | Prompt: ${p.changes.prompt.user.substring(0, 50)}...`);
            });
        } else {
            console.log('✅ No pending signals found. Swarm LLM requests are either completed or idle.');
        }

        const completed = logs.filter((log: any) => log.changes?.status === 'COMPLETED');
        console.log(`✅ Found ${completed.length} successfully COMPLETED signals in history.`);

    } catch (error: any) {
        console.error(`❌ Error checking channel: ${error.message}`);
    }
}

checkPendingSignals();
