import { P2PResonance } from '../swarm/core/p2p_resonance.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const PROJECT_ROOT = process.cwd();
const TEST_PORT_1 = 11440;
const TEST_PORT_2 = 11441;
const TEST_FILE = path.join(PROJECT_ROOT, 'src/data/bounty_ledger.json');

async function testConsensus() {
    console.log('🧪 Starting P2P Resonance Consensus Tests...');

    // Backup original ledger
    let backup = null;
    try {
        backup = await fs.readFile(TEST_FILE, 'utf8');
    } catch (e) { }

    // 1. Setup Nodes
    process.env.NODE_ID = 'NODE_ALPHA';
    process.env.PRODUCTION_SECRET = 'TEST_SECRET';
    const nodeAlpha = new P2PResonance();
    await nodeAlpha.start(TEST_PORT_1);

    process.env.NODE_ID = 'NODE_BETA';
    const nodeBeta = new P2PResonance();
    await nodeBeta.start(TEST_PORT_2);

    // Connect them
    await nodeBeta.connectToPeer(`ws://localhost:${TEST_PORT_1}`);
    await new Promise(r => setTimeout(r, 500)); // wait for handshake

    // 2. Prepare mock mutated state (Node Beta has diverged)
    const mockState = {
        _vectorClock: { 'NODE_ALPHA': 2, 'NODE_BETA': 5 },
        bounties: [{ id: 'TEST_BTY', status: 'completed' }, { id: 'NEW_BTY', status: 'backlog' }]
    };

    // 3. Setup mock existing local state for Node Alpha
    const alphaState = {
        _vectorClock: { 'NODE_ALPHA': 3 }, // Alpha incremented its own clock but hasn't seen Beta
        bounties: [{ id: 'TEST_BTY', status: 'assigned' }]
    };
    await fs.writeFile(TEST_FILE, JSON.stringify(alphaState, null, 2));

    // 4. Node Beta Broadcasts its state
    console.log('📡 Node Beta broadcasting concurrent state mutation...');
    await nodeBeta.broadcastState('BOUNTY_SYNC', mockState);

    await new Promise(r => setTimeout(r, 1000)); // wait for merge

    // 5. Verify the CRDT resolution on disk (Node Alpha's disk)
    const resultingContent = await fs.readFile(TEST_FILE, 'utf8');
    const result = JSON.parse(resultingContent);

    console.log('\n📊 CRDT Merge Result (Vector Clocks):', result._vectorClock);
    console.log('   Bounties count:', result.bounties.length);

    let success = true;
    if (result._vectorClock['NODE_ALPHA'] !== 3 || result._vectorClock['NODE_BETA'] !== 5) {
        console.error('❌ Vector logic failed. Did not correctly adopt highest node clocks.');
        success = false;
    }
    if (result.bounties.length !== 2) {
        console.error('❌ Deterministic conflict resolution failed. Array length should be 2 (Node Beta won tiebreaker).');
        success = false;
    }

    // Restore
    if (backup) {
        await fs.writeFile(TEST_FILE, backup);
    } else {
        await fs.unlink(TEST_FILE).catch(e => { });
    }

    if (success) {
        console.log('✅ All Consensus Tests Passed!');
        process.exit(0);
    } else {
        process.exit(1);
    }
}

testConsensus().catch(e => {
    console.error(e);
    process.exit(1);
});
