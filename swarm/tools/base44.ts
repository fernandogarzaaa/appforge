
import { createClient } from 'npm:@base44/sdk@0.8.18';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' }); // Load from root

export class Base44Tool {
    client: any;

    constructor() {
        const apiKey = process.env.BASE44_API_KEY;
        if (!apiKey) throw new Error('BASE44_API_KEY not found in .env.local');

        // Local swarms run as "Admin" via API Key
        this.client = createClient({
            apiKey: apiKey,
            // baseUrl: 'https://api.base44.com' // Default
        });
    }

    async getPendingTasks() {
        // Poll AuditLog for 'SWARM_SIGNAL' with status 'PENDING'
        // Since we might not have a dedicated Task entity, we use AuditLog query
        // "Find AuditLogs where action = 'SWARM_SIGNAL' and changes->status = 'PENDING'"
        // SDK might not support deep JSON filter, so we fetch recent signals and filter in-memory
        const logs = await this.client.entities.AuditLog.list({
            filter: { action: 'SWARM_SIGNAL' },
            sort: { createdAt: 'desc' },
            limit: 5
        });

        const pending = logs.items.filter((l: any) => l.changes?.status === 'PENDING');
        return pending;
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
