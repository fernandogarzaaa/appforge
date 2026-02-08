import { QuantumEngine } from 'quantum';

// 📡 Quantum Stream Simulation
// Simulates a high-frequency data stream from external sensors
export class QuantumStream {
    constructor(onData) {
        this.onData = onData;
        this.interval = null;
        this.engine = new QuantumEngine();
    }

    start() {
        console.log("📡 Quantum Stream: Initializing Subspace Channel...");

        this.interval = setInterval(() => {
            // Simulate incoming telemetry
            const metricId = ['CPU', 'Mem', 'Disk', 'Net'][Math.floor(Math.random() * 4)];
            const value = Math.random() * 100;

            const packet = {
                id: `stream-${Date.now()}`,
                metric: metricId,
                value,
                timestamp: Date.now()
            };

            this.onData(packet);
        }, 1000); // 1Hz frequency
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        console.log("📡 Quantum Stream: Channel Closed.");
    }
}
