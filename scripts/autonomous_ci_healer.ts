import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { QuantumSwarmCore } from '../swarm/core/quantum_core.js';
import { AtomicPatcher, PatchChunk } from '../swarm/core/atomic_patcher.js';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function runHealer() {
    console.log("🛠️ [CI Healer] Initiating autonomous repository investigation...");
    try {
        let runOutput;
        try {
            runOutput = execSync('gh run list --status=failure --limit 3 --json databaseId,name,conclusion', { encoding: 'utf8' });
        } catch (e: any) {
            console.warn("⚠️ [CI Healer] Could not list gh runs. Ensure GH_TOKEN is set. " + e.message);
            return;
        }

        const failedRuns = JSON.parse(runOutput);

        if (failedRuns.length === 0) {
            console.log("✨ [CI Healer] No recent failed CI runs found. System is healthy.");
            return;
        }

        const targetRun = failedRuns[0];
        console.log(`🔍 [CI Healer] Analyzing latest failure: ${targetRun.name} (ID: ${targetRun.databaseId})`);

        let logOutput = "";
        try {
            logOutput = execSync(`gh run view ${targetRun.databaseId} --log`, { encoding: 'utf8' });
        } catch (e: any) {
            console.warn("⚠️ [CI Healer] Failed to download logs: " + e.message);
            return;
        }

        const logSnippet = logOutput.slice(-3500);

        const core = new QuantumSwarmCore();
        const patcher = new AtomicPatcher(PROJECT_ROOT);

        const prompt = `A GitHub Action workflow named '${targetRun.name}' failed with the following log context:\n\`\`\`\n${logSnippet}\n\`\`\`\nAnalyze this error trace and generate a specific, safe fix.\nIdentify exactly which file inside the repository needs patching.\nReturn ONLY a JSON object with this exact structure:\n{"fileName": "relative/path/to/file.ext", "patches": [{"targetContent": "existing exact string", "replacementContent": "new exact string"}], "reasoning": "Brief explanation of the fix"}\nWhitespace inside 'targetContent' and 'replacementContent' must be EXACT so the patcher can perform a literal string replace.\nDo not include markdown blocks around the JSON output.`;

        const consultation = await core.consultOracle(prompt, ['GENERATE_CI_PATCH'], ['safety', 'integrity']);
        const rawResponse = (consultation as any).reasoning || consultation.recommendation || '';

        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const patchData = JSON.parse(jsonMatch[0]);
            if (patchData.fileName && patchData.patches && patchData.patches.length > 0) {
                console.log(`🧠 [CI Healer] Oracle diagnosed the issue. Recommends patching ${patchData.fileName}. Applying...`);

                const fullPath = path.resolve(PROJECT_ROOT, patchData.fileName);
                try {
                    await fs.access(fullPath);
                    const result = await patcher.applyPatches(patchData.fileName, patchData.patches);
                    if (result.success) {
                        console.log(`✅ [CI Healer] Fix applied successfully! Reason: ${patchData.reasoning}`);
                        try {
                            execSync('git config --global user.name "Swarm CI Healer"');
                            execSync('git config --global user.email "ci-healer@appforge.bot"');
                            execSync(`git add ${patchData.fileName}`);
                            let commitMsg = `fix(ci): autonomous heal for ${targetRun.name} - ${patchData.reasoning.substring(0, 60)}`;
                            execSync(`git commit -m "${commitMsg}"`);
                            execSync('git push origin HEAD');
                            console.log(`🚀 [CI Healer] Fix committed and pushed to repository.`);
                        } catch (gitErr: any) {
                            console.warn(`⚠️ [CI Healer] Git commit/push failed (perhaps no structural changes were made?): ${gitErr.message}`);
                        }
                    } else {
                        console.error(`❌ [CI Healer] Failed to apply patch: ${result.error}`);
                    }
                } catch (e) {
                    console.error(`❌ [CI Healer] Target file ${patchData.fileName} does not exist or cannot be accessed.`);
                }
            } else {
                console.warn("⚠️ [CI Healer] Oracle returned invalid or empty patch JSON structure.");
            }
        } else {
            console.warn("⚠️ [CI Healer] Oracle did not return a valid JSON payload block.");
        }

    } catch (e: any) {
        console.error(`💥 [CI Healer] Fatal logic error in script: ${e.message}`);
    }
}

runHealer().catch(console.error);
