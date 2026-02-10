
import { execSync } from 'child_process';

function runCheck(name, command) {
    console.log(`\n🔵 STARTING: ${name}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${name}: PASSED`);
        return true;
    } catch (e) {
        console.error(`❌ ${name}: FAILED`);
        return false;
    }
}

async function verifyGrandDesign() {
    console.log('🌌 INIT: GRAND DESIGN VERIFICATION PROTOCOL 🌌');
    console.log('================================================');

    const checks = [
        { name: 'Singularity Core', cmd: 'npx tsx scripts/verify_singularity.ts' },
        { name: 'Commercial Package', cmd: 'npx tsx scripts/verify_commercial_release.ts' },
        { name: 'Solana Commerce Node', cmd: 'node scripts/verify_solana_commerce.js' },
        { name: 'Deployment Readiness', cmd: 'node scripts/verify_deployment.js' }
    ];

    let passed = 0;
    for (const check of checks) {
        if (runCheck(check.name, check.cmd)) passed++;
        else break; // Stop on first failure to preserve causality
    }

    console.log('\n================================================');
    if (passed === checks.length) {
        console.log('✨ GRAND DESIGN VERIFIED. SYSTEM IS PERFECT.');
        console.log('💎 READY FOR $80,000/MO REVENUE STREAM.');
        process.exit(0);
    } else {
        console.error('⚠️ SYSTEM FLAWS DETECTED.');
        process.exit(1);
    }
}

verifyGrandDesign();
