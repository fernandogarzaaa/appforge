import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/dialog';
import { getStatusColor, getStatusIcon, canRollback, formatDuration, DEPLOYMENT_STATUS } from '@/lib/deploymentHistory';
import { ChevronDown, RotateCcw, X, Eye, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const DeploymentsTable = ({
  deployments,
  isLoading,
  onRollback,
  onCancel,
  onViewLogs
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [logsData, setLogsData] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [rollbackConfirm, setRollbackConfirm] = useState(null);

  const handleExpandRow = async (deployment) => {
    if (expandedId === deployment.id) {
      setExpandedId(null);
    } else {
      setExpandedId(deployment.id);
      
      // Load logs if not already loaded
      if (!logsData[deployment.id]) {
        setLoadingLogs(prev => ({ ...prev, [deployment.id]: true }));
        const logs = await onViewLogs(deployment.id);
        setLogsData(prev => ({ ...prev, [deployment.id]: logs }));
        setLoadingLogs(prev => ({ ...prev, [deployment.id]: false }));
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full"></div>
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading deployments...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deployments.length === 0) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-4xl mb-4">📭</p>
              <h3 className="text-lg font-semibold dark:text-white mb-1">No Deployments</h3>
              <p className="text-gray-500 dark:text-gray-400">Start your first deployment to see history here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-0 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {deployments.map((deployment, index) => (
          <motion.div
            key={deployment.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`border-b border-gray-200 dark:border-gray-800 last:border-b-0 ${
              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950/50'
            }`}
          >
            {/* Main Row */}
            <div
              onClick={() => handleExpandRow(deployment)}
              className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Expand Icon */}
                <button className="flex-shrink-0 text-gray-400 dark:text-gray-600">
                  {expandedId === deployment.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {/* Status Icon */}
                <span className="text-2xl flex-shrink-0">{getStatusIcon(deployment.status)}</span>

                {/* Version & Commit */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold dark:text-white">
                      {deployment.version}
                    </span>
                    <Badge variant="secondary" className="text-xs dark:bg-gray-800 dark:text-gray-300">
                      {deployment.branch}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {deployment.commit_message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Commit: {deployment.commit_hash}
                  </p>
                </div>

                {/* Environment */}
                <div className="flex-shrink-0 text-right">
                  <Badge
                    className="mb-1 capitalize"
                    variant={deployment.environment === 'production' ? 'destructive' : 'default'}
                  >
                    {deployment.environment}
                  </Badge>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <Badge className={getStatusColor(deployment.status)}>
                    {deployment.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Date & Duration */}
                <div className="flex-shrink-0 text-right min-w-fit">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(deployment.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-medium dark:text-gray-300">
                    {formatDuration(deployment.duration)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-1">
                  {canRollback(deployment) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRollbackConfirm(deployment);
                      }}
                      title="Rollback to this version"
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {deployment.status === DEPLOYMENT_STATUS.DEPLOYING ||
                   deployment.status === DEPLOYMENT_STATUS.BUILDING ||
                   deployment.status === DEPLOYMENT_STATUS.PENDING ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel(deployment.id);
                      }}
                      title="Cancel deployment"
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Expanded Row - Logs */}
            {expandedId === deployment.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4"
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold dark:text-white mb-2">Deployment Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Triggered By</p>
                        <p className="font-medium capitalize dark:text-gray-300">{deployment.triggered_by}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Started</p>
                        <p className="font-medium dark:text-gray-300">
                          {deployment.started_at ? new Date(deployment.started_at).toLocaleTimeString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Completed</p>
                        <p className="font-medium dark:text-gray-300">
                          {deployment.completed_at ? new Date(deployment.completed_at).toLocaleTimeString() : '-'}
                        </p>
                      </div>
                      {deployment.error_message && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Error</p>
                          <p className="font-medium text-red-600 dark:text-red-400">{deployment.error_message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logs */}
                  {loadingLogs[deployment.id] ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-500 dark:text-gray-400">Loading logs...</p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-semibold dark:text-white mb-2">Deployment Logs</h4>
                      <div className="bg-gray-900 dark:bg-black rounded p-3 max-h-64 overflow-y-auto">
                        <div className="space-y-1 font-mono text-xs">
                          {logsData[deployment.id]?.map((log, i) => (
                            <div
                              key={i}
                              className={`${
                                log.includes('[SUCCESS]')
                                  ? 'text-green-400'
                                  : log.includes('[ERROR]') || log.includes('[FAILED]')
                                  ? 'text-red-400'
                                  : log.includes('[WARN]')
                                  ? 'text-yellow-400'
                                  : 'text-gray-400'
                              }`}
                            >
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Rollback Confirmation Dialog */}
      {rollbackConfirm && (
        <AlertDialog open={!!rollbackConfirm} onOpenChange={() => setRollbackConfirm(null)}>
          <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">Rollback Deployment?</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                Are you sure you want to rollback to version{' '}
                <span className="font-mono font-semibold">{rollbackConfirm.version}</span>? This will restore
                the previous deployment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded p-3 text-sm text-amber-900 dark:text-amber-200">
              ⚠️ This action will replace the current deployment in {rollbackConfirm.environment.toUpperCase()}.
            </div>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onRollback(rollbackConfirm.id, rollbackConfirm.previous_version);
                  setRollbackConfirm(null);
                }}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                Rollback
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default DeploymentsTable;
