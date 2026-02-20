import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Replicator {
    private rootDir: string;
    private seedDir: string;

    constructor() {
        // Root is parent of swarm/core/
        this.rootDir = path.resolve(__dirname, '../../');
        this.seedDir = path.join(this.rootDir, 'seeds');

        if (!fs.existsSync(this.seedDir)) {
            fs.mkdirSync(this.seedDir, { recursive: true });
        }
    }

    /**
     * Packages the swarm into a "Seed" zip archive.
     */
    async createSeed(name: string = 'swarm_seed'): Promise<string> {
        console.log(`🧬 [Replication] Creating Seed: ${name}...`);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const seedFileName = `${name}_${timestamp}.zip`;
        const seedPath = path.join(this.seedDir, seedFileName);

        try {
            const swarmPath = path.join(this.rootDir, 'swarm');
            const tempStage = path.join(this.seedDir, `stage_${timestamp}`);

            if (!fs.existsSync(tempStage)) fs.mkdirSync(tempStage, { recursive: true });

            console.log(`   📦 Staging cognitive core (Surgery Mode)...`);
            // Copy files individually to avoid locking/access issues
            const itemsToCopy = ['agents', 'core', 'tools', 'package.json', 'tsconfig.json', 'server.ts'];
            for (const item of itemsToCopy) {
                const src = path.join(swarmPath, item);
                const dest = path.join(tempStage, item);
                if (fs.existsSync(src)) {
                    // Using powershell copy for recursive directory copying
                    execSync(`powershell -Command "Copy-Item -Path '${src}' -Destination '${dest}' -Recurse -Force"`);
                }
            }

            // Create Zip from Stage
            const psCmd = `powershell -Command "Compress-Archive -Path '${tempStage}\\*' -DestinationPath '${seedPath}' -Force"`;

            console.log(`   🗜️  Compiling Seed archive...`);
            execSync(psCmd, { stdio: 'inherit' });

            // Cleanup Stage
            execSync(`powershell -Command "Remove-Item -Path '${tempStage}' -Recurse -Force"`);

            console.log(`   ✅ Seed created: ${seedPath}`);
            return seedPath;
        } catch (error) {
            console.error(`   ❌ Seed creation failed: ${error}`);
            throw error;
        }
    }

    /**
     * Generates a "Spore" ignition script for the target environment.
     */
    async createSpore(targetOS: 'windows' | 'linux' = 'windows'): Promise<string> {
        console.log(`🧬 [Replication] Generating Spore Ignition Script...`);
        const sporeName = targetOS === 'windows' ? 'ignite_swarm.bat' : 'ignite_swarm.sh';
        const sporePath = path.join(this.seedDir, sporeName);

        const windowsScript = `@echo off
echo 🧬 Swarm Spore Igniting...
powershell -Command "Expand-Archive -Path swarm_seed.zip -DestinationPath . -Force"
cd swarm
npm install
npm run dev
`;

        const linuxScript = `#!/bin/bash
echo "🧬 Swarm Spore Igniting..."
unzip swarm_seed.zip
cd swarm
npm install
npm run dev
`;

        const content = targetOS === 'windows' ? windowsScript : linuxScript;
        fs.writeFileSync(sporePath, content);

        console.log(`   ✅ Spore Ignition Script generated: ${sporePath}`);
        return sporePath;
    }
}

export const replicator = new Replicator();
