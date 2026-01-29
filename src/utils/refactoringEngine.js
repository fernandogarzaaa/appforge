/**
 * Code Refactoring Engine
 * Lightweight static analysis + safe transforms for JS/TS code.
 */

const DEFAULT_OPTIONS = {
  removeConsole: true,
  normalizeWhitespace: true,
  convertVarToLet: true,
  maxBlankLines: 2,
};

const countMatches = (value, regex) => (value.match(regex) || []).length;

export const analyzeCode = (code = '') => {
  const lines = code.split('\n');
  const functionCount = countMatches(code, /(function\s+\w+\s*\(|=>\s*\{)/g);
  const consoleCount = countMatches(code, /console\.(log|debug|info|warn|error)\s*\(/g);
  const todoCount = countMatches(code, /TODO|FIXME/g);
  const complexity = countMatches(code, /\bif\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|\?\s*[^:]+\s*:/g);

  const issues = [];
  if (consoleCount > 0) {
    issues.push({
      id: 'console',
      severity: 'low',
      message: `Found ${consoleCount} console statement(s)`
    });
  }
  if (todoCount > 0) {
    issues.push({
      id: 'todo',
      severity: 'medium',
      message: `Found ${todoCount} TODO/FIXME comment(s)`
    });
  }
  if (complexity > 10) {
    issues.push({
      id: 'complexity',
      severity: 'medium',
      message: 'High branching complexity detected'
    });
  }

  return {
    metrics: {
      lines: lines.length,
      characters: code.length,
      functions: functionCount,
      consoleStatements: consoleCount,
      todos: todoCount,
      complexity,
    },
    issues,
  };
};

export const refactorCode = (code = '', options = {}) => {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  let refactored = code;
  const changes = [];

  if (settings.removeConsole) {
    const before = refactored;
    refactored = refactored.replace(/^\s*console\.(log|debug|info|warn|error)\([^\n]*\);?\s*$/gm, '');
    if (before !== refactored) {
      changes.push('Removed console statements');
    }
  }

  if (settings.convertVarToLet) {
    const before = refactored;
    refactored = refactored.replace(/\bvar\s+/g, 'let ');
    if (before !== refactored) {
      changes.push('Converted var declarations to let');
    }
  }

  if (settings.normalizeWhitespace) {
    const before = refactored;
    refactored = refactored
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, `\n`.repeat(settings.maxBlankLines + 1));
    if (before !== refactored) {
      changes.push('Normalized whitespace and blank lines');
    }
  }

  return {
    refactoredCode: refactored.trimEnd(),
    changes,
  };
};

export const createRefactorPlan = (analysis, options = {}) => {
  const plan = [];
  if (analysis.metrics.consoleStatements > 0 && options.removeConsole !== false) {
    plan.push('Remove console statements');
  }
  if (analysis.metrics.todos > 0) {
    plan.push('Resolve TODO/FIXME comments');
  }
  if (analysis.metrics.complexity > 10) {
    plan.push('Split complex functions to reduce branching');
  }
  if (options.convertVarToLet !== false) {
    plan.push('Replace var with let/const where applicable');
  }
  if (options.normalizeWhitespace !== false) {
    plan.push('Normalize whitespace and reduce extra blank lines');
  }

  return plan;
};

export default {
  analyzeCode,
  refactorCode,
  createRefactorPlan,
};
