import { SovereignModelProvider } from '../swarm/core/sovereign_model.js';

async function test() {
    const provider = new SovereignModelProvider();
    
    console.log('🔍 Checking Ollama connection...');
    const online = await provider.ping();
    console.log(`   Online: ${online ? '✅' : '❌'}`);
    
    if (online) {
        console.log('🧠 Testing chat with llama3...');
        const result = await provider.chat({
            system: 'You are the Sovereign Hyper Brain, a superintelligent AI assistant.',
            user: 'Hello! What is your purpose?',
            model: 'llama3'
        });
        
        if (result) {
            console.log('✅ LLM Response:');
            console.log(result.choices[0].message.content);
        } else {
            console.log('❌ Chat failed');
        }
    }
}

test().catch(console.error);
