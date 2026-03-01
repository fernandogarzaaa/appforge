/**
 * Phase 8: Sovereign UI Telemetry Bridge
 * Buffers and flushes UX resonance data to the Swarm
 */

export interface TelemetryPayload {
    metrics?: {
        errorCount?: number;
        avgLatency?: number;
        vitals?: Record<string, any>;
    };
    activity?: {
        type: string;
        timestamp: string;
        details?: any;
    };
}

class TelemetryService {
    private endpoint: string;
    private apiKey: string;
    private buffer: TelemetryPayload[] = [];
    private flushInterval: number = 5000; // 5 seconds
    private timer: any = null;

    constructor() {
        this.endpoint = '/api/telemetry';
        this.apiKey = import.meta.env.VITE_BASE44_API_KEY || 'appforge_local_dev_key';
    }

    /**
     * Start the background flush timer
     */
    start() {
        if (this.timer) return;
        this.timer = setInterval(() => this.flush(), this.flushInterval);
        console.log('🌌 [Sovereign Telemetry] Bridge Online.');
    }

    /**
     * Report a user activity event
     */
    reportActivity(activity: any) {
        this.buffer.push({
            activity: {
                type: activity.type,
                timestamp: new Date().toISOString(),
                details: activity
            }
        });
    }

    /**
     * Report performance vitals
     */
    reportVital(name: string, value: any, rating: string) {
        this.buffer.push({
            metrics: {
                vitals: { [name]: { value, rating } }
            }
        });
    }

    /**
     * Flush buffered telemetry to the backend
     */
    async flush() {
        if (this.buffer.length === 0) return;

        const payload = this.buffer.shift(); // Send one at a time for simpler backend logic
        if (!payload) return;

        try {
            // Use fetch with keepalive or sendBeacon for reliability
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(payload),
                keepalive: true
            });

            if (!response.ok) {
                console.warn('⚠️ [Sovereign Telemetry] Sink rejected payload.');
                // Re-add to buffer on failure (optional, maybe skip for performance)
            }
        } catch (err) {
            console.error('❌ [Sovereign Telemetry] Bridge failed to reach sink:', err);
        }
    }
}

export const telemetryService = new TelemetryService();
