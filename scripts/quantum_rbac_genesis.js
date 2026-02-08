import { QuantumCreator } from '../QuantumEngine.js';
import fs from 'fs';
import path from 'path';

// Goal: Create Advanced RBAC System (Store + Component)
const creator = new QuantumCreator();

const STORE_FILE = path.join(process.cwd(), 'src/store/usePermissionStore.ts');
const MATRIX_FILE = path.join(process.cwd(), 'src/components/rbac/PermissionMatrix.tsx');

async function evolveRBAC() {
    console.log("🛡️ AppForge Quantum Genesis: Evolving RBAC Security Layer...");

    // 1. Evolve Store (Zustand + Persistence)
    const storeTemplate = `
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Permission = 'read' | 'write' | 'delete' | 'admin' | 'execute';
export type Resource = 'users' | 'settings' | 'reports' | 'financials';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<Resource, Permission[]>;
  inherits?: string[]; // Role Inheritance
}

interface PermissionState {
  roles: Role[];
  activeRole: string | null;
  
  // Actions
  addRole: (role: Role) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  targetRole: (id: string) => void;
  
  // Logic
  hasPermission: (resource: Resource, action: Permission) => boolean;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      roles: [
        { 
            id: 'admin', 
            name: 'Administrator', 
            description: 'Full System Access', 
            permissions: { 
                users: ['read', 'write', 'delete', 'admin'],
                settings: ['read', 'write', 'delete', 'admin'],
                reports: ['read', 'write', 'delete', 'admin'],
                financials: ['read', 'write', 'delete', 'admin']
            } 
        },
        { 
            id: 'analyst', 
            name: 'Data Analyst', 
            description: 'View Reports Only', 
            permissions: { 
                users: ['read'],
                settings: ['read'],
                reports: ['read', 'write', 'execute'],
                financials: ['read']
            } 
        }
      ],
      activeRole: 'admin', // Default for simulation

      addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
      
      updateRole: (id, updates) => set((state) => ({
        roles: state.roles.map(r => r.id === id ? { ...r, ...updates } : r)
      })),

      deleteRole: (id) => set((state) => ({
        roles: state.roles.filter(r => r.id !== id)
      })),
      
      targetRole: (id) => set({ activeRole: id }),

      hasPermission: (resource, action) => {
          const { roles, activeRole } = get();
          const role = roles.find(r => r.id === activeRole);
          if (!role) return false;
          
          // Check direct permissions
          const direct = role.permissions[resource]?.includes(action);
          if (direct) return true;
          
          // Check inheritance (Simple 1-level for now, Quantum Engine optimized)
          if (role.inherits) {
              return role.inherits.some(parentId => {
                  const parent = roles.find(p => p.id === parentId);
                  return parent?.permissions[resource]?.includes(action);
              });
          }
          
          return false;
      }
    }),
    { name: 'appforge-rbac-storage' }
  )
);
`;

    // 2. Evolve Component (React Table + Shadcn)
    const componentTemplate = `
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
                                <TableRow key={\`\${resource}-\${perm}\`}>
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
`;

    // Ensure directories exist
    const storeDir = path.dirname(STORE_FILE);
    const matrixDir = path.dirname(MATRIX_FILE);
    if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });
    if (!fs.existsSync(matrixDir)) fs.mkdirSync(matrixDir, { recursive: true });

    // Write Files
    fs.writeFileSync(STORE_FILE, storeTemplate);
    fs.writeFileSync(MATRIX_FILE, componentTemplate);

    console.log(`💾 Permission Store: ${STORE_FILE}`);
    console.log(`💾 Security Matrix: ${MATRIX_FILE}`);
}

evolveRBAC().catch(console.error);
