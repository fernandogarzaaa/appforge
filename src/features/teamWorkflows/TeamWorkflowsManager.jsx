import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings,
  Slack,
  GitBranch,
  MessageSquare,
  Users
} from 'lucide-react';
import { useTeamWorkflows } from './useTeamWorkflows';
import { cn } from '@/lib/utils';

/**
 * Team Workflows Manager Component
 * Manage automations, webhooks, and team integrations
 */
export function TeamWorkflowsManager() {
  const {
    workflows,
    automations,
    webhooks,
    integratedServices,
    createWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    createStandupAutomation,
    createPRNotificationAutomation,
    deleteAutomation,
    toggleAutomation,
    deleteWebhook,
    connectService,
    disconnectService,
    getServiceHealth
  } = useTeamWorkflows();

  const [activeTab, setActiveTab] = useState('workflows');
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewAutomation, setShowNewAutomation] = useState(false);
  const [newWorkflowType, setNewWorkflowType] = useState('');
  const [newAutomationType, setNewAutomationType] = useState('');

  const handleCreateWorkflow = (type) => {
    const workflow = createWorkflow({
      name: `${type} Workflow`,
      type: type,
      description: `Auto-generated ${type} workflow`,
      steps: [],
      triggers: [],
      conditions: []
    });
    setShowNewWorkflow(false);
    setNewWorkflowType('');
  };

  const handleCreateStandup = () => {
    createStandupAutomation({
      name: 'Daily Standup',
      description: 'Daily team standup',
      time: '09:00',
      schedule: 'daily'
    });
    setShowNewAutomation(false);
    setNewAutomationType('');
  };

  const handleCreatePRNotif = () => {
    createPRNotificationAutomation({
      name: 'PR Notifications',
      description: 'Notify team on PR events',
      channels: ['slack']
    });
    setShowNewAutomation(false);
    setNewAutomationType('');
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Team Workflows & Automation
        </h2>
        <p className="text-indigo-100 mt-2">
          Manage team automations, webhooks, and integrations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {['workflows', 'automations', 'webhooks', 'integrations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 font-medium text-sm transition capitalize",
              activeTab === tab
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Active Workflows ({workflows.length})
              </h3>
              <button
                onClick={() => setShowNewWorkflow(!showNewWorkflow)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Workflow
              </button>
            </div>

            {showNewWorkflow && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white">Create New Workflow</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['git', 'code-review', 'testing', 'deployment'].map(type => (
                    <button
                      key={type}
                      onClick={() => handleCreateWorkflow(type)}
                      className="p-3 border-2 border-slate-300 dark:border-slate-600 rounded hover:border-indigo-500 transition text-slate-700 dark:text-slate-300 text-sm font-medium capitalize"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {workflows.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No workflows yet. Create one to automate your team's processes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {workflow.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {workflow.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>Executions: {workflow.executions}</span>
                          <span>Success: {workflow.successCount}</span>
                          <span>Type: {workflow.type}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleWorkflow(workflow.id)}
                          className={cn(
                            "px-3 py-1 rounded text-sm font-medium transition",
                            workflow.enabled
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {workflow.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => deleteWorkflow(workflow.id)}
                          className="px-3 py-1 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Automations Tab */}
        {activeTab === 'automations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Team Automations ({automations.length})
              </h3>
              <button
                onClick={() => setShowNewAutomation(!showNewAutomation)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Automation
              </button>
            </div>

            {showNewAutomation && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white">Create Automation</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCreateStandup}
                    className="p-3 border-2 border-slate-300 dark:border-slate-600 rounded hover:border-indigo-500 transition text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Daily Standup
                  </button>
                  <button
                    onClick={handleCreatePRNotif}
                    className="p-3 border-2 border-slate-300 dark:border-slate-600 rounded hover:border-indigo-500 transition text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-2"
                  >
                    <GitBranch className="w-4 h-4" />
                    PR Notifications
                  </button>
                </div>
              </div>
            )}

            {automations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No automations configured. Set up team automations to save time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map(automation => (
                  <div
                    key={automation.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {automation.type === 'standup' && <MessageSquare className="w-4 h-4" />}
                          {automation.type === 'pr-notification' && <GitBranch className="w-4 h-4" />}
                          {automation.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {automation.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>Type: {automation.type}</span>
                          {automation.time && <span>Time: {automation.time}</span>}
                          {automation.schedule && <span>Schedule: {automation.schedule}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAutomation(automation.id)}
                          className={cn(
                            "px-3 py-1 rounded text-sm font-medium transition",
                            automation.enabled
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {automation.enabled ? 'On' : 'Off'}
                        </button>
                        <button
                          onClick={() => deleteAutomation(automation.id)}
                          className="px-3 py-1 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Webhooks ({webhooks.length})
            </h3>

            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No webhooks configured. Add webhooks to receive real-time events.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map(webhook => (
                  <div
                    key={webhook.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {webhook.verified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          {webhook.provider}
                        </h4>
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-2 block overflow-x-auto text-slate-600 dark:text-slate-400">
                          {webhook.url}
                        </code>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>Events: {webhook.eventCount}</span>
                          {webhook.lastEvent && <span>Last: {new Date(webhook.lastEvent).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="px-3 py-1 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Connected Services
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['slack', 'github', 'jira', 'teams'].map(service => {
                const isConnected = Object.keys(integratedServices).includes(service);
                const health = getServiceHealth(service);

                return (
                  <div
                    key={service}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                          {service === 'slack' && <Slack className="w-4 h-4" />}
                          {service === 'github' && <GitBranch className="w-4 h-4" />}
                          {service}
                        </h4>
                        <div className="mt-2">
                          {isConnected ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400">
                                Connected ({health})
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">Not connected</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          isConnected
                            ? disconnectService(service)
                            : connectService(service, { workspace: 'default' })
                        }
                        className={cn(
                          "px-3 py-1 rounded text-sm font-medium transition",
                          isConnected
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200'
                        )}
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
