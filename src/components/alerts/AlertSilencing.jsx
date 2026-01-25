import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Volume2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SILENCE_DURATIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: '24 hours', minutes: 1440 },
  { label: 'Custom', minutes: 0 }
];

export default function AlertSilencing({ alert, isOpen, onClose, onSilenced }) {
  const [silenceDuration, setSilenceDuration] = useState('30');
  const [customMinutes, setCustomMinutes] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const silenceMutation = useMutation({
    mutationFn: async () => {
      const minutes = silenceDuration === '0' ? parseInt(customMinutes) : parseInt(silenceDuration);
      if (!minutes || minutes < 1) {
        throw new Error('Invalid duration');
      }

      const silencedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      await base44.entities.AnomalyAlert.update(alert.id, {
        silenced: true,
        silenced_until: silencedUntil,
        silenced_reason: reason || 'Manually silenced'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert silenced');
      setSilenceDuration('30');
      setCustomMinutes('');
      setReason('');
      onSilenced?.();
      onClose();
    },
    onError: () => {
      toast.error('Failed to silence alert');
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Silence Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <Select value={silenceDuration} onValueChange={setSilenceDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SILENCE_DURATIONS.map(d => (
                  <SelectItem key={d.minutes} value={d.minutes.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {silenceDuration === '0' && (
            <div>
              <label className="block text-sm font-medium mb-2">Minutes</label>
              <Input
                type="number"
                placeholder="Enter duration in minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                min="1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Reason (optional)</label>
            <Textarea
              placeholder="Why are you silencing this alert?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-20"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => silenceMutation.mutate()}
              disabled={silenceMutation.isPending || !silenceDuration}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Silence
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}