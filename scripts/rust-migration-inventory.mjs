#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.venv',
  '__pycache__',
  'target',
]);

const EXTENSION_PRIORITY = ['.ts', '.tsx', '.js', '.jsx', '.rs', '.py'];

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
      continue;
    }
    files.push(path.join(dir, entry.name));
  }
  return files;
}

function extensionStats(files) {
  const stats = new Map();
  for (const file of files) {
    const ext = path.extname(file) || '<none>';
    stats.set(ext, (stats.get(ext) ?? 0) + 1);
  }
  return Object.fromEntries([...stats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20));
}

function lineStats(files) {
  const totals = Object.fromEntries(EXTENSION_PRIORITY.map((ext) => [ext, 0]));
  for (const file of files) {
    const ext = path.extname(file);
    if (!EXTENSION_PRIORITY.includes(ext)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/).length;
    totals[ext] += lines;
  }
  return totals;
}

function cargoCrates(files) {
  return files
    .filter((file) => path.basename(file) === 'Cargo.toml')
    .map((file) => path.relative(ROOT, file));
}

function rustCandidates(files) {
  const scored = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (!rel.startsWith('functions/') || path.extname(file) !== '.ts') continue;
    const content = fs.readFileSync(file, 'utf8');
    let score = 0;
    if (/crypto|encrypt|decrypt|key|token|permission|security/i.test(content)) score += 3;
    if (/process\.env|secret|OPENAI_API_KEY|private/i.test(content)) score += 3;
    if (/execute|workflow|pipeline|trigger/i.test(content)) score += 2;
    if (/axios|fetch|request|http/i.test(content)) score += 1;
    if (/any\b/.test(content)) score -= 1;

    if (score >= 4) scored.push({ file: rel, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 20);
}

const files = walk(ROOT);
const packageJson = safeReadJson(path.join(ROOT, 'package.json')) ?? {};

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalFiles: files.length,
    topExtensions: extensionStats(files),
    lineCounts: lineStats(files),
  },
  ecosystems: {
    npmScripts: Object.keys(packageJson.scripts ?? {}).length,
    dependencyCount:
      Object.keys(packageJson.dependencies ?? {}).length +
      Object.keys(packageJson.devDependencies ?? {}).length,
    rustCrates: cargoCrates(files),
  },
  rustMigration: {
    highValueCandidates: rustCandidates(files),
  },
};

const outputPath = path.join(ROOT, 'reports', 'project-analysis.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
