import { describe, it, expect, beforeEach } from 'vitest';
import { usePermissionStore } from './usePermissionStore';
describe('Quantum RBAC Store', () => {
    beforeEach(() => {
        usePermissionStore.setState({
            roles: [
                {
                    id: 'admin',
                    name: 'Admin',
                    description: '',
                    permissions: {
                        users: ['read', 'write', 'delete'],
                        settings: ['read', 'write'],
                        reports: ['read', 'write'],
                        financials: ['read', 'write']
                    }
                },
                {
                    id: 'viewer',
                    name: 'Viewer',
                    description: '',
                    permissions: {
                        users: ['read'],
                        settings: ['read'],
                        reports: ['read'],
                        financials: ['read']
                    }
                },
                {
                    id: 'super-admin',
                    name: 'Super Admin',
                    description: 'Inherits from Admin',
                    permissions: {
                        users: ['read'],
                        settings: ['write'],
                        reports: ['read'],
                        financials: ['read']
                    },
                    inherits: ['admin'] // Quantum Inheritance
                }
            ],
            activeRole: 'viewer'
        });
    });
    it('should deny permission when missing', () => {
        const allowed = usePermissionStore.getState().hasPermission('users', 'delete');
        expect(allowed).toBe(false); // viewer only has read
    });
    it('should allow permission when present', () => {
        const allowed = usePermissionStore.getState().hasPermission('users', 'read');
        expect(allowed).toBe(true);
    });
    it('should switch roles correctly', () => {
        usePermissionStore.getState().targetRole('admin');
        const allowed = usePermissionStore.getState().hasPermission('users', 'delete');
        expect(allowed).toBe(true);
    });
    it('should handle role inheritance (Quantum Feature)', () => {
        usePermissionStore.getState().targetRole('super-admin');
        // Check direct permission
        const directInfo = usePermissionStore.getState().hasPermission('settings', 'write');
        expect(directInfo).toBe(true);
        // Check inherited permission (inherited from 'admin')
        const inheritedInfo = usePermissionStore.getState().hasPermission('users', 'delete');
        expect(inheritedInfo).toBe(true);
    });
});
