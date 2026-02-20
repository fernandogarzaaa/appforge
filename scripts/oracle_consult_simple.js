
import quantumCore from '../swarm/core/quantum_core.js';

async function main() {
    try {
        const question = "ADDITIONAL implementations for the Iron Brain CI model download flow to make it faster, more resilient, and sovereign.";
        const options = [
            "GitHub Actions Caching for 'models' directory.",
            "Node.js @huggingface/hub downloader to bypass Python.",
            "P2P Model Sharing within the Swarm.",
            "Pre-emptive Model Warming on local relay nodes.",
            "Checksum-verified sovereign model registry."
        ];
        const criteria = ['speed', 'reliability', 'sovereignty'];

        console.log('🔮 Consulting Oracle...');
        const result = await quantumCore.consultOracle(question, options, criteria);

        console.log('\n✨ Oracle Verdict:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
