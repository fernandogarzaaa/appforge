import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const actionLabels = {
  created: { label: 'Created', color: 'bg-green-100 text-green-800' },
  updated: { label: 'Updated', color: 'bg-blue-100 text-blue-800' },
  deployed: { label: 'Deployed', color: 'bg-purple-100 text-purple-800' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
  resumed: { label: 'Resumed', color: 'bg-green-100 text-green-800' },
  deleted: { label: 'Deleted', color: 'bg-red-100 text-red-800' },
  node_added: { label: 'Node Added', color: 'bg-blue-100 text-blue-800' },
  node_removed: { label: 'Node Removed', color: 'bg-red-100 text-red-800' },
  node_modified: { label: 'Node Modified', color: 'bg-blue-100 text-blue-800' },
  collaborator_added: { label: 'Collaborator Added', color: 'bg-green-100 text-green-800' },
  collaborator_removed: { label: 'Collaborator Removed', color: 'bg-red-100 text-red-800' },
  workflow_tested: { label: 'Workflow Tested', color: 'bg-indigo-100 text-indigo-800' },
};

export default function ActivityLog({ botId }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['botActivities', botId],
    queryFn: () => base44.entities.BotActivityLog.filter(
      { bot_id: botId },
      '-created_date',
      50
    ),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet</p>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => {
                const actionConfig = actionLabels[activity.action] || { label: activity.action, color: 'bg-gray-100 text-gray-800' };
                return (
                  <div key={activity.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className={actionConfig.color}>{actionConfig.label}</Badge>
                        <span className="font-medium text-gray-900">{activity.performed_by}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-gray-600 text-xs mt-1">{activity.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}