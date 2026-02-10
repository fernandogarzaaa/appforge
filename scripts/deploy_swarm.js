import { execSync } from 'child_process';
import process from 'process';

console.log('🚀 SWARM DEPLOYMENT PROTOCOL INITIATED');

try {
    // 1. Check for Vercel CLI
    console.log('🔍 Checking for Vercel CLI...');
    // We use npx to run the local version
    const version = execSync('npx vercel --version').toString().trim();
    console.log(`   Detected Vercel CLI: ${version}`);

    // 2. Check Auth Status (Basic check)
    try {
        const whoami = execSync('npx vercel whoami').toString().trim();
        console.log(`   Authenticated as: ${whoami}`);
    } catch (e) {
        console.error('❌ ERROR: You are not logged in to Vercel.');
        console.error('   Action Required: Run "vercel login" in your terminal once.');
        process.exit(1);
    }

    // 3. Executing Deployment
    console.log('\n⚡ DEPLOYING TO PRODUCTION...');
    // --prod triggers a production deployment
    // --yes skips confirmation prompts
    const output = execSync('npx vercel deploy --prod --yes', { stdio: 'inherit' });

    console.log('\n✅ DEPLOYMENT SUCCESSFUL');
    console.log('   The Swarm is Live.');

} catch (e) {
    if (e.message.includes('command not found')) {
        console.error('❌ ERROR: Vercel CLI not found.');
        console.error('   Action: Run "npm install -g vercel"');
    } else {
        console.error('❌ DEPLOYMENT FAILED');
        console.error(e.message);
    }
    process.exit(1);
}
