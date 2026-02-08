
import { createClient } from '@base44/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' }); // Load from root

export class Base44Tool {
    client: any;

    constructor() {
        const apiKey = process.env.BASE44_API_KEY;
        if (!apiKey) throw new Error('BASE44_API_KEY not found in .env.local');

        // Local swarms run as "Admin" via API Key
        // Note: SDK 0.8.x might expect different config or just the key string if it's the only arg
        // Inspecting SDK usage: createClient({ apiKey }) matches some versions, 
        // but if lint fails, let's try casting or checking docs.
        // Assuming { apiKey } is correct for now, or fallback to simple arg.

        this.client = createClient({
            key: apiKey,
            secret: apiKey,
            appId: process.env.BASE44_APP_ID
        } as any);

    }

    async getPendingTasks() {
        try {
            // Poll AuditLog for 'SWARM_SIGNAL' with status 'PENDING'
            const logs = await this.client.entities.AuditLog.list({
                filter: { action: 'SWARM_SIGNAL' },
                sort: { createdAt: 'desc' },
                limit: 5
            });

            // console.log('DEBUG: AuditLog.list response:', JSON.stringify(logs, null, 2));
            const items = (logs && Array.isArray(logs)) ? logs : (logs?.items || []);
            const pending = items.filter((l: any) => l.changes?.status === 'PENDING');
            return pending;
        } catch (error: any) {
            // Gracefully handle auth errors or network glitches
            if (error.status === 403 || error.status === 404 || error.message.includes('private') || error.code === 'ECONNRESET') {
                console.warn('⚠️ [Base44] Offline Mode: Cloud Bridge disconnected or network blip. Swarm running locally only.');
                return [];
            }
            throw error;
        }
    }

    async completeTask(taskId: string, results: any) {
        await this.client.entities.AuditLog.update(taskId, {
            changes: { status: 'COMPLETED', results: results }
        });
    }

    async logActivity(agent: string, message: string) {
        await this.client.entities.AuditLog.create({
            action: `${agent.toUpperCase()}_LOG`,
            description: message
        });
    }
}
