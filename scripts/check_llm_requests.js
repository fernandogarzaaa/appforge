// Check for LLM requests waiting for Antigravity
const { createClient } = require('@base44/sdk');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    key: process.env.BASE44_API_KEY,
    secret: process.env.BASE44_API_KEY,
    appId: process.env.BASE44_APP_ID,
    serverUrl: process.env.BASE44_API_URL || 'https://appforge.fun'
});

async function checkLLMRequests() {
    console.log('🔍 Checking for LLM requests waiting for Antigravity...\n');

    try {
        // Query ANTIGRAVITY_SIGNAL tasks
        const logs = await client.entities.AuditLog.list({
            filter: { action_type: 'ANTIGRAVITY_SIGNAL' },
            sort: { createdAt: 'desc' },
            limit: 20
        });

        const items = logs?.items || logs?.data || logs || [];

        console.log(`📊 Total ANTIGRAVITY_SIGNAL tasks: ${items.length}\n`);

        // Categorize by status
        const pending = items.filter(t => t?.changes?.status === 'PENDING');
        const inProgress = items.filter(t => t?.changes?.status === 'IN_PROGRESS');
        const completed = items.filter(t => t?.changes?.status === 'COMPLETED');

        console.log(`⏳ PENDING: ${pending.length}`);
        console.log(`🔄 IN_PROGRESS: ${inProgress.length}`);
        console.log(`✅ COMPLETED: ${completed.length}\n`);

        if (pending.length > 0) {
            console.log('📋 PENDING LLM REQUESTS:\n');
            pending.forEach((task, i) => {
                const prompt = task?.changes?.prompt;
                const requestId = task?.changes?.requestId;
                console.log(`${i + 1}. Request ID: ${requestId}`);
                if (prompt) {
                    console.log(`   System: ${prompt.system?.substring(0, 60)}...`);
                    console.log(`   User: ${prompt.user?.substring(0, 60)}...`);
                }
                console.log('');
            });
        }

        if (inProgress.length > 0) {
            console.log('🔄 IN_PROGRESS LLM REQUESTS:\n');
            inProgress.forEach((task, i) => {
                const requestId = task?.changes?.requestId;
                console.log(`${i + 1}. Request ID: ${requestId} (awaiting Antigravity response)`);
            });
        }

        return { pending, inProgress, completed };
    } catch (error) {
        console.error('Error:', error.message);
        return { pending: [], inProgress: [], completed: [] };
    }
}

checkLLMRequests().then(result => {
    console.log('\n✅ Check complete');
    if (result.pending.length === 0 && result.inProgress.length === 0) {
        console.log('💤 No LLM requests waiting for Antigravity');
    } else {
        console.log(`🚨 ${result.pending.length + result.inProgress.length} requests need attention`);
    }
});
