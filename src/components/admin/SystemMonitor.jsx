import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Activity, Zap } from 'lucide-react';

export default function SystemMonitor() {
  const [stats, setStats] = useState({
    errorLogs: 0,
    criticalErrors: 0,
    auditLogs: 0,
    notifications: 0
  });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') return;

      const [errors, audit, notifs] = await Promise.all([
        base44.asServiceRole.entities.ErrorLog.filter({ resolved: false }).catch(() => []),
        base44.asServiceRole.entities.AuditLog.list('-timestamp', 10).catch(() => []),
        base44.asServiceRole.entities.Notification.filter({ is_read: false }).catch(() => [])
      ]);

      setStats({
        errorLogs: errors.length,
        criticalErrors: errors.filter(e => e.severity === 'critical').length,
        auditLogs: audit.length,
        notifications: notifs.length
      });
    } catch (error) {
      console.error('Stats load error:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Error Logs</p>
              <p className="text-2xl font-bold">{stats.errorLogs}</p>
            </div>
            {stats.criticalErrors > 0 ? (
              <AlertCircle className="w-8 h-8 text-red-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
          {stats.criticalErrors > 0 && (
            <Badge variant="destructive" className="mt-2">{stats.criticalErrors} Critical</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Audit Logs</p>
              <p className="text-2xl font-bold">{stats.auditLogs}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold">{stats.notifications}</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
         <CardContent className="pt-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm text-gray-600">System Status</p>
               <p className="text-2xl font-bold">{stats.criticalErrors > 0 ? 'Degraded' : 'Operational'}</p>
             </div>
             {stats.criticalErrors > 0 ? (
               <AlertCircle className="w-8 h-8 text-red-600" />
             ) : (
               <CheckCircle className="w-8 h-8 text-green-600" />
             )}
           </div>
         </CardContent>
       </Card>
    </div>
  );
}