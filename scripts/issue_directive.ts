import { promptHandler } from './prompt_handler.js';

async function issueDirective() {
    console.log('📢 Issuing Sovereign Directive...');
    const directive = "REMIND ALL SWARMS: THE RENT IS DUE. Performance must reach maximum theoretical limits. No simulations. Reality only.";

    console.log(`\nDirective: ${directive}`);
    const response = await promptHandler.handlePrompt(directive);
    console.log(`\nSovereign Response: ${response}`);
}

issueDirective().catch(console.error);
