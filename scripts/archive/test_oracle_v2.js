
import quantumCore from '../swarm/core/quantum_core.js';

async function testOracleUpgrade() {
    console.log('🧪 Testing Oracle 2.0 Upgrade...');
    console.log('-----------------------------------');

    // 1. Consult
    const question = "Which architectural pattern is best for high scalability?";
    const options = ["Microservices", "Monolith", "Serverless", "Event-Driven"];

    console.log(`\n❓ Asking: "${question}"`);
    const result = await quantumCore.consultOracle(
        question,
        options,
        ['scalability', 'maintainability', 'cost']
    );

    console.log('\n✅ Result Received:');
    console.log(JSON.stringify(result, null, 2));

    if (result.predictionId) {
        console.log('\n🔄 Testing Feedback Loop...');

        // 2. Report Success (Reinforce)
        await quantumCore.reportOutcome(result.predictionId, true, { reason: 'User accepted recommendation' });

        console.log('✅ Feedback reported successfully.');
    } else {
        console.error('❌ FAIL: No predictionId returned. Oracle 2.0 features not active.');
    }

    console.log('\n-----------------------------------');
    console.log('🎉 Oracle 2.0 Test Complete');
}

testOracleUpgrade().catch(console.error);
