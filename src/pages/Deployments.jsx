import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeployments } from '@/hooks/useDeployments';
import { DeploymentsTable } from '@/components/deployment/DeploymentsTable';
import { DeploymentFilters } from '@/components/deployment/DeploymentFilters';
import { calculateDeploymentStats } from '@/lib/deploymentHistory';
import { Activity, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeploymentsPage({ projectId = 'proj_default' }) {
  const {
    deployments,
    allDeployments,
    isLoading,
    error,
    filters,
    updateFilter,
    clearFilters,
    rollback,
    cancel,
    getDeploymentLogs
  } = useDeployments(projectId);

  const stats = calculateDeploymentStats(allDeployments);

  const handleRollback = async (deploymentId, previousVersion) => {
    try {
      await rollback(deploymentId, previousVersion);
      toast.success(`Rolled back to ${previousVersion}`);
    } catch (err) {
      toast.error('Failed to rollback: ' + err.message);
    }
  };

  const handleCancel = async (deploymentId) => {
    try {
      await cancel(deploymentId);
      toast.success('Deployment cancelled');
    } catch (err) {
      toast.error('Failed to cancel: ' + err.message);
    }
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
