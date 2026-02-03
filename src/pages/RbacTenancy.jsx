import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RbacTenancyService } from '@/services/rbacTenancy';

export default function RbacTenancy() {
  const [roles, setRoles] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const [rolesList, orgList] = await Promise.all([
        RbacTenancyService.listRoles(),
        RbacTenancyService.listOrganizations(),
      ]);
      if (!active) return;
      setRoles(rolesList);
      setOrgs(orgList);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addRole = async () => {
    if (!roleName.trim()) return;
    const perms = permissions.split(',').map((value) => value.trim()).filter(Boolean);
    await RbacTenancyService.addRole(roleName.trim(), perms);
    setRoles(await RbacTenancyService.listRoles());
    setRoleName('');
    setPermissions('');
  };

  const addOrg = async () => {
    if (!orgName.trim()) return;
    await RbacTenancyService.addOrganization(orgName.trim());
    setOrgs(await RbacTenancyService.listOrganizations());
    setOrgName('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">RBAC & Multi-Tenancy</h1>
          <p className="text-slate-600">Enterprise-grade identity and access control.</p>
        </div>
        <Badge variant="outline">Phase 7</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Roles</CardTitle>
          <CardDescription>Define permissions beyond Admin/Editor/Viewer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="Role name" />
            <Input value={permissions} onChange={(event) => setPermissions(event.target.value)} placeholder="Permissions (comma)" />
            <Button onClick={addRole}>Add Role</Button>
          </div>
          <div className="space-y-2 text-sm">
            {roles.length === 0 ? (
              <p className="text-muted-foreground">No roles created yet.</p>
            ) : (
              roles.map((role) => (
                <div key={role.id}>
                  <span className="font-semibold">{role.name}</span>
                  {role.permissions?.length ? (
                    <span className="text-slate-500"> · {role.permissions.join(', ')}</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Manage multi-tenant org structure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={orgName} onChange={(event) => setOrgName(event.target.value)} placeholder="Organization name" />
            <Button onClick={addOrg}>Add</Button>
          </div>
          <div className="space-y-2 text-sm">
            {orgs.length === 0 ? (
              <p className="text-muted-foreground">No organizations yet.</p>
            ) : (
              orgs.map((org) => (
                <div key={org.id}>{org.name}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
