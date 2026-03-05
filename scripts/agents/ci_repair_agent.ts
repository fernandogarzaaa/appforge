import { spawnSync } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface AgentInput {
  task_id: string;
  description: string;
}

interface AgentResult {
  success: boolean;
  log: string;
  checks: {
    lint_fix: boolean;
    typecheck: boolean;
  };
  typecheck_mode: 'delta' | 'full' | 'skipped';
}

function collectChangedTypecheckFiles(): string[] {
  const diff = spawnSync('git', ['diff', '--name-only', 'origin/main...HEAD'], { encoding: 'utf-8' });
  const output = `${diff.stdout ?? ''}\n${diff.stderr ?? ''}`;
  const files = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => /\.(ts|tsx|js|jsx)$/.test(file))
    .filter((file) => file.startsWith('src/') || file.startsWith('functions/') || file.startsWith('types/'));

  return Array.from(new Set(files));
}

function runDeltaTypecheck(files: string[]): { ok: boolean; log: string; mode: AgentResult['typecheck_mode'] } {
  if (files.length === 0) {
    return {
      ok: true,
      mode: 'skipped',
      log: 'Typecheck skipped: no changed TS/JS files under src/functions/types.'
    };
  }

  const tempConfigPath = path.join(process.cwd(), '.tmp_swarm_typecheck.json');
  try {
    writeFileSync(
      tempConfigPath,
      JSON.stringify(
        {
          extends: './jsconfig.json',
          include: [],
          files
        },
        null,
        2
      )
    );

    const result = spawnSync('npx', ['tsc', '-p', tempConfigPath, '--pretty', 'false'], { encoding: 'utf-8' });
    const log = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();

    return {
      ok: (result.status ?? 1) === 0,
      mode: 'delta',
      log: [
        `Typecheck scope: changed files (${files.length})`,
        ...files,
        '',
        log || 'Typecheck passed with no diagnostics.'
      ].join('\n')
    };
  } finally {
    if (existsSync(tempConfigPath)) {
      unlinkSync(tempConfigPath);
    }
  }
}

export function runAgent(input: AgentInput): AgentResult {
  const lintFix = spawnSync('npm', ['run', 'lint:fix'], { encoding: 'utf-8' });
  const changedFiles = collectChangedTypecheckFiles();
  const typecheck = runDeltaTypecheck(changedFiles);

  const lintFixOk = (lintFix.status ?? 1) === 0;
  const success = lintFixOk && typecheck.ok;
  const log = [
    `[${input.task_id}] ${input.description}`,
    '',
    '=== lint:fix ===',
    `${lintFix.stdout ?? ''}${lintFix.stderr ?? ''}`.trim() || 'No lint output.',
    '',
    '=== typecheck ===',
    typecheck.log
  ].join('\n');

  return {
    success,
    log,
    checks: {
      lint_fix: lintFixOk,
      typecheck: typecheck.ok
    },
    typecheck_mode: typecheck.mode
  };
}
