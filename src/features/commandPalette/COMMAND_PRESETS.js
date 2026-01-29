/**
 * Enhanced Command Palette Commands
 * 40+ commands organized by category
 */

export const ENHANCED_COMMANDS = [
  // Navigation (10)
  { id: 'goto-dashboard', name: 'Go to Dashboard', category: 'Navigation', icon: '📊' },
  { id: 'goto-projects', name: 'Go to Projects', category: 'Navigation', icon: '📁' },
  { id: 'goto-deployments', name: 'Go to Deployments', category: 'Navigation', icon: '🚀' },
  { id: 'goto-analytics', name: 'Go to Analytics', category: 'Navigation', icon: '📈' },
  { id: 'goto-settings', name: 'Go to Settings', category: 'Navigation', icon: '⚙️' },
  { id: 'goto-account', name: 'Go to Account', category: 'Navigation', icon: '👤' },
  { id: 'goto-integrations', name: 'Go to Integrations', category: 'Navigation', icon: '🔌' },
  { id: 'goto-documentation', name: 'Go to Documentation', category: 'Navigation', icon: '📚' },
  { id: 'goto-support', name: 'Go to Support', category: 'Navigation', icon: '🆘' },
  { id: 'goto-feedback', name: 'Go to Feedback', category: 'Navigation', icon: '💬' },

  // Project Management (10)
  { id: 'new-project', name: 'New Project', category: 'Projects', icon: '✨' },
  { id: 'create-folder', name: 'Create Folder', category: 'Projects', icon: '📂' },
  { id: 'clone-project', name: 'Clone Project', category: 'Projects', icon: '📋' },
  { id: 'duplicate-project', name: 'Duplicate Project', category: 'Projects', icon: '📑' },
  { id: 'archive-project', name: 'Archive Project', category: 'Projects', icon: '📦' },
  { id: 'delete-project', name: 'Delete Project', category: 'Projects', icon: '🗑️' },
  { id: 'search-projects', name: 'Search Projects', category: 'Projects', icon: '🔍' },
  { id: 'project-settings', name: 'Project Settings', category: 'Projects', icon: '⚙️' },
  { id: 'export-project', name: 'Export Project', category: 'Projects', icon: '📤' },
  { id: 'import-project', name: 'Import Project', category: 'Projects', icon: '📥' },

  // Development Tools (10)
  { id: 'run-tests', name: 'Run Tests', category: 'Dev Tools', icon: '✓' },
  { id: 'run-lint', name: 'Run Linter', category: 'Dev Tools', icon: '🔍' },
  { id: 'build-project', name: 'Build Project', category: 'Dev Tools', icon: '🔨' },
  { id: 'start-server', name: 'Start Dev Server', category: 'Dev Tools', icon: '▶️' },
  { id: 'stop-server', name: 'Stop Dev Server', category: 'Dev Tools', icon: '⏹️' },
  { id: 'format-code', name: 'Format Code', category: 'Dev Tools', icon: '✨' },
  { id: 'analyze-performance', name: 'Analyze Performance', category: 'Dev Tools', icon: '⚡' },
  { id: 'view-logs', name: 'View Logs', category: 'Dev Tools', icon: '📋' },
  { id: 'debug-mode', name: 'Toggle Debug Mode', category: 'Dev Tools', icon: '🐛' },
  { id: 'open-terminal', name: 'Open Terminal', category: 'Dev Tools', icon: '💻' },

  // Collaboration (8)
  { id: 'invite-member', name: 'Invite Team Member', category: 'Collaboration', icon: '👥' },
  { id: 'start-pair-session', name: 'Start Pair Programming', category: 'Collaboration', icon: '🤝' },
  { id: 'create-review', name: 'Create Code Review', category: 'Collaboration', icon: '👀' },
  { id: 'share-project', name: 'Share Project', category: 'Collaboration', icon: '📤' },
  { id: 'team-settings', name: 'Team Settings', category: 'Collaboration', icon: '👥' },
  { id: 'view-team', name: 'View Team', category: 'Collaboration', icon: '📋' },
  { id: 'permissions', name: 'Manage Permissions', category: 'Collaboration', icon: '🔐' },
  { id: 'activity-log', name: 'Activity Log', category: 'Collaboration', icon: '📝' },

  // Theme & Appearance (5)
  { id: 'toggle-theme', name: 'Toggle Dark/Light', category: 'Appearance', icon: '🌙' },
  { id: 'customize-theme', name: 'Customize Theme', category: 'Appearance', icon: '🎨' },
  { id: 'reset-theme', name: 'Reset Theme to Default', category: 'Appearance', icon: '↺' },
  { id: 'theme-gallery', name: 'Theme Gallery', category: 'Appearance', icon: '🖼️' },
  { id: 'font-settings', name: 'Font Settings', category: 'Appearance', icon: '🔤' },

  // Help & Info (5)
  { id: 'show-help', name: 'Show Help', category: 'Help', icon: '❓' },
  { id: 'keyboard-shortcuts', name: 'Keyboard Shortcuts', category: 'Help', icon: '⌨️' },
  { id: 'report-bug', name: 'Report Bug', category: 'Help', icon: '🐛' },
  { id: 'request-feature', name: 'Request Feature', category: 'Help', icon: '💡' },
  { id: 'about-app', name: 'About AppForge', category: 'Help', icon: 'ℹ️' },
];

export const COMMAND_SHORTCUTS = {
  'goto-dashboard': 'g d',
  'goto-projects': 'g p',
  'goto-deployments': 'g d',
  'new-project': 'n p',
  'run-tests': 'r t',
  'toggle-theme': 't t',
  'show-help': '?',
};

export const COMMAND_HISTORY_LIMIT = 50;
