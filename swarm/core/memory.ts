
import { FileSystemTool } from '../tools/filesystem.js';
import path from 'path';

export interface FileNode {
    path: string;
    type: 'component' | 'hook' | 'service' | 'utility' | 'config' | 'other';
    imports: string[];
    exports: string[];
    summary: string;
    lastModified: string;
}

export class SwarmMemory {
    fs: FileSystemTool;
    memoryFile: string;
    projectMap: Map<string, FileNode>;

    constructor(fsTool: FileSystemTool) {
        this.fs = fsTool;
        this.memoryFile = 'swarm_memory.json';
        this.projectMap = new Map();
    }

    async loadMemory() {
        try {
            const content = await this.fs.readFile(this.memoryFile);
            const data = JSON.parse(content);
            this.projectMap = new Map(Object.entries(data));
            console.log(`🧠 [Memory] Loaded context for ${this.projectMap.size} files.`);
        } catch (e) {
            console.log('🧠 [Memory] No existing memory found. Starting fresh.');
        }
    }

    async saveMemory() {
        const obj = Object.fromEntries(this.projectMap);
        await this.fs.writeFile(this.memoryFile, JSON.stringify(obj, null, 2));
    }

    async buildContextMap() {
        console.log('🧠 [Memory] Scanning project architecture...');
        const files = await this.fs.listFiles('src/**/*.{js,jsx,ts,tsx}');

        for (const file of files) {
            const content = await this.fs.readFile(file);
            const node = this.analyzeFile(file, content);
            this.projectMap.set(file, node);
        }

        await this.saveMemory();
        console.log(`🧠 [Memory] Context Map built with ${this.projectMap.size} nodes.`);
        return this.projectMap;
    }

    analyzeFile(filePath: string, content: string): FileNode {
        const imports = this.extractImports(content);
        const exports = this.extractExports(content);
        const type = this.determineType(filePath);

        return {
            path: filePath,
            type,
            imports,
            exports,
            summary: `Contains ${exports.length} exports. Depends on ${imports.length} modules.`,
            lastModified: new Date().toISOString()
        };
    }

    determineType(filePath: string): FileNode['type'] {
        if (filePath.includes('/components/')) return 'component';
        if (filePath.includes('/hooks/')) return 'hook';
        if (filePath.includes('/services/')) return 'service';
        if (filePath.includes('/utils/') || filePath.includes('/lib/')) return 'utility';
        if (filePath.includes('.config.')) return 'config';
        return 'other';
    }

    extractImports(content: string): string[] {
        const regex = /from\s+['"]([^'"]+)['"]/g;
        const matches = [...content.matchAll(regex)];
        return matches.map(m => m[1]);
    }

    extractExports(content: string): string[] {
        const regex = /export\s+(const|function|class|default)\s+([a-zA-Z0-9_]+)/g;
        const matches = [...content.matchAll(regex)];
        return matches.map(m => m[2]);
    }

    async retrieveContext(query: string): Promise<string> {
        // Simple keyword search in memory
        // In a real RAG system, this would use embeddings
        const relevantNodes = [];
        for (const [path, node] of this.projectMap.entries()) {
            if (path.includes(query) || node.exports.some(e => e.includes(query))) {
                relevantNodes.push(node);
            }
        }

        return JSON.stringify(relevantNodes.slice(0, 5), null, 2);
    }

    async search(query: string): Promise<Array<{ text: string, score: number }>> {
        // Simulated semantic search
        // In a real implementation, this would query a vector DB
        const results = [];
        const terms = query.toLowerCase().split(' ');

        for (const [path, node] of this.projectMap.entries()) {
            let score = 0;
            const content = (node.summary + ' ' + node.path).toLowerCase();

            terms.forEach(term => {
                if (content.includes(term)) score += 0.2;
            });

            if (score > 0) {
                results.push({
                    text: `File: ${node.path} - ${node.summary}`,
                    score: Math.min(score, 1.0)
                });
            }
        }

        return results.sort((a, b) => b.score - a.score).slice(0, 5);
    }
}
