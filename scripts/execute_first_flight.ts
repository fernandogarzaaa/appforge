import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SovereignBridge } from '../src/core/Bridge.js';
import { broadcastLog } from '../src/server.js';

async function executeFirstFlight() {
    console.log("🚀 INITIATING FIRST FLIGHT [BUILD #600]...");

    const manifest: any = {
        build: 600,
        timestamp: new Date().toISOString(),
        files: []
    };

    const targetDirs = ['src'];
    const filesToVerify: string[] = [];

    function findFiles(dir: string) {
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
                    findFiles(fullPath);
                }
            } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
                filesToVerify.push(fullPath);
            }
        }
    }

    targetDirs.forEach(dir => findFiles(path.resolve(process.cwd(), dir)));

    console.log(`📡 Detected ${filesToVerify.length} files for integrity sweep.`);

    let blessedCount = 0;
    const TOTAL = filesToVerify.length;

    for (const file of filesToVerify) {
        const content = fs.readFileSync(file, 'utf-8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        const relativePath = path.relative(process.cwd(), file);

        try {
            // hit the Rust Kernel (via SovereignBridge)
            // Note: SovereignBridge.executeHandshake sends to localhost:3002/api/oracle/validate
            await SovereignBridge.executeHandshake({
                swarm_id: 'FIRST_FLIGHT_SWEEP',
                intent: `VERIFY_INTEGRITY: ${relativePath}`,
                payload: content,
                risk_score: 0.1
            });

            manifest.files.push({
                path: relativePath,
                hash: hash,
                status: 'BLESSED'
            });
            blessedCount++;

            if (blessedCount % 10 === 0 || blessedCount === TOTAL) {
                console.log(`[PROGRESS] Blessed: ${blessedCount}/${TOTAL} (${((blessedCount / TOTAL) * 100).toFixed(1)}%)`);
            }
        } catch (e: any) {
            console.error(`🛑 INTEGRITY VIOLATION in ${relativePath}: ${e.message}`);
            manifest.files.push({
                path: relativePath,
                hash: hash,
                status: 'VIOLATION',
                error: e.message
            });
        }
    }

    const PROD_DIR = path.resolve(process.cwd(), 'prod');
    if (!fs.existsSync(PROD_DIR)) fs.mkdirSync(PROD_DIR);

    fs.writeFileSync(
        path.join(PROD_DIR, 'FINAL_BUILD_600.json'),
        JSON.stringify(manifest, null, 2)
    );

    console.log(`\n✨ FIRST FLIGHT COMPLETE.`);
    console.log(`🛡️  BLESSED: ${blessedCount}/${TOTAL}`);
    console.log(`📄 Manifest Generated: prod/FINAL_BUILD_600.json`);

    if (blessedCount === TOTAL) {
        console.log("✅ SOVEREIGNTY RATIO: 1.00 - ZERO DEFECT ENVIRONMENT ACHIEVED.");
    } else {
        console.warn("⚠️  SOVEREIGNTY RATIO < 1.00 - SYSTEM REQUIRES ADDITIONAL HEALING.");
    }
}

executeFirstFlight().catch(console.error);
