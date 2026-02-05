import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Users, Server, AlertCircle } from 'lucide-react';

export default function DeploymentMonitor() {
  const [user, setUser] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData?.role === 'admin') {
        const allDeployments = await base44.asServiceRole.entities.AgentDeployment.list('-created_date');
        setDeployments(allDeployments);
      }
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (user?.role !== 'admin') {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-semibold">Admin Access Required</p>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: deployments.length,
    configured: deployments.filter(d => d.status === 'configured').length,
    active: deployments.filter(d => d.status === 'active').length,
    failed: deployments.filter(d => d.status === 'failed').length
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Deployments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.configured}</div>
            <div className="text-xs text-gray-600">Configured</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deployments.map(deployment => (
              <div key={deployment.id} className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm">{deployment.deployment_description.slice(0, 60)}...</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="w-3 h-3" />
                    {deployment.user_id}
                    <Server className="w-3 h-3 ml-2" />
                    {deployment.config?.infrastructure?.provider || 'N/A'}
                  </div>
                </div>
                <Badge variant={deployment.status === 'active' ? 'default' : 'outline'}>
                  {deployment.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}