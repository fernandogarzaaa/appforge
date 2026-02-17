/**
 * 🌉 NEURAL BRIDGE (SOVEREIGN API GATEWAY)
 * 
 * Exposes the local Iron Brain (Ollama) + Chimera Fuse Engine
 * as a standard HTTP API.
 * 
 * Endpoints:
 * - POST /v1/chat/completions (OpenAI Compatible)
 * - POST /chimera/fuse (Advanced Cognitive Reconstruction)
 */

import http from 'http';
import { chimeraEngine } from '../factory/chimera_fuse.js';

const PORT = 8000;

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/v1/chat/completions' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const prompt = data.messages?.[data.messages.length - 1]?.content || "Hello";

                // Route to Chimera Engine
                const blueprint = await chimeraEngine.executeReconstruction(prompt);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    id: blueprint.id,
                    object: 'chat.completion',
                    created: Date.now(),
                    model: 'chimera-prime-v1',
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: blueprint.fusedResponse
                        },
                        finish_reason: 'stop'
                    }]
                }));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: (e as any).message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`🦁🐍🐐 [Chimera Bridge] Listening on port ${PORT}`);
});
