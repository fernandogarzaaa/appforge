import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Rocket } from 'lucide-react';

export default function AgentVersionHistory({ agentId, onRevert, onDeploy }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);

  useEffect(() => {
    fetchVersions();
  }, [agentId]);

  const fetchVersions = async () => {
    try {
      const data = await base44.entities.AgentVersion.filter(
        { agent_id: agentId },
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
    if (!window.confirm('Revert to this version? Current state will be saved.')) return;

    try {
      const response = await base44.functions.invoke('revertAgentVersion', {
        agentId,
        versionId
      });
      
      if (response.data?.success) {
        fetchVersions();
        onRevert?.();
      }
    } catch (error) {
      console.error('Revert error:', error);
      alert('Failed to revert');
    }
  };

  const handleDeploy = async (versionId) => {
    try {
      const response = await base44.functions.invoke('deployAgentVersion', {
        agentId,
        versionId
      });
      
      if (response.data?.success) {
        fetchVersions();
        onDeploy?.();
      }
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
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Version History
          </span>
          <Button
            size="sm"
            variant={compareMode ? 'default' : 'outline'}
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedVersions([]);
            }}
          >
            Compare
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.length === 0 ? (
          <p className="text-xs text-gray-500">No versions yet</p>
        ) : (
          <div className="space-y-2">
            {versions.map((version, idx) => (
              <div
                key={version.id}
                className={`p-3 border rounded-lg transition-all ${
                  compareMode && selectedVersions.includes(version.id)
                    ? 'ring-2 ring-purple-500 bg-purple-50'
                    : 'hover:bg-gray-50'
                } cursor-pointer`}
                onClick={() => {
                  if (compareMode) {
                    setSelectedVersions(prev =>
                      prev.includes(version.id)
                        ? prev.filter(id => id !== version.id)
                        : [...prev, version.id].slice(-2)
                    );
                  }
                }}
              >
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
                  {!compareMode && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevert(version.id);
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                      {!version.is_deployed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeploy(version.id);
                          }}
                        >
                          <Rocket className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {version.performance_metrics && (
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="p-1 bg-blue-50 rounded">
                      <p className="text-gray-600">Accuracy</p>
                      <p className="font-semibold">{((version.performance_metrics.accuracy || 0) * 100).toFixed(0)}%</p>
                    </div>
                    <div className="p-1 bg-green-50 rounded">
                      <p className="text-gray-600">Satisfaction</p>
                      <p className="font-semibold">{((version.performance_metrics.satisfaction || 0) * 100).toFixed(0)}%</p>
                    </div>
                    <div className="p-1 bg-purple-50 rounded">
                      <p className="text-gray-600">Executions</p>
                      <p className="font-semibold">{version.performance_metrics.executions || 0}</p>
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