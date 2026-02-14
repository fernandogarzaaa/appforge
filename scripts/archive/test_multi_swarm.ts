/**
 * Multi-Swarm Communication Test
 * 
 * Tests inter-swarm communication using the quantum channel.
 */

import { multiSwarmCoordinator, SWARM_CONFIGS } from '../swarm/core/multi_swarm_coordinator.js';

async function testMultiSwarmCommunication() {
    console.log('🚀 [Test] Starting Multi-Swarm Communication Test...\n');

    // Register swarm statuses
    console.log('📝 [Test] Registering swarm statuses...');
    
    Object.keys(SWARM_CONFIGS).forEach((swarmId, index) => {
        multiSwarmCoordinator.registerStatus(swarmId, {
            status: swarmId === 'main' ? 'online' : 'offline',
            uptime: Math.floor(Math.random() * 1000),
            tasksCompleted: Math.floor(Math.random() * 50)
        });
    });

    // Test 1: Direct message between swarms
    console.log('\n📨 [Test 1] Testing direct message...');
    const msgId = multiSwarmCoordinator.sendMessage(
        'main',
        'god',
        'directive',
        { task: 'Upgrade all agents to v3.0', priority: 'high' },
        'high'
    );
    console.log(`✅ [Test 1] Message sent: ${msgId}`);

    // Test 2: Broadcast message
    console.log('\n📡 [Test 2] Testing broadcast...');
    multiSwarmCoordinator.broadcast('main', 'status', { request: 'Get status report' }, 'normal');
    console.log('✅ [Test 2] Broadcast sent to all swarms');

    // Test 3: Get all statuses
    console.log('\n📊 [Test 3] Getting all swarm statuses...');
    const statuses = multiSwarmCoordinator.getAllStatuses();
    statuses.forEach(status => {
        console.log(`   ${status.status === 'online' ? '🟢' : '🔴'} ${status.name}: ${status.status}`);
    });

    // Test 4: Generate report
    console.log('\n📑 [Test 4] Generating multi-swarm report...');
    const report = multiSwarmCoordinator.generateReport();
    console.log(report);

    console.log('\n✅ [Test] Multi-Swarm Communication Test Complete!');
}

testMultiSwarmCommunication().catch(console.error);
