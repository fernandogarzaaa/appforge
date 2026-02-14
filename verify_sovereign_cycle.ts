import { runSwarmTask } from './src/swarm/orchestrator';

async function verify() {
    console.log("🚀 STARTING SOVEREIGN CYCLE VERIFICATION...");
    const task = "Create a React component 'src/components/WalletBalance.tsx' that uses '@solana/wallet-adapter-react' to display the user SOL balance in large green text.";

    try {
        const result = await runSwarmTask(task);
        console.log("✅ SWARM TASK COMPLETED");
        console.log("📝 Generated Code Preview:\n", result?.substring(0, 200), "...");
    } catch (error) {
        console.error("❌ VERIFICATION FAILED:", error);
    }
}

verify();
