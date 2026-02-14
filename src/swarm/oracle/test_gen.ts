import fs from 'fs';
import path from 'path';
import { generateText } from '../llm_client.js';

const DYNAMIC_TESTS_DIR = path.resolve(process.cwd(), 'src/swarm/oracle/dynamic_tests');

export async function generateNewSecurityTest(violation: string, task: string) {
    console.log(`🛡️ GENERATING IMMUNE SYSTEM ANTIBODY: ${violation}`);

    if (!fs.existsSync(DYNAMIC_TESTS_DIR)) {
        fs.mkdirSync(DYNAMIC_TESTS_DIR, { recursive: true });
    }

    const prompt = `
    The Swarm Oracle just rejected a code pattern for the following reason:
    VIOLATION: ${violation}
    TASK ATTEMPTED: ${task}

    Write a small Rust function that takes a string of code and returns 1 if it contains this specific pattern/violation, and 0 otherwise. 
    The function should be named "check_violation".
    Return ONLY the Rust code for this function. No explanation.
    
    Example:
    fn check_violation(code: &str) -> i32 {
        if code.contains("fs.") && code.contains("React") { 1 } else { 0 }
    }
    `;

    const rustCode = await generateText({
        system: "You are the Rust Security Engineer for the Quantum Core. Write precise, hyper-targeted validation logic.",
        prompt: prompt,
        model: 'llama3',
        temperature: 0.1
    });

    const testId = `test_${Date.now()}`;
    const filePath = path.join(DYNAMIC_TESTS_DIR, `${testId}.rs`);

    // Wrap it in a way that can be linked or compiled
    const finalCode = `
pub fn check_violation(code: &str) -> i32 {
    ${rustCode.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim()}
}
    `;

    fs.writeFileSync(filePath, finalCode);
    console.log(`✅ TEST CREATED: ${filePath}`);
    return filePath;
}
