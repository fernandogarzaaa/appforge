import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomatedActionManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const queryClient = useQueryClient();

  const { data: actions } = useQuery({
    queryKey: ['automated-actions'],
    queryFn: () => base44.entities.AutomatedAction.list('-created_date', 50)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomatedAction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-actions'] });
      toast.success('Action updated');
    }
  });

  const toggleAction = (action) => {
    updateMutation.mutate({
      id: action.id,
      data: { enabled: !action.enabled }
    });
  };

  const lowRiskActions = actions?.filter(a => a.risk_level === 'low' && a.enabled) || [];
  const mediumRiskActions = actions?.filter(a => a.risk_level === 'medium' && a.enabled) || [];
  const requiresApproval = actions?.filter(a => a.requires_approval) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Automated Actions</h3>
        <Button size="sm" onClick={() => { setEditingAction(null); setShowDialog(true); }}>
          Create Action
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Enabled</p>
            <p className="text-xl font-bold">{actions?.filter(a => a.enabled).length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Low Risk (Auto)</p>
            <p className="text-xl font-bold">{lowRiskActions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Needs Approval</p>
            <p className="text-xl font-bold">{requiresApproval.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions List */}
      <div className="space-y-2">
        {actions?.map(action => (
          <Card key={action.id} className={action.enabled ? 'border-green-200 bg-green-50' : 'opacity-60'}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{action.action_name}</h4>
                    <Badge variant={action.enabled ? 'default' : 'secondary'}>
                      {action.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={
                      action.risk_level === 'low' ? 'bg-green-600' :
                      action.risk_level === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                    }>{action.risk_level}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{action.action_type}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>Runs: {action.execution_count}</span>
                    <span>Success: {action.success_rate || 0}%</span>
                    {action.requires_approval && <span className="text-orange-600">Requires Approval</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={action.enabled ? 'default' : 'outline'}
                    onClick={() => toggleAction(action)}
                  >
                    {action.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for creating/editing */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Automated Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Action Name</label>
              <Input placeholder="e.g., Auto-scale on CPU spike" />
            </div>
            <div>
              <label className="text-sm font-semibold">Action Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scale_resource">Scale Resource</SelectItem>
                  <SelectItem value="restart_service">Restart Service</SelectItem>
                  <SelectItem value="execute_workflow">Execute Workflow</SelectItem>
                  <SelectItem value="database_cleanup">Database Cleanup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox defaultChecked={true} />
              <label className="text-sm">Requires Approval</label>
            </div>
            <Button className="w-full">Create Action</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}