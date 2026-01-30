import React, { useState } from 'react';
import { GitBranch, Zap, Plus, Copy, Download } from 'lucide-react';
import { useGitWorkflows } from './useGitWorkflows';
import { cn } from '@/lib/utils';

/**
 * Git Workflows Manager Component
 * Create, manage, and trigger Git workflows
 */
export function GitWorkflowsManager() {
  const {
    workflows,
    workflowStatus,
    createWorkflow,
    deployWorkflow,
    triggerWorkflow,
    generateGithubActions,
    lintCommitMessage
  } = useGitWorkflows();

  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('ci');
  const [commitMessage, setCommitMessage] = useState('');
  const [messageLintResult, setMessageLintResult] = useState(null);

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;

    const template = generateGithubActions(selectedTemplate);
    if (!template) return;

    createWorkflow(newWorkflowName, {
      template: selectedTemplate,
      content: template.content
    });

    setNewWorkflowName('');
    setShowNewWorkflow(false);
  };

  const handleCopyWorkflow = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleLintMessage = () => {
    if (!commitMessage.trim()) return;
    const result = lintCommitMessage(commitMessage);
    setMessageLintResult(result);
  };

  const templates = [
    { id: 'ci', name: 'CI Pipeline', icon: '🔄' },
    { id: 'test', name: 'Test Suite', icon: '✓' },
    { id: 'deploy', name: 'Deploy', icon: '🚀' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  return (
    <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-green-600" />
          Git Workflows
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Automate your GitHub/GitLab workflows with AI assistance
        </p>
      </div>

      {/* New Workflow Form */}
      {!showNewWorkflow ? (
        <button
          onClick={() => setShowNewWorkflow(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Create New Workflow
        </button>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">New Workflow</h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Workflow name"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Template
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition",
                      selectedTemplate === template.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <p className="text-xl">{template.icon}</p>
                    <p className="text-xs font-medium mt-1 text-slate-900 dark:text-white">
                      {template.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateWorkflow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewWorkflow(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Workflows</h3>
        {workflows.length === 0 ? (
          <p className="text-sm text-slate-500">No workflows created yet</p>
        ) : (
          <div className="space-y-2">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{workflow.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {workflow.status === 'active' ? '🟢 Active' : '⚪ Draft'} •
                      {' '} {workflow.runsCount} runs
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyWorkflow(workflow.config.content)}
                      className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                      title="Copy YAML"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {workflow.status === 'draft' && (
                      <button
                        onClick={() => deployWorkflow(workflow.id)}
                        className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
                      >
                        Deploy
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Content Preview */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900">
                    View YAML
                  </summary>
                  <pre className="mt-2 p-2 bg-slate-900 dark:bg-black text-slate-100 rounded overflow-x-auto text-xs">
                    {workflow.config.content}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commit Message Linter */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
          Commit Message Linter
        </h3>
        <div className="space-y-3">
          <textarea
            placeholder="Enter commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
            rows={3}
          />
          <button
            onClick={handleLintMessage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm"
          >
            Lint Message
          </button>

          {messageLintResult && (
            <div className={cn(
              "p-3 rounded-lg",
              messageLintResult.valid
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            )}>
              <p className="font-medium mb-2">
                {messageLintResult.valid ? '✓ Message is valid' : '✗ Issues found'}
              </p>
              {messageLintResult.issues.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {messageLintResult.issues.map((issue, i) => (
                    <li key={i} className="text-red-700 dark:text-red-300">• {issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
