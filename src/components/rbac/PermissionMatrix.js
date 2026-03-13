import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { usePermissionStore } from '../../store/usePermissionStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus } from 'lucide-react';
const RESOURCES = ['users', 'settings', 'reports', 'financials'];
const PERMISSIONS = ['read', 'write', 'delete'];
export default function PermissionMatrix() {
    const { roles, updateRole } = usePermissionStore();
    const togglePermission = (roleId, resource, perm) => {
        const role = roles.find(r => r.id === roleId);
        if (!role)
            return;
        const currentPerms = role.permissions[resource] || [];
        const hasPerm = currentPerms.includes(perm);
        let newPerms;
        if (hasPerm) {
            newPerms = currentPerms.filter(p => p !== perm);
        }
        else {
            newPerms = [...currentPerms, perm];
        }
        updateRole(roleId, {
            permissions: { ...role.permissions, [resource]: newPerms }
        });
    };
    return (_jsxs(Card, { className: "w-full", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-purple-600" }), "Security Matrix (RBAC)"] }), _jsxs(Button, { size: "sm", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " New Role"] })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[150px]", children: "Resource / Action" }), roles.map(role => (_jsx(TableHead, { className: "text-center", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("span", { className: "font-bold text-slate-800", children: role.name }), _jsx("span", { className: "text-xs font-normal text-slate-500", children: role.description })] }) }, role.id)))] }) }), _jsx(TableBody, { children: RESOURCES.map(resource => (_jsxs(React.Fragment, { children: [_jsx(TableRow, { className: "bg-slate-50/50", children: _jsxs(TableCell, { colSpan: roles.length + 1, className: "font-semibold text-xs text-slate-500 uppercase tracking-wider py-2", children: [resource.toUpperCase(), " MODULE"] }) }), PERMISSIONS.map(perm => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium flex items-center gap-2", children: _jsx(Badge, { variant: "outline", className: "w-16 justify-center", children: perm }) }), roles.map(role => {
                                                    const isChecked = role.permissions[resource]?.includes(perm);
                                                    return (_jsx(TableCell, { className: "text-center p-0", children: _jsx("div", { className: "flex justify-center h-full w-full py-2 hover:bg-slate-100 transition-colors cursor-pointer", onClick: () => togglePermission(role.id, resource, perm), children: _jsx(Checkbox, { checked: isChecked }) }) }, role.id));
                                                })] }, `${resource}-${perm}`)))] }, resource))) })] }) }) })] }));
}
