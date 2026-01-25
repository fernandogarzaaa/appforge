import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle2, User, Clock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AlertAcknowledgement({ alert, isOpen, onClose, onAcknowledged }) {
  const [notes, setNotes] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      const updateData = {
        acknowledged: true,
        acknowledged_by: user.email,
        acknowledged_at: new Date().toISOString(),
        notification_status: 'acknowledged',
        status: assignTo ? 'assigned' : 'acknowledged',
        resolution_notes: notes
      };

      if (assignTo) {
        updateData.assigned_to = assignTo;
        updateData.assigned_at = new Date().toISOString();
      }

      await base44.entities.AnomalyAlert.update(alert.id, updateData);
      
      return { user: user.email, assignedTo: assignTo };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(data.assignedTo 
        ? `Alert assigned to ${data.assignedTo}` 
        : 'Alert acknowledged');
      setNotes('');
      setAssignTo('');
      onAcknowledged?.();
      onClose();
    },
    onError: () => {
      toast.error('Failed to acknowledge alert');
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acknowledge Alert</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold">{alert?.anomaly_details?.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{alert?.anomaly_details?.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resolution Notes</label>
            <Textarea
              placeholder="Add notes about this alert..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Assign To (optional)
            </label>
            <Input
              placeholder="user@example.com"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              type="email"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => acknowledgeMutation.mutate()}
              disabled={acknowledgeMutation.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Acknowledge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}