/**
 * Keyboard Shortcut Macros
 * Multi-key sequences and custom macros
 */

export const KEYBOARD_MACROS = {
  // Code Navigation Macros
  'fast-nav': {
    name: 'Fast Navigation',
    keys: ['g', 'd'],
    description: 'Go to Dashboard',
    action: 'navigate-dashboard'
  },
  'find-symbol': {
    name: 'Find Symbol',
    keys: ['ctrl', 'shift', 'o'],
    description: 'Open symbol finder',
    action: 'open-symbol-finder'
  },
  'go-definition': {
    name: 'Go to Definition',
    keys: ['f12'],
    description: 'Navigate to definition',
    action: 'goto-definition'
  },
  
  // Testing Macros
  'test-single': {
    name: 'Test Single File',
    keys: ['ctrl', 'shift', 't'],
    description: 'Run tests for current file',
    action: 'test-current-file'
  },
  'test-watch': {
    name: 'Test Watch Mode',
    keys: ['ctrl', 'alt', 't'],
    description: 'Start tests in watch mode',
    action: 'test-watch-mode'
  },
  'coverage-report': {
    name: 'Coverage Report',
    keys: ['ctrl', 'shift', 'c'],
    description: 'Generate coverage report',
    action: 'generate-coverage'
  },
  
  // Git Macros
  'git-status': {
    name: 'Git Status',
    keys: ['ctrl', 'g', 's'],
    description: 'Show git status',
    action: 'git-status'
  },
  'git-commit': {
    name: 'Git Commit',
    keys: ['ctrl', 'g', 'c'],
    description: 'Open commit dialog',
    action: 'git-commit'
  },
  'git-push': {
    name: 'Git Push',
    keys: ['ctrl', 'g', 'p'],
    description: 'Push to remote',
    action: 'git-push'
  },
  'git-pull': {
    name: 'Git Pull',
    keys: ['ctrl', 'g', 'u'],
    description: 'Pull from remote',
    action: 'git-pull'
  },
  
  // Build Macros
  'build-dev': {
    name: 'Build Dev',
    keys: ['ctrl', 'alt', 'b'],
    description: 'Build for development',
    action: 'build-dev'
  },
  'build-prod': {
    name: 'Build Production',
    keys: ['ctrl', 'shift', 'alt', 'b'],
    description: 'Build for production',
    action: 'build-prod'
  },
  'serve': {
    name: 'Start Server',
    keys: ['ctrl', 'alt', 's'],
    description: 'Start dev server',
    action: 'start-server'
  },
  
  // Performance Macros
  'profile-cpu': {
    name: 'Profile CPU',
    keys: ['ctrl', 'alt', 'p'],
    description: 'Start CPU profiler',
    action: 'profile-cpu'
  },
  'profile-memory': {
    name: 'Profile Memory',
    keys: ['ctrl', 'shift', 'alt', 'p'],
    description: 'Start memory profiler',
    action: 'profile-memory'
  },
  
  // Debug Macros
  'toggle-breakpoint': {
    name: 'Toggle Breakpoint',
    keys: ['f9'],
    description: 'Toggle breakpoint on line',
    action: 'toggle-breakpoint'
  },
  'debug-continue': {
    name: 'Continue Debugging',
    keys: ['f5'],
    description: 'Continue debug session',
    action: 'debug-continue'
  },
  'debug-step': {
    name: 'Step Into',
    keys: ['f11'],
    description: 'Step into function',
    action: 'debug-step-into'
  },
  'debug-over': {
    name: 'Step Over',
    keys: ['f10'],
    description: 'Step over line',
    action: 'debug-step-over'
  },
  
  // Refactor Macros
  'rename-symbol': {
    name: 'Rename Symbol',
    keys: ['f2'],
    description: 'Rename identifier',
    action: 'rename-symbol'
  },
  'extract-function': {
    name: 'Extract Function',
    keys: ['ctrl', 'alt', 'x'],
    description: 'Extract selection as function',
    action: 'extract-function'
  },
};

export function parseMacroKeys(macroKeys) {
  return macroKeys.join('+').toUpperCase();
}

export function isMacroComplete(currentKeys, macroDefinition) {
  return macroDefinition.keys.every((key, index) => 
    currentKeys[index] === key
  );
}
