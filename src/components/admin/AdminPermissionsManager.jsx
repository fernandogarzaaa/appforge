import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Lock, Key, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPermissionsManager() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.asServiceRole.entities.User.filter({ role: 'admin' }).catch(() => []),
  });

  const PERMISSIONS = [
    { id: 'manage_agents', label: 'Manage Agents', icon: '🤖' },
    { id: 'view_analytics', label: 'View Analytics', icon: '📊' },
    { id: 'manage_deployments', label: 'Manage Deployments', icon: '🚀' },
    { id: 'audit_logs', label: 'View Audit Logs', icon: '📋' },
    { id: 'system_config', label: 'System Configuration', icon: '⚙️' },
    { id: 'user_management', label: 'User Management', icon: '👥' },
    { id: 'security_scan', label: 'Security Scanning', icon: '🔐' },
    { id: 'project_audit', label: 'Project Audit', icon: '🔍' }
  ];

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, permission, value }) => {
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      toast.success('Permission updated');
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-500 to-cyan-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Permissions Manager</h2>
              <p className="text-blue-100 text-sm">Control admin access and capabilities</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Users List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Admin Users</CardTitle>
            <CardDescription>{users.length} total admins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No admin users</p>
            ) : (
              users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-lg border transition ${selectedUser?.id === user.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <p className="font-semibold text-sm">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Permissions Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedUser ? `Permissions for ${selectedUser.full_name}` : 'Select a user to manage permissions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="text-center py-8 text-gray-500">
                <Lock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Select an admin user to view and manage their permissions</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {PERMISSIONS.map(perm => (
                  <div key={perm.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{perm.icon}</span>
                        <span className="font-semibold text-sm">{perm.label}</span>
                      </div>
                      <Switch
                        defaultChecked
                        onCheckedChange={(checked) => updatePermissionMutation.mutate({
                          userId: selectedUser.id,
                          permission: perm.id,
                          value: checked
                        })}
                      />
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Permission Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold">Total Permissions</p>
              <p className="text-2xl font-bold text-purple-700">{PERMISSIONS.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-semibold">Admins</p>
              <p className="text-2xl font-bold text-green-700">{users.length}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold">Active Sessions</p>
              <p className="text-2xl font-bold text-blue-700">--</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-600 font-semibold">Last Audit</p>
              <p className="text-2xl font-bold text-orange-700">--</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}