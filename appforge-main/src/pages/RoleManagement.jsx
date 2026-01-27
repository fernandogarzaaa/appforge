import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleSelector from '@/components/rbac/RoleSelector';
import { AVAILABLE_ROLES, getRolePermissions } from '../functions/permissionCheck';
import { Users, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleManagement() {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('read_only');
  const queryClient = useQueryClient();

  const { data: permissions } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: () => base44.entities.UserPermission.list('-assigned_at', 100)
  });

  const { data: roles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: () => base44.entities.UserRole.list('-created_date', 20)
  });

  const assignMutation = useMutation({
    mutationFn: (data) => base44.entities.UserPermission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('Role assigned successfully');
      setShowAssignDialog(false);
      setNewUserEmail('');
      setNewUserRole('read_only');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.UserPermission.update(id, { role_name: role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('Role updated');
    }
  });

  const removeAccessMutation = useMutation({
    mutationFn: (id) => base44.entities.UserPermission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('User access removed');
    }
  });

  const handleAssignRole = () => {
    if (!newUserEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    assignMutation.mutate({
      user_email: newUserEmail,
      role_name: newUserRole,
      assigned_at: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Role & Permission Management
          </h1>
          <p className="text-slate-600 mt-1">Control user access and permissions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Roles
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role Definitions
            </TabsTrigger>
          </TabsList>

          {/* User Roles Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowAssignDialog(true)}>Assign Role</Button>
            </div>

            <div className="space-y-2">
              {permissions?.map(perm => (
                <Card key={perm.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{perm.user_email}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Assigned: {new Date(perm.assigned_at).toLocaleDateString()}
                          {perm.assigned_by && ` by ${perm.assigned_by}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-600">{perm.role_name}</Badge>
                        <select
                          value={perm.role_name}
                          onChange={(e) => updateMutation.mutate({ id: perm.id, role: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          {AVAILABLE_ROLES.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAccessMutation.mutate(perm.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!permissions || permissions.length === 0 && (
                <div className="p-8 text-center text-slate-600">
                  <p>No users assigned yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Role Definitions Tab */}
          <TabsContent value="roles" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_ROLES.map(role => {
                const rolePerms = getRolePermissions(role.value);
                const permissionsCount = Object.values(rolePerms).filter(p => p === true).length;

                return (
                  <Card key={role.value}>
                    <CardHeader>
                      <CardTitle className="text-base">{role.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-slate-600">{role.description}</p>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{permissionsCount} permissions enabled</span>
                        </div>

                        {rolePerms.view_dashboards && (
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="font-semibold">Dashboards:</p>
                            <p>{Array.isArray(rolePerms.view_dashboards) ? rolePerms.view_dashboards.join(', ') : 'All'}</p>
                          </div>
                        )}

                        {rolePerms.max_alert_severity_can_view && (
                          <div className="p-2 bg-slate-50 rounded">
                            <p className="font-semibold">Alert Severity:</p>
                            <p>{rolePerms.max_alert_severity_can_view}</p>
                          </div>
                        )}

                        <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                          <div>
                            {rolePerms.manage_monitoring_rules && <Badge className="bg-green-600 text-xs">Rules</Badge>}
                            {rolePerms.acknowledge_alerts && <Badge className="bg-green-600 text-xs">Alerts</Badge>}
                            {rolePerms.execute_automated_actions && <Badge className="bg-green-600 text-xs">Actions</Badge>}
                          </div>
                          <div>
                            {rolePerms.view_business_impact && <Badge className="bg-blue-600 text-xs">Impact</Badge>}
                            {rolePerms.manage_users && <Badge className="bg-red-600 text-xs">Users</Badge>}
                            {rolePerms.manage_integrations && <Badge className="bg-purple-600 text-xs">Integrations</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Email Address</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Role</label>
              <RoleSelector value={newUserRole} onChange={setNewUserRole} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignRole} disabled={assignMutation.isPending}>
                Assign Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}