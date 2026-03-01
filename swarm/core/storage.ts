import fs from 'fs/promises';
import path from 'path';

export interface SovereignState {
    timestamp: string;
    state: any;
    version: string;
}

export class SovereignStorage {
    private localPath: string;
    private useCloud: boolean;

    constructor(localPath: string = 'swarm_state.json') {
        this.localPath = localPath;
        this.useCloud = !!process.env.UPSTASH_REDIS_REST_URL;
    }

    /**
     * Save state to either local file or cloud (Redis)
     */
    async save(state: SovereignState): Promise<void> {
        const data = JSON.stringify(state, null, 2);

        // Always save locally as a backup
        await fs.writeFile(this.localPath, data, 'utf8');

        if (this.useCloud) {
            try {
                const url = process.env.UPSTASH_REDIS_REST_URL;
                const token = process.env.UPSTASH_REDIS_REST_TOKEN;

                if (url && token) {
                    await fetch(`${url}/set/swarm_sovereign_state`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: data
                    });
                    console.log('🌌 [Sovereign Storage] State synced to Cloud Resonance.');
                }
            } catch (err: any) {
                console.warn('⚠️ [Sovereign Storage] Cloud sync failed, relying on local backup:', err.message);
            }
        }
    }

    /**
     * Load state from cloud (preferred) or local file
     */
    async load(): Promise<SovereignState | null> {
        if (this.useCloud) {
            try {
                const url = process.env.UPSTASH_REDIS_REST_URL;
                const token = process.env.UPSTASH_REDIS_REST_TOKEN;

                if (url && token) {
                    const response = await fetch(`${url}/get/swarm_sovereign_state`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const cloudData = await response.json();
                        if (cloudData.result) {
                            console.log('🌌 [Sovereign Storage] State restored from Cloud Resonance.');
                            return JSON.parse(cloudData.result);
                        }
                    }
                }
            } catch (err: any) {
                console.warn('⚠️ [Sovereign Storage] Cloud restore failed, checking local backup...');
            }
        }

        try {
            const localData = await fs.readFile(this.localPath, 'utf8');
            console.log('💾 [Sovereign Storage] State restored from Local Backup.');
            return JSON.parse(localData);
        } catch {
            return null;
        }
    }
}

export const sovereignStorage = new SovereignStorage();
