import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function WebhookCreate({ open, onOpenChange }) {
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const queryClient = useQueryClient();

  const events = [
    'entity.create',
    'entity.update',
    'entity.delete',
    'project.deploy',
    'project.update',
    'api.call'
  ];

  const createMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Webhook.create({
        user_id: user.email,
        url,
        events: selectedEvents,
        secret: secret || generateSecret(),
        is_active: true,
        success_count: 0,
        failure_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created');
      setUrl('');
      setSelectedEvents([]);
      setSecret('');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const generateSecret = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreate = async () => {
    if (!url || selectedEvents.length === 0) {
      toast.error('URL and at least one event required');
      return;
    }
    if (!secret) setSecret(generateSecret());
    createMutation.mutate();
  };

  const newSecret = secret || generateSecret();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Webhook URL</label>
            <input
              type="url"
              placeholder="https://example.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Subscribe to Events</label>
            <div className="grid grid-cols-2 gap-2">
              {events.map(event => (
                <button
                  key={event}
                  onClick={() => setSelectedEvents(
                    selectedEvents.includes(event)
                      ? selectedEvents.filter(e => e !== event)
                      : [...selectedEvents, event]
                  )}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedEvents.includes(event)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium mb-1">Webhook Secret</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={newSecret}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(newSecret);
                  toast.success('Copied!');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSecret(generateSecret())}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Used to sign webhook payloads</p>
          </div>

          {/* Info Box */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                Each webhook payload is signed with your secret. Verify the signature in your endpoint for security.
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!url || selectedEvents.length === 0 || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateSecret() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}