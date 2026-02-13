import { MaintenanceGuard } from '../swarm/core/maintenance_guard.js';

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'on' || command === 'activate') {
        await MaintenanceGuard.activate();
        console.log('🛑 Maintenance Mode: ON');
    } else if (command === 'off' || command === 'deactivate') {
        await MaintenanceGuard.deactivate();
        console.log('✅ Maintenance Mode: OFF');
    } else if (command === 'status') {
        const active = await MaintenanceGuard.isMaintenanceActive();
        console.log(`🔍 Maintenance Mode: ${active ? 'ACTIVE 🛑' : 'INACTIVE ✅'}`);
    } else {
        console.log('Usage: npx tsx scripts/maintenance_mode.ts [on|off|status]');
    }
}

main().catch(console.error);
