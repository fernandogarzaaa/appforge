import React, { useState, useEffect } from 'react';
import { Activity, Users, Settings, AlertCircle, BarChart3, FileJson, Trash2, Plus } from 'lucide-react';
import { useAdminDashboard } from './useAdminDashboard';

/**
 * AdminDashboard Component
 * Displays system administration controls including feature toggles, user management, system health, and admin logs
 * Features: System health monitoring, Feature toggle management, User management interface, Admin activity logs
 */
export const AdminDashboard = () => {
  const {
    featureToggles,
    toggleFeature,
    systemHealth,
    checkSystemHealth,
    adminSettings,
    updateSettings,
    adminLogs,
    addLog,
    users,
    addUser,
    updateUserRole,
    deactivateUser,
    permissions,
    setUserPermissions,
    generateSystemReport,
    exportSystemReport,
  } = useAdminDashboard();

  const [activeTab, setActiveTab] = useState('health');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'viewer' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [logFilter, setLogFilter] = useState('all');

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const handleAddUser = () => {
    if (newUserForm.name && newUserForm.email) {
      addUser(newUserForm);
      setNewUserForm({ name: '', email: '', role: 'viewer' });
      setShowAddUser(false);
      addLog('user_added', `Added user: ${newUserForm.email}`);
    }
  };

  const handleToggleFeature = (featureName) => {
    toggleFeature(featureName, !featureToggles[featureName]?.enabled);
    addLog('feature_toggled', `${featureName}: ${!featureToggles[featureName]?.enabled ? 'enabled' : 'disabled'}`);
  };

  const handleExport = () => {
    exportSystemReport();
    addLog('report_exported', 'System report exported');
  };

  const getHealthStatus = (metric) => {
    if (metric > 80) return { color: 'bg-green-500', label: 'Healthy' };
    if (metric > 50) return { color: 'bg-yellow-500', label: 'Warning' };
    return { color: 'bg-red-500', label: 'Critical' };
  };

  const filteredLogs = logFilter === 'all' 
    ? adminLogs 
    : adminLogs.filter(log => log.type === logFilter);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <FileJson className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {['health', 'features', 'users', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* System Health Tab */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Uptime */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">Uptime</span>
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getHealthStatus(systemHealth.uptime || 0).color}`}>
                  {getHealthStatus(systemHealth.uptime || 0).label}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getHealthStatus(systemHealth.uptime || 0).color}`}
                  style={{ width: `${(systemHealth.uptime || 0) * 100}%` }}
                />
              </div>
              <p className="text-slate-400 text-sm mt-2">{(systemHealth.uptime || 0).toFixed(1)}%</p>
            </div>

            {/* Response Time */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">Response Time</span>
                <span className="text-slate-400 text-sm">{systemHealth.responseTime || 0}ms</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getHealthStatus(Math.max(0, 100 - (systemHealth.responseTime || 0) / 10)).color}`}
                  style={{ width: `${Math.max(0, 100 - (systemHealth.responseTime || 0) / 10)}%` }}
                />
              </div>
              <p className="text-slate-400 text-xs mt-2">Lower is better (target &lt;100ms)</p>
            </div>

            {/* CPU Usage */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">CPU Usage</span>
                <span className="text-slate-400 text-sm">{systemHealth.cpu || 0}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getHealthStatus(100 - (systemHealth.cpu || 0)).color}`}
                  style={{ width: `${systemHealth.cpu || 0}%` }}
                />
              </div>
              <p className="text-slate-400 text-xs mt-2">Optimal: &lt;70%</p>
            </div>

            {/* Memory Usage */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">Memory Usage</span>
                <span className="text-slate-400 text-sm">{systemHealth.memory || 0}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getHealthStatus(100 - (systemHealth.memory || 0)).color}`}
                  style={{ width: `${systemHealth.memory || 0}%` }}
                />
              </div>
              <p className="text-slate-400 text-xs mt-2">Optimal: &lt;80%</p>
            </div>
          </div>
        </div>
      )}

      {/* Features Toggle Tab */}
      {activeTab === 'features' && (
        <div className="space-y-3">
          {Object.entries(featureToggles).map(([name, feature]) => (
            <div key={name} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
              <div>
                <h3 className="text-white font-medium capitalize">{name.replace(/_/g, ' ')}</h3>
                <p className="text-slate-400 text-sm">{feature.lastToggled ? `Last toggled: ${new Date(feature.lastToggled).toLocaleTimeString()}` : 'Never toggled'}</p>
              </div>
              <button
                onClick={() => handleToggleFeature(name)}
                className={`w-12 h-6 rounded-full transition ${
                  feature.enabled
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-slate-600 hover:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition transform ${
                    feature.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>

          {showAddUser && (
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="User Name"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-blue-500 outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-blue-500 outline-none"
              />
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-blue-500 outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleAddUser}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Add User
              </button>
            </div>
          )}

          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{user.name}</h3>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                    <p className="text-slate-500 text-xs mt-1">Role: <span className="text-blue-400 capitalize">{user.role}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        updateUserRole(user.id, e.target.value);
                        addLog('role_changed', `User ${user.email} role changed to ${e.target.value}`);
                      }}
                      className="px-3 py-1 bg-slate-700 border border-slate-600 text-white text-sm rounded capitalize"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => {
                        deactivateUser(user.id);
                        addLog('user_deactivated', `User ${user.email} deactivated`);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg"
          >
            <option value="all">All Events</option>
            <option value="user_added">User Added</option>
            <option value="role_changed">Role Changed</option>
            <option value="feature_toggled">Feature Toggled</option>
            <option value="report_exported">Report Exported</option>
          </select>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.slice(-50).reverse().map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-slate-800 rounded-lg p-3">
                <Activity className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white text-sm">{log.message}</p>
                  <p className="text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
