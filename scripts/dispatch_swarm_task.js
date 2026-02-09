
import { createClient } from '@base44/sdk';

import path from 'path';
import { fileURLToPath } from 'url';

// Resolve .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');


// Manual .env.local parsing (No dotenv dependency)
import fs from 'fs';
try {
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value && !key.startsWith('#')) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.warn('Could not load .env.local:', e.message);
}

const serverUrl = process.env.BASE44_API_URL || 'https://appforge.fun';

const client = createClient({
    key: process.env.BASE44_API_KEY,
    secret: process.env.BASE44_API_KEY,
    appId: process.env.BASE44_APP_ID,
    serverUrl: serverUrl
});

async function dispatchTask(description) {
    console.log(`📡 Dispatching task to Swarm at ${serverUrl}...`);
    console.log(`📝 Task: "${description}"`);

    try {
        const result = await client.entities.AuditLog.create({
            action_type: 'SWARM_SIGNAL',
            description: description,
            resource_type: 'system',
            performed_by: 'cli_user',
            changes: {
                status: 'PENDING',
                source: 'cli_dispatch',
                priority: 'high'
            }
        });

        console.log('✅ Task Dispatched Successfully!');
        console.log(`🆔 Task ID: ${result.id || result._id}`);
        console.log('🐝 The swarm should pick this up in ~5 seconds.');
    } catch (error) {
        console.error('❌ Failed to dispatch task:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', await error.response.text());
        }
    }
}

const taskDescription = process.argv[2] || 'Analyze codebase health';
dispatchTask(taskDescription);
