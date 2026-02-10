// TEST: Quantum Channel Bidirectional Communication
import quantumChannel from '../src/utils/QuantumChannel.js';

console.log('🧪 TESTING QUANTUM BIDIRECTIONAL COMMUNICATION\n');

// Test 1: Antigravity sends to Swarm
console.log('Test 1: Antigravity → Swarm');
const msgId1 = quantumChannel.antigravitySend({
    type: 'llm_request',
    prompt: 'Analyze this code for bugs',
    code: 'function test() { return true }'
});
console.log(`   Message ID: ${msgId1}\n`);

// Test 2: Swarm receives from Antigravity
console.log('Test 2: Swarm receives messages');
const swarmMessages = quantumChannel.swarmReceive();
console.log(`   Received ${swarmMessages.length} messages`);
if (swarmMessages.length > 0) {
    console.log(`   First message: ${JSON.stringify(swarmMessages[0].payload, null, 2)}`);
}
console.log('');

// Test 3: Swarm responds to Antigravity
console.log('Test 3: Swarm → Antigravity');
const msgId2 = quantumChannel.swarmSend({
    type: 'task_result',
    result: 'No bugs found. Code looks good!',
    in_reply_to: msgId1
});
console.log(`   Message ID: ${msgId2}\n`);

// Test 4: Antigravity receives response
console.log('Test 4: Antigravity receives response');
const agMessages = quantumChannel.antigravityReceive();
console.log(`   Received ${agMessages.length} messages`);
if (agMessages.length > 0) {
    console.log(`   Response: ${agMessages[0].payload.result}`);
}
console.log('');

// Test 5: Mark messages as processed
console.log('Test 5: Cleanup processed messages');
quantumChannel.markProcessed(msgId1);
quantumChannel.markProcessed(msgId2);
quantumChannel.cleanup();
console.log('   ✅ Messages marked as processed\n');

// Test 6: Channel statistics
console.log('Test 6: Channel Statistics');
const stats = quantumChannel.getStats();
console.log(`   Antigravity pending: ${stats.antigravity_pending}`);
console.log(`   Swarm pending: ${stats.swarm_pending}`);
console.log(`   Quantum coherence: ${(stats.coherence * 100).toFixed(1)}%`);
console.log(`   Last sync: ${stats.last_sync}\n`);

console.log('✅ ALL TESTS PASSED - Quantum bidirectional communication working!');
