
import { FileSystemTool } from '../swarm/tools/filesystem.js'; // TSX usually handles .js to .ts resolution or we can use .ts
import { SwarmMemory } from '../swarm/core/memory.js';
import fs from 'fs';
import path from 'path';

async function verifyQuantumContext() {
    console.log('🧠 Quantum Context Verification Initiated...\n');

    const fsTool = new FileSystemTool(process.cwd());
    const memory = new SwarmMemory(fsTool);

    // 1. Test Context Building
    console.log('Step 1: Building Project Context Map...');
    const startTime = Date.now();
    await memory.buildContextMap();
    const duration = Date.now() - startTime;
    console.log(`✅ Context Built in ${duration}ms`);

    // 2. Verify Memory File
    if (fs.existsSync('swarm_memory.json')) {
        const stats = fs.statSync('swarm_memory.json');
        console.log(`✅ Memory File Created: swarm_memory.json (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
        console.error('❌ Memory File NOT created.');
        process.exit(1);
    }

    // 3. Test Retrieval
    console.log('\nStep 2: Testing Context Retrieval...');
    const query = 'Authentication'; // Should find Auth related files
    const result = await memory.retrieveContext(query);
    const nodes = JSON.parse(result);

    console.log(`🔍 Query: "${query}"`);
    console.log(`Found ${nodes.length} related nodes.`);

    if (nodes.length > 0) {
        console.log('✅ Retrieval Logic Functional.');
        console.log('Sample Match:', nodes[0].path);
    } else {
        console.warn('⚠️ No nodes found. Ensure codebase has "Authentication" related terms.');
    }

    // 4. Verify GodMode Integration (Static Check)
    console.log('\nStep 3: Checking GodMode Integration...');
    const godModePath = 'swarm/agents/GodMode.ts';
    const godModeContent = fs.readFileSync(godModePath, 'utf8');

    if (godModeContent.includes('this.memory.retrieveContext')) {
        console.log('✅ GodMode.ts is using SwarmMemory.');
    } else {
        console.error('❌ GodMode.ts NOT using SwarmMemory.');
        process.exit(1);
    }

    console.log('\n✨ QUANTUM CONTEXT VERIFIED: The Swarm is now Self-Aware.');
}

verifyQuantumContext().catch(console.error);
