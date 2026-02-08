
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';

const execAsync = util.promisify(exec);

// 1. Load Environment Variables from backend/.env
const loadEnv = () => {
    try {
        const envPath = path.resolve('backend/.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const env = {};
            content.split('\n').forEach(line => {
                const [key, ...rest] = line.split('=');
                if (key && rest.length > 0) {
                    env[key.trim()] = rest.join('=').trim();
                }
            });
            return env;
        }
    } catch (e) {
        console.warn('Could not load backend/.env');
    }
    return {};
};

const env = loadEnv();

// Provider Config
const PROVIDERS = [
    { name: 'OpenAI', key: env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' },
    { name: 'Anthropic', key: env.ANTHROPIC_API_KEY, url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
    { name: 'Gemini', key: env.GEMINI_API_KEY, url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, model: 'gemini-pro' },
    { name: 'Grok', key: env.GROK_API_KEY, url: 'https://api.x.ai/v1/chat/completions', model: 'grok-beta' }
];

// 2. Main Logic
async function runGodMode() {
    console.log('🧙‍♂️ God Mode (Local) Activator');

    // Check TODO.md
    if (!fs.existsSync('TODO.md')) {
        console.log('ℹ️ No TODO.md found.');
        return;
    }

    const todoContent = fs.readFileSync('TODO.md', 'utf-8');
    const godTaskRegex = /TODO: \[GOD_MODE\] (.*)/;
    const match = todoContent.match(godTaskRegex);

    if (!match) {
        console.log('✅ No pending [GOD_MODE] tasks found in TODO.md.');
        return;
    }

    const task = match[1];
    console.log(`🤖 Found Task: "${task}"`);

    const prompt = `You are an autonomous AI Lead Developer.
    Task: "${task}"
    
    Output a JSON object with:
    1. "filepath": Relative path to the file to create/modify.
    2. "code": Full file content.
    3. "message": Commit message.
    
    JSON ONLY. No code fences.`;

    // Filter for available providers
    const availableProviders = PROVIDERS.filter(p => p.key && p.key.length > 10);

    if (availableProviders.length === 0) {
        console.error('❌ No valid API keys found in backend/.env');
        return;
    }

    let success = false;

    // Loop through providers until one works
    for (const activeProvider of availableProviders) {
        console.log(`🧠 Consulting ${activeProvider.name}...`);
        try {
            let responseData;

            if (activeProvider.name === 'OpenAI' || activeProvider.name === 'Grok') {
                const response = await axios.post(activeProvider.url, {
                    model: activeProvider.model,
                    messages: [
                        { role: "system", content: "You are a senior software engineer." },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: "json_object" }
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${activeProvider.key}`
                    },
                    timeout: 60000
                });
                responseData = JSON.parse(response.data.choices[0].message.content);
            }
            else if (activeProvider.name === 'Anthropic') {
                const response = await axios.post(activeProvider.url, {
                    model: activeProvider.model,
                    max_tokens: 4000,
                    messages: [
                        { role: "user", content: prompt }
                    ]
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': activeProvider.key,
                        'anthropic-version': '2023-06-01'
                    },
                    timeout: 60000
                });
                const content = response.data.content[0].text;
                responseData = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
            }
            else if (activeProvider.name === 'Gemini') {
                const response = await axios.post(activeProvider.url, {
                    contents: [{ parts: [{ text: prompt + " \nRespond with VALID JSON only." }] }]
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 60000
                });
                const text = response.data.candidates[0].content.parts[0].text;
                responseData = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            }

            const result = responseData;
            console.log(`💡 Plan: Modify ${result.filepath}`);

            // Write File
            const dir = path.dirname(result.filepath);
            if (dir && dir !== '.') {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(result.filepath, result.code);
            console.log(`📝 Wrote to ${result.filepath}`);

            // Git Operations
            console.log('📦 Committing...');
            try {
                await execAsync(`git add ${result.filepath}`);
                await execAsync(`git commit -m "${result.message || 'feat: god mode update'}"`);

                // Update TODO.md
                const newTodo = todoContent.replace(match[0], `DONE: [GOD_MODE] ${result.message} - ${task}`);
                fs.writeFileSync('TODO.md', newTodo);
                await execAsync(`git add TODO.md`);
                await execAsync(`git commit -m "docs: complete task ${task}"`);

                console.log('🚀 Changes committed locally. Please push when ready.');
                success = true;
                break; // Stop loop on success
            } catch (gitErr) {
                console.error('❌ Git Error:', gitErr.message);
                success = true;
                break;
            }

        } catch (error) {
            console.error(`❌ ${activeProvider.name} Failed:`, error.message);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
            }
            // Continue to next provider
        }
    }

    if (!success) {
        console.error('\n❌ All providers failed.');
    }
}

runGodMode();
