/**
 * SWARM COLLABORATION BRIDGE
 * Enables bidirectional communication between Antigravity (me) and the Swarm
 */

const { createClient } = require('@base44/sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });


dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const client = createClient({
    key: process.env.BASE44_API_KEY,
    secret: process.env.BASE44_API_KEY,
    appId: process.env.BASE44_APP_ID,
    serverUrl: process.env.BASE44_API_URL || 'https://appforge.fun'
});

/**
 * Query swarm task status and results
 */
async function getSwarmTaskResults(taskDescription) {
    console.log(`🔍 Querying swarm for: "${taskDescription}"`);

    try {
        // Query recent SWARM_SIGNAL tasks
        const logs = await client.entities.AuditLog.list({
            filter: { action_type: 'SWARM_SIGNAL' },
            sort: { createdAt: 'desc' },
            limit: 20
        });

        const items = logs?.items || logs?.data || logs || [];

        // Find matching task
        const task = items.find(log =>
            log?.description?.includes(taskDescription) ||
            log?.changes?.description?.includes(taskDescription)
        );

        if (!task) {
            return { status: 'not_found', message: 'Task not found in recent swarm activity' };
        }

        const status = task?.changes?.status || 'PENDING';
        const results = task?.changes?.results;

        return {
            status: status,
            taskId: task.id,
            results: results,
            createdAt: task.createdAt
        };
    } catch (error) {
        console.error('Error querying swarm:', error.message);
        return { status: 'error', message: error.message };
    }
}

/**
 * Dispatch work to swarm and wait for completion
 */
async function collaborateWithSwarm(taskDescription, maxWaitMinutes = 5) {
    console.log(`🤝 COLLABORATION: Dispatching to swarm...`);
    console.log(`   Task: ${taskDescription}`);
    console.log(`   Max wait: ${maxWaitMinutes} minutes\n`);

    // 1. Dispatch task
    await client.entities.AuditLog.create({
        action_type: 'SWARM_SIGNAL',
        description: taskDescription,
        resource_type: 'antigravity_collaboration',
        performed_by: 'antigravity',
        changes: { status: 'PENDING', source: 'antigravity_collab' }
    });

    console.log('✅ Task dispatched to swarm\n');

    // 2. Poll for completion
    const startTime = Date.now();
    const maxWaitMs = maxWaitMinutes * 60 * 1000;
    const pollInterval = 10000; // 10 seconds

    while ((Date.now() - startTime) < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const result = await getSwarmTaskResults(taskDescription);

        if (result.status === 'COMPLETED') {
            console.log('✅ Swarm completed the task!\n');
            console.log('Results:', JSON.stringify(result.results, null, 2));
            return result;
        } else if (result.status === 'error') {
            console.log('❌ Error occurred:', result.message);
            return result;
        } else {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(`⏳ Waiting... (${elapsed}s elapsed, status: ${result.status})`);
        }
    }

    console.log(`⏰ Timeout: Swarm did not complete task in ${maxWaitMinutes} minutes`);
    return { status: 'timeout', message: 'Task timeout' };
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];
const taskDesc = args.slice(1).join(' ');

if (command === 'query' && taskDesc) {
    getSwarmTaskResults(taskDesc).then(result => {
        console.log('\n📊 RESULT:', JSON.stringify(result, null, 2));
    });
} else if (command === 'collab' && taskDesc) {
    collaborateWithSwarm(taskDesc).then(result => {
        console.log('\n🏁 COLLABORATION COMPLETE');
    });
} else {
    console.log('Usage:');
    console.log('  node swarm_collaboration.js query <task description>');
    console.log('  node swarm_collaboration.js collab <task description>');
}

module.exports = { getSwarmTaskResults, collaborateWithSwarm };
