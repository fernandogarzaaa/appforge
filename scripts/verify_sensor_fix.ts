import { realitySensor } from '../swarm/core/reality_sensor.ts';

console.log('🧪 Testing Reality Sensor Stability...');

async function test() {
    try {
        const signals = await realitySensor.scan();
        console.log(`✅ Scan successful. Signals detected: ${signals.length}`);
        signals.forEach(s => console.log(`   - [${s.source}] ${s.type}`));
    } catch (error) {
        console.error('❌ Verify failed:', error);
        process.exit(1);
    }
}

test();
