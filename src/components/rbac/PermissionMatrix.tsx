
import React, { useMemo } from 'react';
import { usePermissionStore, Role, Resource, Permission } from '../../store/usePermissionStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus } from 'lucide-react';

const RESOURCES: Resource[] = ['users', 'settings', 'reports', 'financials'];
const PERMISSIONS: Permission[] = ['read', 'write', 'delete'];

export default function PermissionMatrix() {
  const { roles, updateRole } = usePermissionStore();

  const togglePermission = (roleId: string, resource: Resource, perm: Permission) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const currentPerms = role.permissions[resource] || [];
    const hasPerm = currentPerms.includes(perm);
    
    let newPerms;
    if (hasPerm) {
        newPerms = currentPerms.filter(p => p !== perm);
    } else {
        newPerms = [...currentPerms, perm];
    }
    
    updateRole(roleId, {
        permissions: { ...role.permissions, [resource]: newPerms }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Security Matrix (RBAC)
        </CardTitle>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Role</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Resource / Action</TableHead>
                        {roles.map(role => (
                            <TableHead key={role.id} className="text-center">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-slate-800">{role.name}</span>
                                    <span className="text-xs font-normal text-slate-500">{role.description}</span>
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {RESOURCES.map(resource => (
                        <React.Fragment key={resource}>
                            <TableRow className="bg-slate-50/50">
                                <TableCell colSpan={roles.length + 1} className="font-semibold text-xs text-slate-500 uppercase tracking-wider py-2">
                                    {resource.toUpperCase()} MODULE
                                </TableCell>
                            </TableRow>
                            {PERMISSIONS.map(perm => (
                                <TableRow key={`${resource}-${perm}`}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Badge variant="outline" className="w-16 justify-center">
                                            {perm}
                                        </Badge>
                                    </TableCell>
                                    {roles.map(role => {
                                        const isChecked = role.permissions[resource]?.includes(perm);
                                        return (
                                            <TableCell key={role.id} className="text-center p-0">
                                                <div className="flex justify-center h-full w-full py-2 hover:bg-slate-100 transition-colors cursor-pointer"
                                                     onClick={() => togglePermission(role.id, resource, perm)}>
                                                    <Checkbox checked={isChecked} />
                                                </div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
