// SWARM COLLABORATION BRIDGE - Query swarm task status
const { createClient } = require('@base44/sdk');
require('dotenv').config({ path: '../.env.local' });

const client = createClient({
    key: process.env.BASE44_API_KEY,
    secret: process.env.BASE44_API_KEY,
    appId: process.env.BASE44_APP_ID,
    serverUrl: process.env.BASE44_API_URL || 'https://appforge.fun'
});

async function querySwarmStatus(taskKeyword) {
    console.log(`🔍 Querying swarm for tasks matching: "${taskKeyword}"\n`);

    const logs = await client.entities.AuditLog.list({
        filter: { action_type: 'SWARM_SIGNAL' },
        sort: { createdAt: 'desc' },
        limit: 50
    });

    const items = logs?.items || logs?.data || logs || [];
    const matching = items.filter(log =>
        log?.description?.toLowerCase().includes(taskKeyword.toLowerCase())
    );

    console.log(`Found ${matching.length} matching tasks:\n`);

    matching.forEach((task, i) => {
        const status = task?.changes?.status || 'UNKNOWN';
        const desc = task?.description || 'No description';
        console.log(`${i + 1}. [${status}] ${desc.substring(0, 60)}...`);
        if (status === 'COMPLETED' && task?.changes?.results) {
            console.log(`   Results: ${JSON.stringify(task.changes.results).substring(0, 100)}...`);
        }
    });

    return matching;
}

const keyword = process.argv.slice(2).join(' ');
if (keyword) {
    querySwarmStatus(keyword).catch(console.error);
} else {
    console.log('Usage: node query_swarm.js <keyword>');
}
