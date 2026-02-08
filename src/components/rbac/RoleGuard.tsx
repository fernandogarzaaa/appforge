import React from 'react';
import { usePermissionStore, Resource, Permission } from '../../store/usePermissionStore';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
    children: React.ReactNode;
    resource: Resource;
    action: Permission;
    fallback?: React.ReactNode;
}

export default function RoleGuard({ children, resource, action, fallback }: RoleGuardProps) {
    const { hasPermission, activeRole } = usePermissionStore();
    const allowed = hasPermission(resource, action);

    if (allowed) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    // Default Fallback: Access Denied UI
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg text-center">
            <ShieldAlert className="w-12 h-12 text-red-600 mb-4" />
            <h3 className="text-lg font-bold text-red-800">Access Denied</h3>
            <p className="text-sm text-red-600 mb-4">
                Your role (<strong>{activeRole || 'Guest'}</strong>) lacks the required permission:
                <br />
                <code className="bg-red-100 px-2 py-1 rounded text-red-700 mt-2 inline-block">
                    {resource}:{action}
                </code>
            </p>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Contact Administrator
            </Button>
        </div>
    );
}
