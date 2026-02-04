/**
 * Secrets Management Tab
 * Environment variables and secrets management with encryption
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  Upload,
  Download,
  RotateCw,
  Trash2,
} from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { secretsAPI } from '@/api/admin-secrets-api';

export default function SecretsTab() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentEnv, setCurrentEnv] = useState('prod');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [revealedSecrets, setRevealedSecrets] = useState(new Set());
  const [retentionDays, setRetentionDays] = useState(90);

  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
    environment: 'prod',
    encrypted: true,
    expiresAt: null,
  });

  const ENVIRONMENTS = [
    { id: 'dev', label: 'Development', color: 'emerald' },
    { id: 'staging', label: 'Staging', color: 'amber' },
    { id: 'prod', label: 'Production', color: 'red' },
  ];

  // Load secrets
  useEffect(() => {
    loadSecrets();
  }, [currentEnv]);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      // const response = await secretsAPI.listSecrets(currentEnv);
      const mockSecrets = [
        {
          id: '1',
          name: 'DB_PASSWORD',
          environment: currentEnv,
          lastUpdated: '2024-01-20',
          modifiedBy: 'admin@example.com',
          encrypted: true,
        },
        {
          id: '2',
          name: 'API_SECRET',
          environment: currentEnv,
          lastUpdated: '2024-01-18',
          modifiedBy: 'admin@example.com',
          encrypted: true,
        },
        {
          id: '3',
          name: 'JWT_SECRET',
          environment: currentEnv,
          lastUpdated: '2024-01-15',
          modifiedBy: 'admin@example.com',
          encrypted: true,
        },
      ];
      setSecrets(mockSecrets);
    } catch (error) {
      console.error('Failed to load secrets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSecret = async (e) => {
    e.preventDefault();
    try {
      // const response = await secretsAPI.createSecret(formData);
      const newSecret = {
        id: Date.now().toString(),
        ...formData,
        lastUpdated: new Date().toISOString().split('T')[0],
        modifiedBy: 'current-user@example.com',
      };
      setSecrets([newSecret, ...secrets]);
      setFormData({
        name: '',
        value: '',
        description: '',
        environment: currentEnv,
        encrypted: true,
        expiresAt: null,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create secret:', error);
    }
  };

  const handleDeleteSecret = async () => {
    try {
      // await secretsAPI.deleteSecret(selectedSecret.id);
      setSecrets(secrets.filter((s) => s.id !== selectedSecret.id));
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to delete secret:', error);
    }
  };

  const handleRotateAll = async () => {
    try {
      // await secretsAPI.rotateAll(currentEnv);
      setSecrets(
        secrets.map((s) => ({
          ...s,
          lastUpdated: new Date().toISOString().split('T')[0],
        }))
      );
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to rotate all secrets:', error);
    }
  };

  const toggleReveal = (secretId) => {
    const newRevealed = new Set(revealedSecrets);
    if (newRevealed.has(secretId)) {
      newRevealed.delete(secretId);
    } else {
      newRevealed.add(secretId);
    }
    setRevealedSecrets(newRevealed);
  };

  const columns = [
    { key: 'name', label: 'Secret Name', sortable: true, filterable: true },
    { key: 'lastUpdated', label: 'Last Updated', sortable: true },
    { key: 'modifiedBy', label: 'Modified By', sortable: true },
    { key: 'encrypted', label: 'Encryption', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Secrets Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {secrets.length} secrets in {currentEnv}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Secret
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Environment Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {ENVIRONMENTS.map((env) => (
          <button
            key={env.id}
            onClick={() => setCurrentEnv(env.id)}
            className={`
              px-4 py-2 font-medium border-b-2 transition-colors
              ${currentEnv === env.id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }
            `}
          >
            {env.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={secrets}
        loading={loading}
        renderRow={(row, idx) => (
          <tr
            key={idx}
            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
              {row.name}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.lastUpdated}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.modifiedBy}
            </td>
            <td className="px-4 py-3 text-sm">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                {row.encrypted ? 'Encrypted' : 'Plaintext'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleReveal(row.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title={revealedSecrets.has(row.id) ? 'Hide' : 'Show'}
                >
                  {revealedSecrets.has(row.id) ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedSecret(row);
                    setConfirmAction('rotate');
                    setShowConfirmDialog(true);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedSecret(row);
                    setConfirmAction('delete');
                    setShowConfirmDialog(true);
                  }}
                  className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Audit Trail */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Changes
        </h3>
        <div className="space-y-3">
          {[
            {
              timestamp: '2024-01-20 14:30',
              changedBy: 'admin@example.com',
              name: 'DB_PASSWORD',
              action: 'Updated',
              env: currentEnv,
            },
            {
              timestamp: '2024-01-19 10:15',
              changedBy: 'admin@example.com',
              name: 'API_SECRET',
              action: 'Created',
              env: currentEnv,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                  <span>{item.timestamp}</span>
                  <span>•</span>
                  <span>{item.changedBy}</span>
                  <span>•</span>
                  <span>{item.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Policy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Retention Policy
        </h3>
        <div className="space-y-2">
          {[
            { value: 30, label: '30 days' },
            { value: 90, label: '90 days' },
            { value: 180, label: '180 days' },
            { value: 365, label: '1 year' },
            { value: -1, label: 'Forever' },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="retention"
                value={option.value}
                checked={retentionDays === option.value}
                onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Create Secret Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Secret
              </h3>
            </div>
            <form onSubmit={handleCreateSecret} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., DB_PASSWORD"
                  pattern="[A-Z0-9_]+"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Alphanumeric and underscores only
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret Value
                </label>
                <input
                  type="password"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What is this secret used for?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={
          confirmAction === 'delete'
            ? 'Delete Secret?'
            : 'Rotate All Secrets?'
        }
        description={
          confirmAction === 'delete'
            ? 'This secret will be permanently deleted.'
            : 'New values will be generated for all secrets in this environment.'
        }
        isDangerous={confirmAction === 'delete'}
        confirmLabel={confirmAction === 'delete' ? 'Delete' : 'Rotate'}
        onConfirm={
          confirmAction === 'delete' ? handleDeleteSecret : handleRotateAll
        }
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
