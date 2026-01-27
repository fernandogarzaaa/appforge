import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResponsePlaybookLibrary() {
  const [showPlaybook, setShowPlaybook] = useState(null);
  const { data: playbooks } = useQuery({
    queryKey: ['response-playbooks'],
    queryFn: () => base44.entities.ResponsePlaybook.list('-created_date', 50)
  });

  if (!playbooks || playbooks.length === 0) {
    return <div className="p-4 text-center text-slate-600">No playbooks available</div>;
  }

  const groupedByType = {};
  playbooks.forEach(pb => {
    if (!groupedByType[pb.anomaly_type]) groupedByType[pb.anomaly_type] = [];
    groupedByType[pb.anomaly_type].push(pb);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Response Playbooks
        </h3>
        <Badge variant="outline">{playbooks.length} available</Badge>
      </div>

      <Tabs defaultValue={Object.keys(groupedByType)[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {Object.keys(groupedByType).map(type => (
            <TabsTrigger key={type} value={type} className="text-xs">
              {type.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupedByType).map(([type, typePlaybooks]) => (
          <TabsContent key={type} value={type} className="space-y-3">
            {typePlaybooks.map(playbook => (
              <Card key={playbook.id} className={playbook.is_active ? '' : 'opacity-60'}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{playbook.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">{playbook.description}</p>
                    </div>
                    <Badge className={playbook.is_active ? 'bg-green-600' : 'bg-slate-400'}>
                      {playbook.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                    <span>{playbook.steps?.length || 0} steps</span>
                    <span>Success Rate: {playbook.success_rate || 0}%</span>
                    <span>Used {playbook.usage_count} times</span>
                  </div>

                  <div className="flex gap-2">
                    {playbook.severity_levels?.map(severity => (
                      <Badge key={severity} variant="outline" className="text-xs">
                        {severity}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => setShowPlaybook(playbook)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Playbook Details Dialog */}
      {showPlaybook && (
        <Dialog open={!!showPlaybook} onOpenChange={() => setShowPlaybook(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{showPlaybook.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <p className="text-slate-700">{showPlaybook.description}</p>

              {/* Steps */}
              {showPlaybook.steps?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Response Steps</h3>
                  {showPlaybook.steps.map((step, idx) => (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">
                            {step.step_number}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{step.title}</p>
                            <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                            <div className="flex gap-3 mt-2 text-xs text-slate-600">
                              <span>⏱ {step.estimated_time_minutes}min</span>
                              {step.automation_possible && <Badge variant="outline" className="text-xs">Auto-capable</Badge>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Escalation Path */}
              {showPlaybook.escalation_path?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Escalation Path</h3>
                  {showPlaybook.escalation_path.map((level, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <p className="text-sm"><span className="font-semibold">Level {level.level}:</span> {level.condition}</p>
                        <p className="text-xs text-slate-600 mt-1">Notify: {level.notify_teams?.join(', ')}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Success Metrics */}
              {showPlaybook.post_incident_review?.metrics_to_collect && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Success Metrics</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {showPlaybook.post_incident_review.metrics_to_collect.map((metric, idx) => (
                      <div key={idx} className="p-2 bg-slate-100 rounded text-sm">
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}