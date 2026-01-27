import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_PERMISSIONS = [
  { value: 'can_manage_products', label: 'Manage Products' },
  { value: 'can_view_analytics', label: 'View Analytics' },
  { value: 'can_manage_orders', label: 'Manage Orders' },
  { value: 'can_manage_users', label: 'Manage Users' },
  { value: 'can_access_admin_panel', label: 'Access Admin Panel' },
  { value: 'can_edit_project', label: 'Edit Project' },
  { value: 'can_deploy_app', label: 'Deploy App' },
];

export default function PermissionManager() {
  const [userEmail, setUserEmail] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.UserPermission.list('-created_date'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const grantPermissionMutation = useMutation({
    mutationFn: async ({ userEmail, permission }) => {
      return base44.entities.UserPermission.create({
        user_email: userEmail,
        permission: permission,
        granted_by: currentUser?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setUserEmail('');
      setSelectedPermission('');
      toast.success('Permission granted');
    },
    onError: () => {
      toast.error('Failed to grant permission');
    }
  });

  const revokePermissionMutation = useMutation({
    mutationFn: (id) => base44.entities.UserPermission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission revoked');
    },
  });

  const handleGrant = () => {
    if (!userEmail || !selectedPermission) {
      toast.error('Please fill in all fields');
      return;
    }
    grantPermissionMutation.mutate({ userEmail, permission: selectedPermission });
  };

  // Group permissions by user
  const permissionsByUser = permissions.reduce((acc, perm) => {
    if (!acc[perm.user_email]) {
      acc[perm.user_email] = [];
    }
    acc[perm.user_email].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Grant Permission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedPermission} onValueChange={setSelectedPermission}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select permission" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <SelectItem key={perm.value} value={perm.value}>
                    {perm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGrant} disabled={grantPermissionMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Grant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(permissionsByUser).length === 0 ? (
            <p className="text-center text-gray-500 py-8">No permissions granted yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(permissionsByUser).map(([email, perms]) => (
                <div key={email} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">{email}</span>
                    <span className="text-sm text-gray-500">{perms.length} permissions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {perms.map(perm => (
                      <Badge key={perm.id} variant="outline" className="flex items-center gap-2">
                        {AVAILABLE_PERMISSIONS.find(p => p.value === perm.permission)?.label || perm.permission}
                        <button
                          onClick={() => revokePermissionMutation.mutate(perm.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}