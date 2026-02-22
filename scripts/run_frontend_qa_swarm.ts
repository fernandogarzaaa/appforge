import { QADirector } from '../swarm/agents/qa_director.js';

async function main() {
    console.log("=========================================");
    console.log("🚀 STARTING FRONTEND QA SWARM 🚀");
    console.log("=========================================\n");

    const director = new QADirector();

    // We target the locally running Vite dev server for E2E validation.
    const targetUrl = 'http://localhost:5173';
    const activeRoutes = ['/', '/admin', '/swarm', '/quantum-dashboard'];

    // In this cycle, the Swarm's goal is to find, interact with, and assert the presence of critical dashboard elements.
    const targetFeature = 'Sovereign UI';

    try {
        await director.executeQAWorkflow(targetUrl, activeRoutes, targetFeature);
        console.log("\n✅ [Swarm Execution] QA Swarm execution completed successfully.");
    } catch (error) {
        console.error("\n❌ [Swarm Execution] Fatal error inside QA Swarm:", error);
        process.exit(1);
    }
}

main();
