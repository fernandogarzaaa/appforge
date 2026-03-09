import axios from 'axios';

/**
 * AppForge Bridge
 * Connects the hosted frontend (appforge.fun) to the local Swarm Orchestrator.
 */
export class AppForgeBridge {
    private localUrl: string;
    private apiKey?: string;

    constructor(localUrl?: string, apiKey = import.meta.env.VITE_BASE44_API_KEY) {
        this.localUrl = (localUrl || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        this.apiKey = apiKey;
    }

    private buildUrl(path: string) {
        if (this.localUrl) {
            return `${this.localUrl}${path}`;
        }
        return path;
    }

    private headers() {
        const baseHeaders: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (this.apiKey) {
            baseHeaders['x-api-key'] = this.apiKey;
        }
        return baseHeaders;
    }

    async sendCommand(task: string) {
        try {
            console.log(`🌁 BRIDGE: Sending task to ${this.localUrl}...`);
            const response = await axios.post(this.buildUrl('/api/command'), { task }, {
                headers: this.headers()
            });
            return response.data;
        } catch (error: any) {
            console.error('🌁 BRIDGE_ERROR:', error.response?.data || error.message);
            throw new Error(`Bridge Sync Failed: ${error.message}`);
        }
    }

    async startFactory() {
        try {
            const response = await axios.post(this.buildUrl('/api/factory/start'), {}, {
                headers: this.headers()
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Factory Bridge Failed: ${error.message}`);
        }
    }
}

export const appforgeBridge = new AppForgeBridge();
