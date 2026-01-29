import { describe, it, expect } from 'vitest';
import {
  analyzeCode,
  refactorCode,
  createRefactorPlan,
} from '@/utils/refactoringEngine';

describe('Refactoring Engine', () => {
  it('analyzes code metrics and issues', () => {
    const code = `
      // TODO: cleanup
      var x = 1;
      if (x) {
        console.log(x);
      }
    `;

    const analysis = analyzeCode(code);
    expect(analysis.metrics.lines).toBeGreaterThan(0);
    expect(analysis.metrics.consoleStatements).toBe(1);
    expect(analysis.issues.length).toBeGreaterThan(0);
  });

  it('refactors code safely', () => {
    const code = `var total = 0;\nconsole.log(total);\n\n\n`;
    const result = refactorCode(code, { removeConsole: true, convertVarToLet: true });

    expect(result.refactoredCode.includes('let total')).toBe(true);
    expect(result.refactoredCode.includes('console.log')).toBe(false);
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it('creates a refactor plan', () => {
    const analysis = analyzeCode('var a = 1;\nconsole.log(a);');
    const plan = createRefactorPlan(analysis, {});

    expect(plan.length).toBeGreaterThan(0);
  });
});
