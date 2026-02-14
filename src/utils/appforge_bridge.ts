import axios from 'axios';

/**
 * AppForge Bridge
 * Connects the hosted frontend (appforge.fun) to the local Swarm Orchestrator.
 */
export class AppForgeBridge {
    private localUrl: string;
    private apiKey: string;

    constructor(localUrl = 'http://localhost:3001', apiKey = import.meta.env.VITE_BASE44_API_KEY) {
        this.localUrl = localUrl;
        this.apiKey = apiKey;
    }

    async sendCommand(task: string) {
        try {
            console.log(`🌁 BRIDGE: Sending task to ${this.localUrl}...`);
            const response = await axios.post(`${this.localUrl}/api/command`, { task }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('🌁 BRIDGE_ERROR:', error.response?.data || error.message);
            throw new Error(`Bridge Sync Failed: ${error.message}`);
        }
    }

    async startFactory() {
        try {
            const response = await axios.post(`${this.localUrl}/api/factory/start`, {}, {
                headers: {
                    'x-api-key': this.apiKey
                }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Factory Bridge Failed: ${error.message}`);
        }
    }
}

export const appforgeBridge = new AppForgeBridge();
