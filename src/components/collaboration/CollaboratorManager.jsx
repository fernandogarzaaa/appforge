import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Trash2, Shield, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CollaboratorManager({ botId }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();

  const { data: collaborators = [] } = useQuery({
    queryKey: ['collaborators', botId],
    queryFn: () => base44.entities.BotCollaborator.filter({ bot_id: botId }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const addCollaboratorMutation = useMutation({
    mutationFn: async () => {
      if (!inviteEmail.trim()) {
        toast.error('Please enter an email address');
        return;
      }
      return base44.entities.BotCollaborator.create({
        bot_id: botId,
        user_email: inviteEmail.toLowerCase(),
        role: inviteRole,
        added_by: currentUser.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', botId] });
      setInviteEmail('');
      setInviteRole('editor');
      toast.success('Collaborator added');
    },
    onError: () => toast.error('Failed to add collaborator'),
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: (id) => base44.entities.BotCollaborator.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', botId] });
      toast.success('Collaborator removed');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.BotCollaborator.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', botId] });
      toast.success('Role updated');
    },
  });

  const isOwner = collaborators.find(c => c.created_by === currentUser?.email)?.role === 'owner' ||
                  collaborators[0]?.role === 'owner';

  const roleColor = {
    owner: 'bg-purple-100 text-purple-800',
    editor: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Collaborators
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Collaborator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Collaborator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - View only</SelectItem>
                    <SelectItem value="editor">Editor - Modify workflow</SelectItem>
                    <SelectItem value="owner">Owner - Full control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => addCollaboratorMutation.mutate()}
                disabled={inviting || addCollaboratorMutation.isPending}
                className="w-full"
              >
                Add Collaborator
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {collaborators.length === 0 ? (
            <p className="text-sm text-gray-500">No collaborators yet</p>
          ) : (
            collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{collab.user_email}</p>
                  <Badge className={roleColor[collab.role]}>{collab.role}</Badge>
                </div>
                {isOwner && collab.user_email !== currentUser?.email && (
                  <div className="flex gap-2">
                    <Select defaultValue={collab.role} onValueChange={(role) => updateRoleMutation.mutate({ id: collab.id, role })}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCollaboratorMutation.mutate(collab.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}