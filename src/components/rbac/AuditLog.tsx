import React, { useState } from 'react';
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

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-600" />
                    Security Audit Log
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {log.timestamp}
                                </TableCell>
                                <TableCell className="font-medium text-sm">{log.user}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{log.action}</Badge>
                                </TableCell>
                                <TableCell className="text-sm font-mono text-slate-600">{log.target}</TableCell>
                                <TableCell>
                                    <Badge className={
                                        log.status === 'SUCCESS' ? 'bg-green-600' :
                                            log.status === 'DENIED' ? 'bg-orange-500' : 'bg-red-600'
                                    }>
                                        {log.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
