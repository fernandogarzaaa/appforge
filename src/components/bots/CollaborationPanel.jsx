import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, UserPlus, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CollaborationPanel({ botId }) {
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [addingCollaborator, setAddingCollaborator] = useState(false);

  const queryClient = useQueryClient();

  const { data: collaborators } = useQuery({
    queryKey: ['collaborators', botId],
    queryFn: () => base44.entities.BotCollaborator.filter({ bot_id: botId }),
    initialData: []
  });

  const { data: activityLogs } = useQuery({
    queryKey: ['activityLogs', botId],
    queryFn: () => base44.entities.BotActivityLog.filter({ bot_id: botId }, '-timestamp', 50),
    initialData: []
  });

  const addCollaboratorMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.BotCollaborator.create({
        bot_id: botId,
        user_email: newEmail,
        role: newRole,
        added_by: user.email
      });

      // Log activity
      await base44.entities.BotActivityLog.create({
        bot_id: botId,
        user_email: user.email,
        action_type: 'collaborated',
        action_description: `Added ${newEmail} as ${newRole}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', botId] });
      queryClient.invalidateQueries({ queryKey: ['activityLogs', botId] });
      setNewEmail('');
      setNewRole('viewer');
      toast.success('Collaborator added');
    },
    onError: () => toast.error('Failed to add collaborator')
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorId) => {
      const user = await base44.auth.me();
      const collaborator = collaborators.find(c => c.id === collaboratorId);
      
      await base44.entities.BotCollaborator.delete(collaboratorId);

      // Log activity
      await base44.entities.BotActivityLog.create({
        bot_id: botId,
        user_email: user.email,
        action_type: 'collaborated',
        action_description: `Removed ${collaborator.user_email} from bot`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', botId] });
      queryClient.invalidateQueries({ queryKey: ['activityLogs', botId] });
      toast.success('Collaborator removed');
    }
  });

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAddingCollaborator(true);
    await addCollaboratorMutation.mutateAsync();
    setAddingCollaborator(false);
  };

  const roleColors = {
    owner: 'bg-red-100 text-red-800',
    editor: 'bg-blue-100 text-blue-800',
    reviewer: 'bg-yellow-100 text-yellow-800',
    viewer: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="collaborators" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collaborators">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="space-y-4">
            <form onSubmit={handleAddCollaborator} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="text-sm"
                />
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-32 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  disabled={addingCollaborator || !newEmail.trim()}
                  size="sm"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collaborators.length === 0 ? (
                <p className="text-xs text-gray-500">No collaborators yet</p>
              ) : (
                collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">{collab.user_email}</p>
                      <Badge className={`text-xs mt-1 ${roleColors[collab.role] || roleColors.viewer}`}>
                        {collab.role}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCollaboratorMutation.mutate(collab.id)}
                      className="h-6 w-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-2 max-h-96 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-gray-500">No activity yet</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-2 bg-gray-50 rounded border-l-2 border-l-indigo-300">
                  <p className="text-xs font-semibold text-gray-900">{log.user_email}</p>
                  <p className="text-xs text-gray-600 mt-1">{log.action_description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.created_date).toLocaleDateString()} {new Date(log.created_date).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}