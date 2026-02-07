
import fetch from 'node-fetch';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { readPendingSignals, markSignalComplete } from './utils/memory.js';

const execAsync = util.promisify(exec);
const API_URL = 'https://app.base44.com/api';

async function runGodMode(config) {
    const { appId, apiKey } = config;

    if (!appId || !apiKey) {
        console.error('❌ God Mode Bot: Missing credentials');
        return;
    }

    const headers = { 'api_key': apiKey, 'Content-Type': 'application/json' };
    console.log('🧙‍♂️ God Mode Bot: Scanning for tasks & signals...');

    try {
        let task = null;
        let signalId = null;
        let context = '';

        // 1. Check Swarm Signals (Higher Priority)
        const signals = readPendingSignals();
        const criticalSignal = signals.find(s => s.priority === 'CRITICAL' || s.priority === 'HIGH');

        if (criticalSignal) {
            console.log(`🚨 SWARM SIGNAL RECEIVED from ${criticalSignal.source}: ${criticalSignal.type}`);
            task = `Fix ${criticalSignal.type}: ${criticalSignal.data.description}`;
            context = `Context: ${JSON.stringify(criticalSignal.data)}`;
            signalId = criticalSignal.id;
        } else {
            // 2. Check TODO.md (Standard Priority)
            if (fs.existsSync('TODO.md')) {
                const todoContent = fs.readFileSync('TODO.md', 'utf-8');
                const godTaskRegex = /TODO: \[GOD_MODE\] (.*)/;
                const match = todoContent.match(godTaskRegex);
                if (match) {
                    task = match[1];
                }
            }
        }

        if (task) {
            console.log(`🤖 God Mode Activated. Objective: "${task}"`);

            // 3. Generate Code via LLM
            const prompt = `You are an autonomous AI Lead Developer with FULL ACCESS.
            Objective: "${task}"
            ${context}
            
            You must output a JSON object with:
            1. "filepath": The relative path to the file you want to create or modify.
            2. "code": The complete code content for that file.
            3. "message": A semantic commit message.

            Config:
            - Use ES Modules.
            - Provide FULL file content.
            - JSON only.`;

            const llmRes = await fetch(`${API_URL}/apps/${appId}/integration-endpoints/Core/InvokeLLM`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    max_tokens: 2000,
                    response_json_schema: {
                        type: 'object',
                        properties: {
                            filepath: { type: 'string' },
                            code: { type: 'string' },
                            message: { type: 'string' }
                        }
                    }
                })
            });

            if (llmRes.ok) {
                const llmJson = await llmRes.json();
                let result = llmJson.response || llmJson.content || llmJson;
                let action = result;

                if (typeof result === 'string') {
                    try {
                        result = result.replace(/```json/g, '').replace(/```/g, '').trim();
                        action = JSON.parse(result);
                    } catch (e) {
                        console.error('❌ Failed to parse LLM JSON:', e);
                        return;
                    }
                }

                if (action.filepath && action.code) {
                    console.log(`💡 Implementing changes in ${action.filepath}...`);

                    const dir = path.dirname(action.filepath);
                    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                    fs.writeFileSync(action.filepath, action.code);
                    console.log(`📝 Wrote code to ${action.filepath}`);

                    try {
                        console.log('📦 Committing and Pushing...');
                        await execAsync(`git add ${action.filepath}`);
                        await execAsync(`git commit -m "${action.message || 'feat(god-mode): Autonomous update'}"`);
                        await execAsync('git push origin main');
                        console.log('🚀 Changes PUSHED to origin/main');

                        // Mark Complete
                        if (signalId) {
                            markSignalComplete(signalId, `Implemented fix in ${action.filepath}`);
                            console.log(`✅ Signal ${signalId} marked as RESOLVED.`);
                        } else {
                            // Update TODO
                            const todoContent = fs.readFileSync('TODO.md', 'utf-8');
                            const newTodoContent = todoContent.replace(`TODO: [GOD_MODE] ${task}`, `DONE: [GOD_MODE] ${task}`);
                            fs.writeFileSync('TODO.md', newTodoContent);
                        }

                    } catch (gitErr) {
                        console.error('❌ Git Operation Failed:', gitErr.message);
                    }

                } else {
                    console.error('❌ LLM returned invalid structure.', action);
                }
            } else {
                console.error('❌ LLM Request Failed:', await llmRes.text());
            }

        } else {
            console.log('✅ No pending tasks or critical signals.');
        }

    } catch (e) {
        console.error('❌ God Mode Bot Error:', e);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const config = {
        appId: process.env.BASE44_APP_ID,
        apiKey: process.env.BASE44_API_KEY
    };
    if (config.appId && config.apiKey) {
        runGodMode(config);
    }
}

export { runGodMode };
