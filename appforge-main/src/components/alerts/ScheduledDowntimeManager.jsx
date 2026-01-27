import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Pause } from 'lucide-react';
import { toast } from 'sonner';

export default function ScheduledDowntimeManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    downtime_type: 'maintenance',
    affected_severities: [],
    silent_mode: true
  });
  const queryClient = useQueryClient();

  const { data: downtimes } = useQuery({
    queryKey: ['scheduled-downtimes'],
    queryFn: () => base44.entities.ScheduledDowntime.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => editingId
      ? base44.entities.ScheduledDowntime.update(editingId, data)
      : base44.entities.ScheduledDowntime.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-downtimes'] });
      toast.success(editingId ? 'Updated' : 'Created');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledDowntime.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-downtimes'] });
      toast.success('Deleted');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_time: '',
      end_time: '',
      downtime_type: 'maintenance',
      affected_severities: [],
      silent_mode: true
    });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleSeverityToggle = (severity) => {
    setFormData(prev => ({
      ...prev,
      affected_severities: prev.affected_severities.includes(severity)
        ? prev.affected_severities.filter(s => s !== severity)
        : [...prev.affected_severities, severity]
    }));
  };

  const handleEdit = (downtime) => {
    setEditingId(downtime.id);
    setFormData(downtime);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Pause className="w-5 h-5" />
          Scheduled Downtime
        </h2>
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Downtime
        </Button>
      </div>

      <div className="grid gap-4">
        {downtimes?.map(downtime => {
          const start = new Date(downtime.start_time);
          const end = new Date(downtime.end_time);
          const isActive = new Date() >= start && new Date() <= end;

          return (
            <Card key={downtime.id} className={isActive ? 'border-yellow-400 bg-yellow-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{downtime.name}</CardTitle>
                      {isActive && <span className="text-xs bg-yellow-400 px-2 py-1 rounded">Active</span>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{downtime.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(downtime)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(downtime.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-600">Start:</span>
                    <p>{start.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">End:</span>
                    <p>{end.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-600">Type:</span>
                  <p className="capitalize">{downtime.downtime_type}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Scheduled Downtime</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Database Maintenance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What's happening during this downtime?"
                className="h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <Select value={formData.downtime_type} onValueChange={(v) => setFormData({...formData, downtime_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="deployment">Deployment</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <Input
                type="datetime-local"
                value={formData.start_time ? formData.start_time.substring(0, 16) : ''}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <Input
                type="datetime-local"
                value={formData.end_time ? formData.end_time.substring(0, 16) : ''}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Silence Severity Levels</label>
              <div className="space-y-2 ml-2">
                {['low', 'medium', 'high', 'critical'].map(severity => (
                  <div key={severity} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.affected_severities?.includes(severity) || false}
                      onCheckedChange={() => handleSeverityToggle(severity)}
                      id={`severity-${severity}`}
                    />
                    <label htmlFor={`severity-${severity}`} className="capitalize text-sm cursor-pointer">
                      {severity}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}