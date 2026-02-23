import path from 'path';

const BLOCKED_PATTERNS = [/\bfs\.readFileSync\b/, /\bexecSync\b/, /rm\s+-rf\s+\//];
const PROTECTED_PATHS = ['package.json', 'package-lock.json', '.github/workflows'];

export interface MutationProposal {
  touchedFiles: string[];
  generatedCode?: string;
}

export interface MutationGuardResult {
  allowed: boolean;
  reasons: string[];
  riskScore: number;
}

export function evaluateMutationSafety(proposal: MutationProposal): MutationGuardResult {
  const reasons: string[] = [];

  for (const filePath of proposal.touchedFiles) {
    const normalized = filePath.split(path.sep).join('/');
    if (PROTECTED_PATHS.some((protectedPath) => normalized === protectedPath || normalized.startsWith(`${protectedPath}/`))) {
      reasons.push(`Protected path mutated: ${normalized}`);
    }
  }

  if (proposal.generatedCode) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(proposal.generatedCode)) {
        reasons.push(`Blocked mutation pattern detected: ${pattern.toString()}`);
      }
    }
  }

  const riskScore = Math.min(1, reasons.length * 0.4);
  return {
    allowed: reasons.length === 0,
    reasons,
    riskScore,
  };
}
