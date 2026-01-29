import { useState, useCallback, useEffect } from 'react';

/**
 * Git Workflows Hook
 * Manage GitHub/GitLab workflows, PRs, and commits
 */
export function useGitWorkflows() {
  const [workflows, setWorkflows] = useState(() => {
    const saved = localStorage.getItem('appforge_git_workflows');
    return saved ? JSON.parse(saved) : [];
  });
  const [pullRequests, setPullRequests] = useState([]);
  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState('idle'); // idle, running, completed, failed
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  // Save workflows to localStorage
  useEffect(() => {
    localStorage.setItem('appforge_git_workflows', JSON.stringify(workflows));
  }, [workflows]);

  /**
   * Create workflow template
   */
  const createWorkflow = useCallback((name, config) => {
    const workflow = {
      id: `workflow_${Date.now()}`,
      name,
      config,
      createdAt: Date.now(),
      runsCount: 0,
      lastRun: null,
      status: 'draft'
    };
    setWorkflows(prev => [...prev, workflow]);
    return workflow;
  }, []);

  /**
   * Deploy workflow (activate it)
   */
  const deployWorkflow = useCallback(async (workflowId) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) throw new Error('Workflow not found');

      const response = await fetch('/api/git/workflows/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow })
      });

      if (!response.ok) throw new Error('Deployment failed');

      setWorkflows(prev =>
        prev.map(w => w.id === workflowId ? { ...w, status: 'active' } : w)
      );
      return true;
    } catch (error) {
      console.error('Deploy error:', error);
      return false;
    }
  }, [workflows]);

  /**
   * Trigger workflow run
   */
  const triggerWorkflow = useCallback(async (workflowId, payload = {}) => {
    setWorkflowStatus('running');
    setSelectedWorkflow(workflowId);

    try {
      const response = await fetch('/api/git/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, payload })
      });

      if (!response.ok) throw new Error('Workflow run failed');

      const result = await response.json();
      
      setWorkflows(prev =>
        prev.map(w => w.id === workflowId
          ? {
              ...w,
              runsCount: w.runsCount + 1,
              lastRun: { timestamp: Date.now(), status: 'completed', ...result }
            }
          : w
        )
      );

      setWorkflowStatus('completed');
      return result;
    } catch (error) {
      console.error('Trigger error:', error);
      setWorkflowStatus('failed');
      throw error;
    }
  }, []);

  /**
   * Fetch PRs from repository
   */
  const fetchPullRequests = useCallback(async (owner, repo) => {
    try {
      const response = await fetch(`/api/git/prs?owner=${owner}&repo=${repo}`);
      if (!response.ok) throw new Error('Failed to fetch PRs');

      const data = await response.json();
      setPullRequests(data);
      return data;
    } catch (error) {
      console.error('Fetch PRs error:', error);
      return [];
    }
  }, []);

  /**
   * Auto-review PR with AI
   */
  const autoReviewPR = useCallback(async (prNumber, owner, repo) => {
    try {
      const response = await fetch('/api/git/prs/auto-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prNumber, owner, repo })
      });

      if (!response.ok) throw new Error('Auto-review failed');

      const review = await response.json();
      return review;
    } catch (error) {
      console.error('Auto-review error:', error);
      return null;
    }
  }, []);

  /**
   * Generate commit message suggestions
   */
  const suggestCommitMessage = useCallback(async (changes) => {
    try {
      const response = await fetch('/api/git/commits/suggest-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes })
      });

      if (!response.ok) throw new Error('Message suggestion failed');

      const suggestions = await response.json();
      return suggestions;
    } catch (error) {
      console.error('Message suggestion error:', error);
      return [];
    }
  }, []);

  /**
   * Create GitHub Actions workflow from template
   */
  const generateGithubActions = useCallback((template) => {
    const templates = {
      'ci': {
        name: 'CI Pipeline',
        file: '.github/workflows/ci.yml',
        content: generateCIWorkflow()
      },
      'test': {
        name: 'Test Suite',
        file: '.github/workflows/test.yml',
        content: generateTestWorkflow()
      },
      'deploy': {
        name: 'Deploy',
        file: '.github/workflows/deploy.yml',
        content: generateDeployWorkflow()
      },
      'security': {
        name: 'Security Checks',
        file: '.github/workflows/security.yml',
        content: generateSecurityWorkflow()
      }
    };

    return templates[template] || null;
  }, []);

  /**
   * Generate automatic changelog
   */
  const generateChangelog = useCallback(async (owner, repo, baseVersion) => {
    try {
      const response = await fetch('/api/git/changelog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, baseVersion })
      });

      if (!response.ok) throw new Error('Changelog generation failed');

      const changelog = await response.json();
      return changelog;
    } catch (error) {
      console.error('Changelog generation error:', error);
      return null;
    }
  }, []);

  /**
   * Lint commit messages
   */
  const lintCommitMessage = useCallback((message) => {
    const issues = [];

    // Check length
    const lines = message.split('\n');
    if (lines[0].length > 72) {
      issues.push('First line should be 72 characters or less');
    }

    // Check format
    if (!lines[0].match(/^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?:/)) {
      issues.push('Use conventional commit format: type(scope): message');
    }

    // Check lowercase
    if (lines[0][0] === lines[0][0].toUpperCase() && lines[0][0] !== lines[0][0].toLowerCase()) {
      issues.push('Subject should start with lowercase after colon');
    }

    return { valid: issues.length === 0, issues };
  }, []);

  return {
    workflows,
    pullRequests,
    commits,
    branches,
    workflowStatus,
    selectedWorkflow,
    createWorkflow,
    deployWorkflow,
    triggerWorkflow,
    fetchPullRequests,
    autoReviewPR,
    suggestCommitMessage,
    generateGithubActions,
    generateChangelog,
    lintCommitMessage
  };
}

// Helper functions for GitHub Actions templates
function generateCIWorkflow() {
  return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test`;
}

function generateTestWorkflow() {
  return `name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3`;
}

function generateDeployWorkflow() {
  return `name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy
        env:
          DEPLOY_KEY: \${{ secrets.DEPLOY_KEY }}
        run: npm run deploy`;
}

function generateSecurityWorkflow() {
  return `name: Security

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'`;
}
