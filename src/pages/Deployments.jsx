import React from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DeploymentsTable } from '@/components/deployment/DeploymentsTable';
import { DeploymentFilters } from '@/components/deployment/DeploymentFilters';
import { Activity, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DeploymentsPage({ projectId = 'proj_default' }) {
  const queryClient = useQueryClient();

  const { data: deployments = [], isLoading, error } = useQuery({
    queryKey: ['deployments'],
    queryFn: async () => {
      try {
        const result = await base44.entities.AgentDeployment.list('-deployed_at');
        return result || [];
      } catch (err) {
        console.error('Failed to fetch deployments:', err);
        return [];
      }
    },
    refetchInterval: 10000
  });

  const rollbackMutation = useMutation({
    mutationFn: async ({ deploymentId, previousVersion }) => {
      return base44.entities.AgentDeployment.update(deploymentId, {
        status: 'inactive',
        rollback_to: previousVersion
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      toast.success('Rollback initiated');
    },
    onError: (error) => {
      toast.error('Rollback failed: ' + error.message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (deploymentId) => {
      return base44.entities.AgentDeployment.update(deploymentId, {
        status: 'failed',
        deployment_logs: 'Deployment cancelled by user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      toast.success('Deployment cancelled');
    },
    onError: (error) => {
      toast.error('Cancel failed: ' + error.message);
    }
  });

  const getDeploymentLogs = async (deploymentId) => {
    try {
      const deps = await base44.entities.AgentDeployment.filter({ id: deploymentId });
      if (deps.length > 0) {
        const logs = deps[0].deployment_logs || 'No logs available';
        return logs.split('\n');
      }
      return ['No logs available'];
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return ['Failed to load logs'];
    }
  };

  const stats = {
    total: deployments.length,
    successful: deployments.filter(d => d.status === 'active' || d.status === 'completed').length,
    failed: deployments.filter(d => d.status === 'failed').length,
    successRate: deployments.length > 0 
      ? Math.round((deployments.filter(d => d.status === 'active' || d.status === 'completed').length / deployments.length) * 100) 
      : 0
  };

  const [filters, setFilters] = React.useState({ status: 'all', environment: 'all', branch: 'all' });
  const updateFilter = (key, value) => setFilters({ ...filters, [key]: value });
  const clearFilters = () => setFilters({ status: 'all', environment: 'all', branch: 'all' });

  const handleRollback = async (deploymentId, previousVersion) => {
    rollbackMutation.mutate({ deploymentId, previousVersion });
  };

  const handleCancel = async (deploymentId) => {
    cancelMutation.mutate(deploymentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-1">Deployment History</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage all project deployments</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
          <Activity className="w-4 h-4 mr-2" />
          New Deployment
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deployments */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Deployments</p>
                <p className="text-3xl font-bold dark:text-white">{stats.total}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Success Rate</p>
                <p className="text-3xl font-bold dark:text-white">{stats.successRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Successful */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Successful</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.successful}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Filters</CardTitle>
          <CardDescription className="dark:text-gray-400">Filter deployments by status, environment, or branch</CardDescription>
        </CardHeader>
        <CardContent>
          <DeploymentFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>

      {/* Deployments Table */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Deployments</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {deployments.length} deployment{deployments.length !== 1 ? 's' : ''} matching filters
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DeploymentsTable
            deployments={deployments}
            isLoading={isLoading}
            onRollback={handleRollback}
            onCancel={handleCancel}
            onViewLogs={getDeploymentLogs}
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-400">Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}