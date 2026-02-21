import { execSync } from 'child_process';
import process from 'process';

console.log('🚀 AppForge Desktop Packager');
console.log('Installing temporary Electron dependencies without modifying package.json...');

try {
    execSync('npm install electron electron-builder --no-save', { stdio: 'inherit' });
    console.log('\n✅ Local dependencies installed.');
    console.log('To run the desktop application, execute: npm run app:desktop');
} catch (e) {
    console.error('❌ Failed to install desktop dependencies locally.', e.message);
    process.exit(1);
}
