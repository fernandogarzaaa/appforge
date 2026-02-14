// Simple test for Ollama connection
const OLLAMA_URL = 'http://localhost:11434';

async function testPhi3() {
    console.log('🧪 Testing phi3:mini...');
    
    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'phi3:mini',
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant. Answer briefly.' },
                    { role: 'user', content: 'Hello! How are you?' }
                ],
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 256
                }
            })
        });

        const data = await response.json();
        console.log('✅ Response:', data.message?.content || data.response);
    } catch (e) {
        console.log('❌ Error:', e);
    }
}

testPhi3();
