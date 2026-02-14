import { createClient } from '@base44/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') }); // Load from root

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
            token: apiKey,
            appId: process.env.BASE44_APP_ID,
            serverUrl: process.env.BASE44_API_URL || 'https://appforge.fun'
        } as any);

    }

    async getPendingTasks() {
        try {
            // Poll AuditLog for 'SWARM_SIGNAL' with status 'PENDING'
            const logs = await this.client.entities.AuditLog.list({
                filter: { action_type: 'SWARM_SIGNAL' },
                sort: { createdAt: 'desc' },
                limit: 5
            });

            // Robust null handling for various API response shapes
            let items: any[] = [];
            if (logs) {
                if (Array.isArray(logs)) {
                    items = logs;
                } else if (logs.items && Array.isArray(logs.items)) {
                    items = logs.items;
                } else if (logs.data && Array.isArray(logs.data)) {
                    items = logs.data;
                }
            }

            const pending = items.filter((l: any) => l?.changes?.status === 'PENDING');
            return pending;
        } catch (error: any) {
            // Gracefully handle auth errors or network glitches
            const message = error?.message || '';
            const status = error?.status || error?.response?.status;
            const code = error?.code || '';

            if (status === 403 || status === 404 || status === 502 || status === 503 ||
                message.includes('private') ||
                code === 'ECONNRESET' || code === 'ETIMEDOUT' ||
                message.includes('network') || message.includes('socket')) {
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
            action_type: `${agent.toUpperCase()}_LOG`,
            description: message,
            resource_type: 'swarm_agent',
            performed_by: agent
        });
    }

    /**
     * Check Cloud Bridge Health
     */
    async checkHealth(): Promise<{ online: boolean, latency?: number, error?: string }> {
        const start = Date.now();
        try {
            // Self-ping via AuditLog list
            await this.client.entities.AuditLog.list({ limit: 1 });
            return { online: true, latency: Date.now() - start };
        } catch (error: any) {
            return { online: false, error: error.message };
        }
    }

    /**
     * Quantum Heartbeat
     * Periodically logs bridge status to ensure resonance.
     */
    async logHeartbeat() {
        const health = await this.checkHealth();
        await this.logActivity('Base44_Bridge', `Heartbeat: ${health.online ? 'RESONATING' : 'COLLAPSED'} (Latency: ${health.latency || 0}ms)`);
        return health;
    }
}
