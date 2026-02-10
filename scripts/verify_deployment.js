
import fs from 'fs';
import path from 'path';

async function verifyDeployment() {
    console.log('🚀 VERIFYING: Deployment Protocol...');

    const requiredFiles = [
        'DEPLOYMENT_GUIDE.md',
        'vercel.json',
        'public/index.html',
        'public/payment_portal.html',
        'public/privacy.html',
        'public/terms.html',
        'examples/solana_commerce_prod.js'
    ];

    let missing = [];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            missing.push(file);
        }
    }

    if (missing.length > 0) {
        console.error('❌ MISSING ASSETS:', missing.join(', '));
        process.exit(1);
    }

    // Check index.html redirect
    const indexContent = fs.readFileSync('public/index.html', 'utf8');
    if (!indexContent.includes('payment_portal.html')) {
        console.error('❌ index.html does not redirect to payment_portal.html');
        process.exit(1);
    }

    // Check payment_portal.html for Web3 Native Protocol
    const portalContent = fs.readFileSync('public/payment_portal.html', 'utf8');
    if (!portalContent.includes('solana:') && !portalContent.includes('window.solana')) {
        console.error('❌ payment_portal.html is missing Web3 Native logic (solana protocol or window.solana)');
        process.exit(1);
    }
    if (portalContent.includes('moonpay.com')) {
        console.warn('⚠️ WARNING: MoonPay artifacts still detected in payment_portal.html (Clean up if purely native)');
    }

    // Check vercel.json config
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    if (!vercelConfig.routes || vercelConfig.routes[0].dest !== '/public/$1') {
        console.error('❌ vercel.json route configuration mismatch');
        process.exit(1);
    }

    console.log('✅ All Deployment Assets Present & Configured.');
    console.log('   - Frontend: Vercel Ready');
    console.log('   - Backend: production script ready');
}

verifyDeployment();
