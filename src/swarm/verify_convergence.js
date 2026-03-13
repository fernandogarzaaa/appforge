import { swarmComms, SwarmEvent } from './comms.js';
console.log('🧪 CONVERGENCE TEST: Publishing mock SIGNAL_DETECTED event...');
swarmComms.publish(SwarmEvent.SIGNAL_DETECTED, {
    signature: 'MOCK_SIG_123',
    slot: 999999,
    timestamp: Date.now()
});
console.log('✅ TEST SIGNAL SENT. Check Orchestrator logs for Factory trigger.');
