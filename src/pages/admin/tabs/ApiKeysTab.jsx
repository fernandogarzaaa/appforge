/**
 * API Keys Management Tab
 * Complete API key management with list, create, rotate, revoke
 */

import React, { useState, useEffect } from 'react';
import { Plus, Copy, RotateCw, Trash2, Eye, MoreVertical } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { apiKeysAPI } from '@/api/admin-keys-api';

export default function ApiKeysTab() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created', direction: 'desc' });
  const [filters, setFilters] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'private',
    rateLimit: 1000,
    expiresAt: 'never',
    scopes: ['read'],
  });

  // Load API keys
  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      // Mock data for demo - replace with API call
      // const response = await apiKeysAPI.listKeys();
      const mockKeys = [
        {
          id: '1',
          name: 'Production API Key',
          type: 'private',
          status: 'active',
          created: '2024-01-15',
          lastUsed: '2 hours ago',
          rateLimit: 5000,
          requests: 1_250_000,
        },
        {
          id: '2',
          name: 'Staging Key',
          type: 'public',
          status: 'active',
          created: '2024-01-10',
          lastUsed: '30 minutes ago',
          rateLimit: 1000,
          requests: 450_000,
        },
        {
          id: '3',
          name: 'Legacy Key',
          type: 'private',
          status: 'inactive',
          created: '2023-12-01',
          lastUsed: '1 month ago',
          rateLimit: 500,
          requests: 50_000,
        },
      ];
      setKeys(mockKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      // const response = await apiKeysAPI.createKey(formData);
      const newKey = {
        id: Date.now().toString(),
        ...formData,
        created: new Date().toISOString().split('T')[0],
        status: 'active',
        lastUsed: 'Just now',
      };
      setKeys([newKey, ...keys]);
      setFormData({
        name: '',
        description: '',
        type: 'private',
        rateLimit: 1000,
        expiresAt: 'never',
        scopes: ['read'],
      });
      setShowCreateModal(false);
      setShowKeyModal(true);
      setSelectedKey(newKey);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRotateKey = async () => {
    try {
      // await apiKeysAPI.rotateKey(selectedKey.id);
      setKeys(
        keys.map((k) =>
          k.id === selectedKey.id ? { ...k, status: 'pending_rotation' } : k
        )
      );
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to rotate key:', error);
    }
  };

  const handleRevokeKey = async () => {
    try {
      // await apiKeysAPI.revokeKey(selectedKey.id);
      setKeys(
        keys.map((k) =>
          k.id === selectedKey.id ? { ...k, status: 'revoked' } : k
        )
      );
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to revoke key:', error);
    }
  };

  const statusBadgeColor = {
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    inactive:
      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    revoked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    pending_rotation:
      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  };

  const columns = [
    { key: 'name', label: 'Key Name', sortable: true, filterable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created', label: 'Created', sortable: true },
    { key: 'lastUsed', label: 'Last Used', sortable: true },
    { key: 'rateLimit', label: 'Rate Limit', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            API Keys Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {keys.length} keys total
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={keys}
        loading={loading}
        sortable
        filterable
        renderRow={(row, idx, { isSelected, onSelect }) => (
          <tr
            key={idx}
            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
              {row.name}
            </td>
            <td className="px-4 py-3 text-sm">
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {row.type}
              </span>
            </td>
            <td className="px-4 py-3 text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  statusBadgeColor[row.status]
                }`}
              >
                {row.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.created}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.lastUsed}
            </td>
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
              {row.rateLimit}/min
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedKey(row);
                    setShowKeyModal(true);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(row.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedKey(row);
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
                    setSelectedKey(row);
                    setConfirmAction('revoke');
                    setShowConfirmDialog(true);
                  }}
                  className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                  title="Revoke"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New API Key
              </h3>
            </div>
            <form onSubmit={handleCreateKey} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Production API Key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option>public</option>
                  <option>private</option>
                  <option>webhook</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rate Limit (requests/min)
                </label>
                <input
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rateLimit: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

      {/* Key Details Modal */}
      {showKeyModal && selectedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedKey.name}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Type
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedKey.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusBadgeColor[selectedKey.status]
                  }`}
                >
                  {selectedKey.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Rate Limit
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedKey.rateLimit} requests/minute
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Created
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedKey.created}
                </p>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={confirmAction === 'rotate' ? 'Rotate API Key?' : 'Revoke API Key?'}
        description={
          confirmAction === 'rotate'
            ? 'A new key will be generated. The old key will remain active for 7 days.'
            : 'This key will be immediately disabled and cannot be restored.'
        }
        isDangerous={confirmAction === 'revoke'}
        confirmLabel={confirmAction === 'rotate' ? 'Rotate' : 'Revoke'}
        onConfirm={
          confirmAction === 'rotate' ? handleRotateKey : handleRevokeKey
        }
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
