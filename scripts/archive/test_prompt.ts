import { promptHandler } from './prompt_handler.js';

async function testPrompt() {
    console.log('🌀 Testing Sovereign Prompt Intelligence...');

    const testCases = [
        "Who are you and what is your purpose?",
        "Status report on the Sovereign AI Ecosystem."
    ];

    for (const prompt of testCases) {
        console.log(`\nUser: ${prompt}`);
        const response = await promptHandler.handlePrompt(prompt);
        console.log(`AI: ${response}`);
    }
}

testPrompt().catch(console.error);
