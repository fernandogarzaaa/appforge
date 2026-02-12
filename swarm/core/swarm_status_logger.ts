/**
 * 📊 SWARM STATUS LOGGER
 * Writes swarm status to log for WhatsApp notifier
 */

import * as fs from 'fs';
import * as path from 'path';

const STATUS_LOG_PATH = path.join(process.cwd(), 'swarm', 'swarm_status_log.json');

export interface SwarmStatus {
    overall: number;
    phase: string;
    reasoning: number;
    creativity: number;
    learning: number;
    prediction: number;
    timestamp: string;
    opportunities: number;
    agentsActive: number;
    sources: string;
    gain: number;
}

/**
 * Log swarm status
 */
export function logSwarmStatus(status: SwarmStatus): void {
    try {
        let logs: SwarmStatus[] = [];
        if (fs.existsSync(STATUS_LOG_PATH)) {
            try {
                const content = fs.readFileSync(STATUS_LOG_PATH, 'utf8');
                logs = JSON.parse(content);
            } catch { logs = []; }
        }
        logs.push(status);
        if (logs.length > 100) logs = logs.slice(-100);
        fs.writeFileSync(STATUS_LOG_PATH, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error(`[StatusLogger] Error: ${e}`);
    }
}

/**
 * Read last status
 */
export function readLastStatus(): SwarmStatus | null {
    try {
        if (fs.existsSync(STATUS_LOG_PATH)) {
            const content = fs.readFileSync(STATUS_LOG_PATH, 'utf8');
            const logs = JSON.parse(content);
            if (logs.length > 0) return logs[logs.length - 1];
        }
    } catch { }
    return null;
}
