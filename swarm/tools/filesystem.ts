
import fs from 'fs/promises';
import path from 'path';
import * as globModule from 'glob';
const { glob } = globModule;

export class FileSystemTool {
    baseDir: string;

    constructor(baseDir: string = process.cwd()) {
        this.baseDir = baseDir;
    }

    async readFile(filePath: string): Promise<string> {
        const fullPath = path.resolve(this.baseDir, filePath);
        return await fs.readFile(fullPath, 'utf8');
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const fullPath = path.resolve(this.baseDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
    }

    async listFiles(pattern: string = '**/*'): Promise<string[]> {
        return await glob(pattern, { cwd: this.baseDir, ignore: 'node_modules/**' });
    }
}
