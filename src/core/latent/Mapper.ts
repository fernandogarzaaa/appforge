import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface LatentCoordinates {
    x: number; // Safety: (0.0 - 1.0)
    y: number; // Efficiency: (0.0 - 1.0)
    z: number; // Purpose: (0.0 - 1.0)
    hash: string;
}

class LatentMapper {
    private rootDir: string;

    constructor(rootDir: string) {
        this.rootDir = rootDir;
    }

    private analyzeSafety(content: string): number {
        const triggers = [
            'try', 'catch', 'throw', 'Error', 'if', 'else', 'return', 'await',
            'readonly', 'interface', 'type', 'unknown', 'never'
        ];
        let score = 0.5;
        triggers.forEach(t => { if (content.includes(t)) score += 0.05; });
        if (content.includes('any')) score -= 0.1;
        if (content.includes('eval')) score -= 0.3;
        return Math.min(Math.max(score, 0), 1);
    }

    private analyzeEfficiency(content: string): number {
        let score = 0.7;
        if (content.includes('for (') || content.includes('forEach')) score -= 0.1;
        if (content.includes('while (')) score -= 0.1;
        if (content.includes('Promise.all')) score += 0.1;
        if (content.includes('memo') || content.includes('cache')) score += 0.1;
        const lineCount = content.split('\n').length;
        if (lineCount > 500) score -= 0.2;
        return Math.min(Math.max(score, 0), 1);
    }

    private analyzePurpose(filePath: string): number {
        if (filePath.includes('.rs')) return 0.9; // Kernel/Governance
        if (filePath.includes('.ts')) return 0.6; // Business Logic
        if (filePath.includes('.tsx') || filePath.includes('.jsx')) return 0.3; // UI/UX
        return 0.5;
    }

    async mapRepository() {
        console.log("🌀 INITIATING LATENT MAPPING...");
        const files = this.walk(path.join(this.rootDir, 'src'));
        files.push(...this.walk(path.join(this.rootDir, 'swarm/core/quantum_bridge')));

        for (const file of files) {
            if (file.endsWith('.geometry.json')) continue;

            const content = fs.readFileSync(file, 'utf-8');
            const coords: LatentCoordinates = {
                x: this.analyzeSafety(content),
                y: this.analyzeEfficiency(content),
                z: this.analyzePurpose(file),
                hash: crypto.createHash('sha256').update(content).digest('hex')
            };

            const sidecarPath = `${file}.geometry.json`;
            fs.writeFileSync(sidecarPath, JSON.stringify(coords, null, 2));
            console.log(`📍 Vectorized: ${path.relative(this.rootDir, file)}`);
        }
    }

    private walk(dir: string): string[] {
        let results: string[] = [];
        if (!fs.existsSync(dir)) return [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (file !== 'node_modules' && file !== 'dist') {
                    results = results.concat(this.walk(fullPath));
                }
            } else if (/\.(ts|tsx|js|jsx|rs)$/.test(file)) {
                results.push(fullPath);
            }
        });
        return results;
    }
}

const mapper = new LatentMapper(process.cwd());
mapper.mapRepository().then(() => console.log("✨ REPOSITORY VECTORIZED."));
