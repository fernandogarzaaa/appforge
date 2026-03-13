import fs from 'fs/promises';
import path from 'path';
export class MetricsInstrumentation {
    metricsPath;
    constructor(metricsPath = path.join(process.cwd(), 'swarm', 'benchmarks', 'evolution_metrics_history.json')) {
        this.metricsPath = metricsPath;
    }
    async readHistory() {
        try {
            const data = await fs.readFile(this.metricsPath, 'utf8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async append(record) {
        const history = await this.readHistory();
        const next = [...history, record];
        await fs.mkdir(path.dirname(this.metricsPath), { recursive: true });
        await fs.writeFile(this.metricsPath, JSON.stringify(next, null, 2), 'utf8');
        return next;
    }
}
