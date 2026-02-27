import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // Dynamically import the oracle to avoid commonjs/module issues
    const { QuantumSwarmCore } = await import('../swarm/core/quantum_core.ts');
    const quantumCore = new QuantumSwarmCore();

    console.log('🔮 Initiating Oracle Consultation for Swarm Architecture...');

    const planContent = fs.readFileSync('C:/Users/ferna/.gemini/antigravity/brain/c0af9b23-16e2-40a5-8ba6-b7f9c797b1d6/swarm_architecture_design.md', 'utf8');

    const question = `Analyze this proposed 'Event-Driven Swarm Architecture' and suggest ADDITIONAL implementation approaches, tools, or optimizations for building the Unified State Layer (Neural Mesh) and the Event-Driven Dispatch Flow:\n\n${planContent}`;

    const options = [
        'GitHub Repository Variables as Key-Value Store',
        'Vercel KV or Upstash Redis for instant JSON state sync',
        'Supabase Realtime for pub-sub WebSockets between agents',
        'GitHub Actions API repository_dispatch for event triggers',
        'Self-hosted NATS or RabbitMQ for Swarm IPC'
    ];

    try {
        const guidance = await quantumCore.consultOracle(question, options, ['speed', 'reliability', 'sovereignty']);
        console.log('\n--- ORACLE RESPONSE ---');
        console.log('Recommendation:', guidance.recommendation);
        console.log('Confidence:', guidance.confidence);
        console.log('Alternatives:', guidance.alternatives);

        if ((guidance as any).reasoning) {
            console.log('Reasoning:', (guidance as any).reasoning);
        }
        process.exit(0);
    } catch (e) {
        console.error('❌ Oracle consultation failed:', e);
        process.exit(1);
    }
}

main().catch(console.error);
