
import fs from 'fs';
import path from 'path';

// Define Keep List
const KEEP = [
    'autonomousCycle.ts', // The Bridge
    'executeGodMode.ts',  // The Manual Trigger
    'simpleHealth.ts',    // The Probe
    'utils'               // Shared Utilities
];

// Helper: Get files in directory
const getFiles = (dir) => {
    return fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory());
};

async function checkPruning() {
    const rootFunctionsDir = path.resolve('functions');
    const srcFunctionsDir = path.resolve('src/functions');

    if (!fs.existsSync(rootFunctionsDir) || !fs.existsSync(srcFunctionsDir)) {
        console.error('Directories not found');
        return;
    }

    const rootFiles = getFiles(rootFunctionsDir);
    const srcFiles = getFiles(srcFunctionsDir);

    console.log(`Functions (Root): ${rootFiles.length}`);
    console.log(`Functions (Src): ${srcFiles.length}`);

    const toDelete = [];

    for (const file of rootFiles) {
        // rules:
        // 1. If in KEEP, skip
        if (KEEP.includes(file)) continue;

        // 2. If present in src/functions, keep (it's likely used by frontend hook convention)
        if (srcFiles.includes(file)) continue;

        toDelete.push(file);
    }

    console.log(`\nDeleting ${toDelete.length} legacy files...`);

    for (const file of toDelete) {
        try {
            fs.unlinkSync(path.join(rootFunctionsDir, file));
            console.log(`Deleted: ${file}`);
        } catch (e) {
            console.error(`Failed to delete ${file}: ${e.message}`);
        }
    }

    console.log('✅ Pruning Complete.');
}

checkPruning();
