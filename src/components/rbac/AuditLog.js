import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock } from 'lucide-react';
// In a real app, this would come from the API (AuditLog entity)
// For this demo, we mock it to visualize the concept.
const MOCK_LOGS = [
    { id: 1, user: 'admin@appforge.com', action: 'ROLE_UPDATE', target: 'Analyst Role', timestamp: '2 mins ago', status: 'SUCCESS' },
    { id: 2, user: 'system', action: 'PERMISSION_CHECK', target: 'financials:write', timestamp: '5 mins ago', status: 'DENIED' },
    { id: 3, user: 'admin@appforge.com', action: 'USER_INVITE', target: 'john@doe.com', timestamp: '1 hour ago', status: 'SUCCESS' },
    { id: 4, user: 'unknown', action: 'LOGIN_ATTEMPT', target: '192.168.1.55', timestamp: '3 hours ago', status: 'BLOCKED' },
];
export default function AuditLog() {
    const [logs] = useState(MOCK_LOGS);
    return (_jsxs(Card, { className: "w-full", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "h-5 w-5 text-slate-600" }), "Security Audit Log"] }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Timestamp" }), _jsx(TableHead, { children: "User" }), _jsx(TableHead, { children: "Action" }), _jsx(TableHead, { children: "Target" }), _jsx(TableHead, { children: "Status" })] }) }), _jsx(TableBody, { children: logs.map(log => (_jsxs(TableRow, { children: [_jsxs(TableCell, { className: "text-xs text-slate-500 flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), " ", log.timestamp] }), _jsx(TableCell, { className: "font-medium text-sm", children: log.user }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", children: log.action }) }), _jsx(TableCell, { className: "text-sm font-mono text-slate-600", children: log.target }), _jsx(TableCell, { children: _jsx(Badge, { className: log.status === 'SUCCESS' ? 'bg-green-600' :
                                                log.status === 'DENIED' ? 'bg-orange-500' : 'bg-red-600', children: log.status }) })] }, log.id))) })] }) })] }));
}
