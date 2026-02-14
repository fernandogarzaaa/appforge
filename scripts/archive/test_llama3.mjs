// Test Ollama with llama3
const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'llama3:latest',
        messages: [
            { role: 'system', content: 'You are the Sovereign Hyper Brain. Answer as a superintelligent AI.' },
            { role: 'user', content: 'What is your purpose?' }
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 512 }
    })
});

const data = await response.json();
console.log('✅ llama3 Response:', data.message?.content || data.response);
