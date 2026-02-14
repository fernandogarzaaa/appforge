// Test Ollama with phi3
const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'phi3:mini',
        messages: [
            { role: 'system', content: 'You are helpful. Answer briefly.' },
            { role: 'user', content: 'Hello!' }
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 256 }
    })
});

const data = await response.json();
console.log('✅ phi3 Response:', data.message?.content || data.response);
