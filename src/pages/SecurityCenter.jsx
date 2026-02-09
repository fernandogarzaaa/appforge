import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, AlertTriangle, Activity, Lock, Zap, 
  Ban, CheckCircle, XCircle
} from 'lucide-react';

export default function SecurityCenter() {
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: securityEvents = [], refetch: refetchEvents } = useQuery({
    queryKey: ['securityEvents'],
    queryFn: () => base44.entities.SecurityEvent.list('-created_date', 50)
  });

  const { data: threats = [], isLoading } = useQuery({
    queryKey: ['threats'],
    queryFn: () => base44.entities.ThreatIntelligence.list('-last_seen', 20)
  });

  const { data: tenantIsolation = [], isLoading } = useQuery({
    queryKey: ['tenantIsolation'],
    queryFn: () => base44.entities.TenantIsolation.list()
  });

  const handleMitigate = async (event) => {
    try {
      await base44.entities.SecurityEvent.update(event.id, {
        status: 'mitigated',
        automated_response: {
          action_taken: 'User blocked and access revoked',
          blocked: true,
          timestamp: new Date().toISOString()
        }
      });
      refetchEvents();
    } catch (error) {
      console.error('Failed to mitigate:', error);
    }
  };

  const criticalEvents = securityEvents.filter(e => e.severity === 'critical').length;
  const highEvents = securityEvents.filter(e => e.severity === 'high').length;
  const avgRiskScore = securityEvents.length > 0 
    ? Math.round(securityEvents.reduce((sum, e) => sum + (e.risk_score || 0), 0) / securityEvents.length)
    : 0;

  const severityColors = {
    critical: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-blue-600'
  };

  const statusColors = {
    detected: 'text-red-600 bg-red-50',
    investigating: 'text-yellow-600 bg-yellow-50',
    mitigated: 'text-blue-600 bg-blue-50',
    resolved: 'text-green-600 bg-green-50',
    false_positive: 'text-gray-600 bg-gray-50'
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-700">Admin privileges required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 dark:from-slate-950 dark:to-red-950/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
            AI Security Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Multi-tenant security monitoring and threat detection</p>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-red-200 dark:border-red-800 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                <Badge className="bg-red-600 dark:bg-red-500">{criticalEvents}</Badge>
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalEvents}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Critical Threats</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 dark:border-orange-800 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <Badge className="bg-orange-600 dark:bg-orange-500">{highEvents}</Badge>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{highEvents}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">High Severity</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgRiskScore}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Avg Risk Score</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {securityEvents.filter(e => e.status === 'mitigated' || e.status === 'resolved').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Mitigated</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
            <TabsTrigger value="isolation">Tenant Isolation</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card className="dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Real-time Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="p-4 border-l-4 rounded-lg bg-white dark:bg-slate-800/50 hover:shadow-md dark:hover:shadow-slate-900/50 transition cursor-pointer"
                      style={{ borderLeftColor: event.severity === 'critical' ? '#dc2626' : event.severity === 'high' ? '#ea580c' : event.severity === 'medium' ? '#ca8a04' : '#2563eb' }}
                      onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={severityColors[event.severity]}>
                              {event.severity}
                            </Badge>
                            <Badge variant="outline" className={statusColors[event.status]}>
                              {event.status}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {event.event_type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <p><strong className="dark:text-gray-300">Tenant:</strong> {event.tenant_id}</p>
                            <p><strong className="dark:text-gray-300">User:</strong> {event.user_id}</p>
                            <p><strong className="dark:text-gray-300">Risk Score:</strong> {event.risk_score}/100</p>
                            {event.ai_analysis && (
                              <p><strong className="dark:text-gray-300">AI Analysis:</strong> {event.ai_analysis.reasoning}</p>
                            )}
                          </div>

                          {selectedEvent?.id === event.id && event.ai_analysis && (
                            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/50 rounded border border-purple-200 dark:border-purple-800">
                              <p className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">AI Recommendations:</p>
                              <ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
                                {event.ai_analysis.recommended_actions?.map((action, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {event.status === 'detected' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMitigate(event);
                              }}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Mitigate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threats" className="space-y-4">
            <Card className="dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Active Threat Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {threats.map((threat) => (
                    <div key={threat.id} className="p-4 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={severityColors[threat.severity_level]}>
                            {threat.severity_level}
                          </Badge>
                          <span className="font-semibold text-sm dark:text-gray-100">
                            {threat.threat_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <Badge variant="outline" className="dark:border-slate-600 dark:text-gray-300">
                          {threat.occurrences} occurrences
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <strong className="dark:text-gray-300">Signature:</strong> {threat.threat_signature}
                      </p>
                      
                      {threat.mitigation_strategy && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Mitigation:</p>
                          <p className="text-xs text-blue-700 dark:text-blue-400">{threat.mitigation_strategy}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="isolation" className="space-y-4">
            <Card className="dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Tenant Isolation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tenantIsolation.map((tenant) => (
                    <div key={tenant.id} className="p-4 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold dark:text-gray-100">{tenant.tenant_id}</p>
                          <Badge className={tenant.isolation_status === 'active' ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'}>
                            {tenant.isolation_status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Isolation Score</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {tenant.data_isolation_score || 100}
                          </p>
                        </div>
                      </div>

                      {tenant.access_controls && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="flex items-center gap-1 text-xs dark:text-gray-300">
                            {tenant.access_controls.network_isolation ? 
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" /> : 
                              <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                            }
                            Network Isolation
                          </div>
                          <div className="flex items-center gap-1 text-xs dark:text-gray-300">
                            {tenant.access_controls.data_encryption ? 
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" /> : 
                              <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                            }
                            Data Encryption
                          </div>
                          <div className="flex items-center gap-1 text-xs dark:text-gray-300">
                            {tenant.access_controls.api_restrictions ? 
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" /> : 
                              <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                            }
                            API Restrictions
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}