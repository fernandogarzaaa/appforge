import * as fs from 'fs';
import * as path from 'path';

// Define the critical directories that must exist
const CRITICAL_DIRS = [
    'swarm/src/data',
    'swarm/core', // Assuming this is what was meant by 'swarm/swarm/core/' or just correcting to standard
    'swarm/data'
];

// Resolving project root (assuming this script is run from project root or scripts/)
const PROJECT_ROOT = process.cwd();

console.log('🏗️ [Hive Restoration] Stabilizing directory structure...');

CRITICAL_DIRS.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);

    // 1. Create Directory
    if (!fs.existsSync(fullPath)) {
        console.log(`   ➕ Creating directory: ${dir}`);
        fs.mkdirSync(fullPath, { recursive: true });
    } else {
        console.log(`   ✅ Directory exists: ${dir}`);
    }

    // 2. Add .gitkeep to preserve in git
    const gitKeepPath = path.join(fullPath, '.gitkeep');
    if (!fs.existsSync(gitKeepPath)) {
        console.log(`   📝 Adding .gitkeep to: ${dir}`);
        fs.writeFileSync(gitKeepPath, '', 'utf8');
    }
});

console.log('🛡️ [Hive Restoration] Directory stabilization complete.');
