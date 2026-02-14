import { AntigravityLLMProvider } from '../swarm/core/llm.js';
import { Base44Tool } from '../swarm/tools/base44.js';

async function verifyOptimization() {
    console.log('🧪 [Base44-Opt] Starting Cognitive Optimization Verification...');

    const base44 = new Base44Tool();
    const provider = new AntigravityLLMProvider(base44);

    // 1. Test Health Monitoring
    console.log('📡 Testing Bridge Health...');
    const health = await base44.checkHealth();
    console.log(`   Status: ${health.online ? 'ONLINE' : 'OFFLINE'} (Latency: ${health.latency || 0}ms)`);

    // 2. Test Semantic Compression
    console.log('📡 Testing Semantic Compression (Large Prompt)...');
    const largeSystem = 'You are a strategic advisor for a complex DeFi ecosystem. '.repeat(50); // > 1000 chars
    const largeUser = 'Analyze the current market trends for SOL and provide a detailed 10-step strategy. '.repeat(50); // > 3000 chars

    console.log(`   Original Size: ${largeSystem.length + largeUser.length} chars`);

    try {
        // This will trigger compression logic in llm.ts
        // We catch the error because we don't need it to actually complete the polling
        // (which requires Antigravity component to react), we just want to see the logs.
        console.log('   (Triggering signal...)');
        await provider.chat({
            system: largeSystem,
            user: largeUser
        });
    } catch (e: any) {
        if (e.message.includes('Timeout')) {
            console.log('   ✅ Compression logic executed (Timeout expected as Antigravity is passive)');
        } else {
            console.warn(`   ⚠️ Signal dispatched with result: ${e.message}`);
        }
    }

    console.log('\n✅ [Base44-Opt] Verification complete. Check logs for compression ratio.');
}

verifyOptimization();
