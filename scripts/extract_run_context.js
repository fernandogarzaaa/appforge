import fs from 'node:fs';
import path from 'node:path';

const runContextPath = path.join(process.cwd(), 'swarm', 'run_context.json');
const raw = fs.readFileSync(runContextPath, 'utf8');
const context = JSON.parse(raw);

const strategyIds = Array.isArray(context.strategies)
  ? context.strategies.map((strategy) => strategy.id)
  : [];

console.log(`has_task=${context.has_task}`);
console.log(`run_id=${context.run_id}`);
console.log(`strategies=${JSON.stringify(strategyIds)}`);
