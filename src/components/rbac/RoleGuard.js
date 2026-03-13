import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePermissionStore } from '../../store/usePermissionStore';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function RoleGuard({ children, resource, action, fallback }) {
    const { hasPermission, activeRole } = usePermissionStore();
    const allowed = hasPermission(resource, action);
    if (allowed) {
        return _jsx(_Fragment, { children: children });
    }
    if (fallback) {
        return _jsx(_Fragment, { children: fallback });
    }
    // Default Fallback: Access Denied UI
    return (_jsxs("div", { className: "flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg text-center", children: [_jsx(ShieldAlert, { className: "w-12 h-12 text-red-600 mb-4" }), _jsx("h3", { className: "text-lg font-bold text-red-800", children: "Access Denied" }), _jsxs("p", { className: "text-sm text-red-600 mb-4", children: ["Your role (", _jsx("strong", { children: activeRole || 'Guest' }), ") lacks the required permission:", _jsx("br", {}), _jsxs("code", { className: "bg-red-100 px-2 py-1 rounded text-red-700 mt-2 inline-block", children: [resource, ":", action] })] }), _jsx(Button, { variant: "outline", className: "border-red-300 text-red-700 hover:bg-red-100", children: "Contact Administrator" })] }));
}
