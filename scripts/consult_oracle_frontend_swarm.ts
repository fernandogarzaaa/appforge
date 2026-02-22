import quantumCore from '../swarm/core/quantum_core.ts';

async function main() {
    try {
        const question = "Proposal: Create a dedicated Swarm to continuously test the frontend of the AppForge webapp to ensure it is flawless and always working. Additionally, add more swarms with more agents to the project to cover other areas. Should we proceed, and what are the best architectural patterns for these new swarms?";
        const options = [
            "Yes, build a Playwright/Cypress based UI testing swarm.",
            "Yes, implement a multi-agent visual regression swarm.",
            "No, rely on standard CI/CD and focus swarms purely on logic.",
            "Yes, build a comprehensive QA Swarm encompassing E2E, accessibility, and visual testing."
        ];

        console.log("=== ORACLE CONSULTATION ===");
        console.log("Question:", question);
        console.log("Options:", options);
        console.log("Consulting...");

        const decision = await quantumCore.consultOracle(question, options);

        console.log("\n=== ORACLE DECISION ===");
        console.log(JSON.stringify(decision, null, 2));
    } catch (e) {
        console.error("Error consulting oracle:", e);
    }
}

main();
