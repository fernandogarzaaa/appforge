import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Rocket } from 'lucide-react';

export default function WorkflowVersionHistory({ workflowId, onRevert, onDeploy }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [workflowId]);

  const fetchVersions = async () => {
    try {
      const data = await base44.entities.WorkflowVersion.filter(
        { workflow_id: workflowId },
        '-version_number',
        50
      );
      setVersions(data || []);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (versionId) => {
    if (!window.confirm('Revert workflow to this version?')) return;

    try {
      // Fetch version
      const versionList = await base44.entities.WorkflowVersion.filter({ id: versionId });
      if (versionList.length === 0) return;

      const version = versionList[0];

      // Update workflow
      await base44.entities.AgentCollaboration.update(workflowId, {
        workflow_steps: version.workflow_snapshot.steps,
        agent_ids: version.workflow_snapshot.agent_ids
      });

      fetchVersions();
      onRevert?.();
    } catch (error) {
      console.error('Revert error:', error);
      alert('Failed to revert');
    }
  };

  const handleDeploy = async (versionId) => {
    try {
      const versionList = await base44.entities.WorkflowVersion.filter({ id: versionId });
      if (versionList.length === 0) return;

      // Mark all versions as not deployed
      const allVersions = await base44.entities.WorkflowVersion.filter({ workflow_id: workflowId });
      for (const v of allVersions) {
        if (v.is_deployed) {
          await base44.entities.WorkflowVersion.update(v.id, { is_deployed: false });
        }
      }

      // Mark this as deployed
      await base44.entities.WorkflowVersion.update(versionId, { is_deployed: true });

      fetchVersions();
      onDeploy?.();
    } catch (error) {
      console.error('Deploy error:', error);
      alert('Failed to deploy');
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading versions...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="w-4 h-4" />
          Workflow Versions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.length === 0 ? (
          <p className="text-xs text-gray-500">No versions yet</p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">v{version.version_number}</p>
                      {version.is_deployed && (
                        <Badge className="bg-green-600 text-xs">Deployed</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{version.change_message}</p>
                    <p className="text-xs text-gray-500 mt-1">By {version.created_by}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevert(version.id)}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    {!version.is_deployed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeploy(version.id)}
                      >
                        <Rocket className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {version.success_rate !== undefined && (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="p-1 bg-green-50 rounded">
                      <p className="text-gray-600">Success Rate</p>
                      <p className="font-semibold">{(version.success_rate * 100).toFixed(0)}%</p>
                    </div>
                    <div className="p-1 bg-purple-50 rounded">
                      <p className="text-gray-600">Executions</p>
                      <p className="font-semibold">{version.total_executions}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}