import fs from 'fs';
import path from 'path';
import { broadcastLog } from '../../logger.js';

export class LogicMapper {
    private KB_DIR = path.resolve(process.cwd(), 'swarm/core/src/knowledge_base');

    constructor() {
        if (!fs.existsSync(this.KB_DIR)) {
            fs.mkdirSync(this.KB_DIR, { recursive: true });
        }
    }

    /**
     * findTemplate:
     * Checks if a request matches a known deterministic pattern.
     * Returns the Rust template if found.
     */
    findTemplate(request: string): string | null {
        // 1. Check Distilled Templates (Phase 31)
        const templatesDir = path.resolve(process.cwd(), 'swarm/core/src/knowledge_base/templates');
        if (fs.existsSync(templatesDir)) {
            try {
                const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.rs'));
                for (const t of templates) {
                    // Simple fuzzy match for simulation
                    const name = t.replace('.rs', '').replace(/_/g, ' ');
                    if (request.toLowerCase().includes(name.toLowerCase())) {
                        broadcastLog('LOGIC_MAPPER', `💎 Distilled Wisdom Found: ${t}`, 'SUCCESS');
                        return fs.readFileSync(path.join(templatesDir, t), 'utf-8');
                    }
                }
            } catch (e) { }
        }

        // 2. Check Standard Patterns (Phase 30)
        if (request.includes('Solana Payment') || request.includes('SPL Token')) {
            const templatePath = path.join(this.KB_DIR, 'solana_payment.rs');
            if (fs.existsSync(templatePath)) {
                broadcastLog('LOGIC_MAPPER', 'Deterministic Pattern Matched: Solana Payment', 'SUCCESS');
                return fs.readFileSync(templatePath, 'utf-8');
            }
        }
        return null;
    }

    /**
     * crystallizePattern:
     * Saves a recurring logic pattern as a static template.
     */
    crystallizePattern(name: string, content: string): void {
        const filePath = path.join(this.KB_DIR, `${name}.rs`);
        fs.writeFileSync(filePath, content);
        broadcastLog('LOGIC_MAPPER', `Crystallized Pattern: ${name}`, 'INFO');
    }
}
