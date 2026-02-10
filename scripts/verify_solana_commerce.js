
import fs from 'fs';

const EXPECTED_WALLET = "2ZeBAFtHq5vNThXMjbZ7E59Msgv6xPpBFn7cw4KMxmot";

async function verifySolanaSetup() {
    console.log('🔍 VERIFYING: Solana Subscription Setup (JS Mode)...');

    // 1. Check Script Content
    if (!fs.existsSync('examples/solana_commerce.js')) {
        throw new Error("examples/solana_commerce.js not found");
    }
    const scriptContent = fs.readFileSync('examples/solana_commerce.js', 'utf8');

    if (scriptContent.includes(EXPECTED_WALLET)) {
        console.log('✅ Wallet Address Configured Correctly.');
    } else {
        throw new Error("Wallet Address Integrity Checked Failed.");
    }

    if (scriptContent.includes('SUBSCRIPTION_PERIOD = "Monthly"')) {
        console.log('✅ Subscription Logic Active (Monthly).');
    } else {
        throw new Error("Subscription Logic Missing.");
    }

    // 2. Check Strategy
    const strategy = fs.readFileSync('COMMERCIAL_STRATEGY.md', 'utf8');
    if (strategy.includes('80,000 USDC') && strategy.includes('Month')) {
        console.log('✅ Strategic Alignment Confirmed ($80k/mo).');
    } else {
        throw new Error("Strategy Document Outdated.");
    }

    console.log('\n✨ QUANTUM COMMERCE: SUBSCRIPTION READY.');
}

verifySolanaSetup();
