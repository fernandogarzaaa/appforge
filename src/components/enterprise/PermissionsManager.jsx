import React, { useState, useEffect } from 'react';
import * as perms from '@/utils/advancedPermissions';

const PERMISSION_CATEGORIES = {
  team: ['manage_team', 'view_team', 'invite_members'],
  projects: ['create_projects', 'edit_projects', 'delete_projects', 'view_projects'],
  api: ['manage_api_keys', 'view_api_keys', 'use_api'],
  billing: ['manage_billing', 'view_billing', 'change_plan'],
  analytics: ['view_analytics', 'manage_analytics'],
  webhooks: ['create_webhooks', 'manage_webhooks', 'view_webhooks'],
  settings: ['manage_team_settings', 'manage_security', 'view_audit_logs']
};

export default function PermissionsManager() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showResourceAccess, setShowResourceAccess] = useState(false);
  const [formData, setFormData] = useState({
    roleName: '',
    roleDescription: '',
    permissions: [],
    resourceId: '',
    resourceType: 'project',
    principalId: '',
    principalType: 'user',
    accessLevel: 'editor'
  });
  const [resourceAccess, setResourceAccess] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadResourceAccess(selectedRole.id);
    }
  }, [selectedRole]);

  const loadRoles = () => {
    const allRoles = perms.listRoles();
    setRoles(allRoles);
    if (allRoles.length > 0) {
      setSelectedRole(allRoles[0]);
    }
  };

  const loadResourceAccess = (roleId) => {
    // In a real app, fetch from API
    const access = perms.getResourceAccessList(roleId);
    setResourceAccess(access || []);
  };

  const handleCreateRole = (e) => {
    e.preventDefault();
    if (!formData.roleName) {
      setMessage('Role name is required');
      return;
    }

    const newRole = perms.createCustomRole(
      formData.roleName,
      formData.roleDescription,
      formData.permissions.length > 0 ? formData.permissions : ['view_team']
    );

    setRoles(prev => [...prev, newRole]);
    setMessage(`✅ Role "${formData.roleName}" created!`);
    setFormData({ ...formData, roleName: '', roleDescription: '', permissions: [] });
    setShowCreateRole(false);

    setTimeout(() => setMessage(''), 3000);
  };

  const handleGrantAccess = (e) => {
    e.preventDefault();
    if (!formData.resourceId || !formData.principalId) {
      setMessage('Resource and principal are required');
      return;
    }

    perms.grantResourceAccess(
      formData.resourceId,
      formData.resourceType,
      formData.principalId,
      formData.principalType,
      formData.accessLevel
    );

    setMessage(`✅ Access granted for ${formData.accessLevel}`);
    setFormData({
      ...formData,
      resourceId: '',
      principalId: '',
      accessLevel: 'editor'
    });
    setShowResourceAccess(false);

    setTimeout(() => setMessage(''), 3000);
  };

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const getPermissionCount = (role) => {
    return Object.values(PERMISSION_CATEGORIES).flat().filter(p => 
      role.permissions?.includes(p)
    ).length;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🔐 Permissions Manager
      </h2>

      {message && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Roles
          </h3>

          <button
            onClick={() => setShowCreateRole(!showCreateRole)}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Role
          </button>

          {showCreateRole && (
            <form onSubmit={handleCreateRole} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Role name"
                value={formData.roleName}
                onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.roleDescription}
                onChange={e => setFormData({ ...formData, roleDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="max-h-40 overflow-y-auto">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                  <div key={category} className="mb-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      {category}
                    </p>
                    {perms.map(perm => (
                      <label key={perm} className="flex items-center text-sm mb-1">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="mr-2 rounded"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{perm}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Create Role
              </button>
            </form>
          )}

          <div className="space-y-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  selectedRole?.id === role.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {role.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getPermissionCount(role)} permissions
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Role Details */}
        <div className="md:col-span-2">
          {selectedRole ? (
            <div>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                  {selectedRole.name}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedRole.description}
                </p>

                <div className="mb-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Permissions
                  </h5>
                  <div className="space-y-3">
                    {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                      <div key={category}>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {perms.map(perm => (
                            <span
                              key={perm}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                selectedRole.permissions?.includes(perm)
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                  : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowResourceAccess(!showResourceAccess)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Grant Resource Access
                </button>

                {showResourceAccess && (
                  <form onSubmit={handleGrantAccess} className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg space-y-3">
                    <input
                      type="text"
                      placeholder="Resource ID"
                      value={formData.resourceId}
                      onChange={e => setFormData({ ...formData, resourceId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    />
                    <select
                      value={formData.resourceType}
                      onChange={e => setFormData({ ...formData, resourceType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value="project">Project</option>
                      <option value="workspace">Workspace</option>
                      <option value="dataset">Dataset</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Principal ID (user/team)"
                      value={formData.principalId}
                      onChange={e => setFormData({ ...formData, principalId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    />
                    <select
                      value={formData.principalType}
                      onChange={e => setFormData({ ...formData, principalType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="team">Team</option>
                      <option value="role">Role</option>
                    </select>
                    <select
                      value={formData.accessLevel}
                      onChange={e => setFormData({ ...formData, accessLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="owner">Owner</option>
                    </select>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Grant Access
                    </button>
                  </form>
                )}
              </div>

              {resourceAccess.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Resource Access ({resourceAccess.length})
                  </h5>
                  <div className="space-y-2">
                    {resourceAccess.map((access, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {access.resourceId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {access.principalType}: {access.principalId} → {access.accessLevel}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              Select a role to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
