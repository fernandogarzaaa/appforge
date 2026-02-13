import * as fs from 'fs/promises';
import path from 'path';

const LOCK_FILE = path.join(process.cwd(), 'swarm/data/maintenance.lock');

/**
 * MaintenanceGuard
 * Handles signaling for graceful swarm shutdowns and maintenance windows.
 */
export class MaintenanceGuard {
    /**
     * Check if maintenance mode is active.
     */
    static async isMaintenanceActive(): Promise<boolean> {
        try {
            await fs.access(LOCK_FILE);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Activate maintenance mode.
     */
    static async activate(): Promise<void> {
        const data = {
            timestamp: new Date().toISOString(),
            reason: 'Swarm maintenance/update'
        };
        await fs.writeFile(LOCK_FILE, JSON.stringify(data, null, 2));
        console.log('🛑 [Maintenance] ACTIVE - Signal broadcasted.');
    }

    /**
     * Deactivate maintenance mode.
     */
    static async deactivate(): Promise<void> {
        try {
            await fs.unlink(LOCK_FILE);
            console.log('✅ [Maintenance] DEACTIVATED - Resuming operations.');
        } catch {
            // File already gone
        }
    }
}

export default MaintenanceGuard;
