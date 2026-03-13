import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const usePermissionStore = create()(persist((set, get) => ({
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
        if (!role)
            return false;
        // Check direct permissions
        const direct = role.permissions[resource]?.includes(action);
        if (direct)
            return true;
        // Check inheritance (Simple 1-level for now, Quantum Engine optimized)
        if (role.inherits) {
            return role.inherits.some(parentId => {
                const parent = roles.find(p => p.id === parentId);
                return parent?.permissions[resource]?.includes(action);
            });
        }
        return false;
    }
}), { name: 'appforge-rbac-storage' }));
