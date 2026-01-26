import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CreateMobileAppModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    platform: 'both',
    app_type: 'react_native'
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return await base44.entities.MobileApp.create({
        ...data,
        screens: [
          {
            id: 'home',
            name: 'Home',
            type: 'list',
            components: [],
            navigation: {}
          }
        ],
        theme: {
          primary_color: '#3b82f6',
          secondary_color: '#10b981',
          background_color: '#ffffff',
          font_family: 'System'
        },
        features: [],
        api_endpoints: [],
        status: 'draft'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mobileApps']);
      toast.success('Mobile app created!');
      onClose();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Mobile App</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>App Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Awesome App"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your app..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Platform</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ios">iOS Only</SelectItem>
                  <SelectItem value="android">Android Only</SelectItem>
                  <SelectItem value="both">iOS & Android</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Framework</Label>
              <Select value={formData.app_type} onValueChange={(v) => setFormData({ ...formData, app_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react_native">React Native</SelectItem>
                  <SelectItem value="flutter">Flutter</SelectItem>
                  <SelectItem value="pwa">Progressive Web App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create App'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}