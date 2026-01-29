// @ts-nocheck - useMutation type inference issues in JSX
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, MessageSquare, Lock, Activity, FileText, Plus, Trash2, Eye, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { collaborationService } from '@/api/appforge';
import { useToast } from '@/components/ui/use-toast';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useCollaboration } from '@/contexts/CollaborationContext';
import CollaborativeEditor from '@/components/collaboration/CollaborativeEditor';
import PresenceIndicator from '@/components/collaboration/PresenceIndicator';
import CollaborationChat from '@/components/collaboration/CollaborationChat';
import { motion } from 'framer-motion';

export default function Collaboration() {
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [_cursor, setCursor] = useState({ x: 0, y: 0 });
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [wsUrl, setWsUrl] = useState('');
  const [showLiveEditor, setShowLiveEditor] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated } = useBackendAuth();
  const { connectToDocument, disconnect, isConnected } = useCollaboration();

  // Fetch documents from backend
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['collaboration-documents'],
    queryFn: () => collaborationService.listDocuments(),
    enabled: isAuthenticated,
    retry: 1
  });

  // Create document mutation
  const createDocMutation = useMutation({
    mutationFn: async ({ title, content }) => {
      return await collaborationService.createDocument(title, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration-documents'] });
      setNewDocTitle('');
      setNewDocContent('');
      setShowNewDocForm(false);
      toast({
        title: 'Document created',
        description: 'Your collaboration document has been created successfully.'
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create document',
        description: error.response?.data?.message || 'An error occurred'
      });
    }
  });

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: async (docId) => {
      return await collaborationService.deleteDocument(docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration-documents'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been removed.'
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete document',
        description: error.response?.data?.message || 'An error occurred'
      });
    }
  });

  // Fetch active session
  const { data: session } = useQuery({
    queryKey: ['collaboration-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await base44.functions.execute('collaborationSession', {
        action: 'getParticipants',
        sessionId
      });
      return response.data;
    },
    enabled: !!sessionId,
    refetchInterval: 2000
  });

  // Join session
  const joinSession = useMutation({
    mutationFn: async (sid) => {
      const response = await base44.functions.execute('collaborationSession', {
        action: 'join',
        sessionId: sid,
        projectId: 'demo-project',
        fileId: 'main.js'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration-session'] });
    }
  });

  // Update cursor
  const updateCursorMutation = useMutation({
    mutationFn: async ({ sessionId, position }) => {
      await base44.functions.execute('collaborationSession', {
        action: 'updateCursor',
        sessionId,
        position
      });
    }
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message }) => {
      await base44.functions.execute('collaborationSession', {
        action: 'sendMessage',
        sessionId,
        message
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['collaboration-session'] });
    }
  });

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setCursor(newPos);
      if (sessionId) {
        updateCursorMutation.mutate({ sessionId, position: newPos });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sessionId]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Real-time Collaboration</h1>
        <p className="text-muted-foreground">
          Work together with your team in real-time with shared documents, presence awareness, and team chat.
        </p>
      </div>

      {/* Backend Documents Section */}
      {isAuthenticated && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Collaboration Documents
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowNewDocForm(!showNewDocForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showNewDocForm && (
              <div className="mb-4 p-4 border rounded-lg space-y-3">
                <Input
                  placeholder="Document title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Initial content (optional)"
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createDocMutation.mutate({ title: newDocTitle, content: newDocContent })}
                    disabled={!newDocTitle || createDocMutation.isPending}
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewDocForm(false);
                      setNewDocTitle('');
                      setNewDocContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isLoadingDocs ? (
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents yet. Create one to get started!</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Created by {doc.owner?.username || 'Unknown'} • 
                        {doc.collaborators?.length || 0} collaborator(s) •
                        {doc.isPublished ? ' Published' : ' Private'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDocMutation.mutate(doc.id)}
                        disabled={deleteDocMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaboration Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
            <Button 
              onClick={() => joinSession.mutate(sessionId)}
              disabled={!sessionId}
            >
              Join Session
            </Button>
            <Button 
              variant="outline"
              onClick={() => setSessionId(crypto.randomUUID())}
            >
              New Session
            </Button>
          </div>

          {session && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Active Participants ({session.participants?.length || 0})</h3>
                <div className="flex flex-wrap gap-2">
                  {session.participants?.map((participant) => (
                    <Badge key={participant.userId} variant="secondary">
                      {participant.userId}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {participant.status}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Chat Messages</h3>
                <div className="border rounded-lg p-4 h-48 overflow-y-auto mb-2 space-y-2">
                  {session.messages?.map((msg, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{msg.userId}:</span> {msg.message}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && message) {
                        sendMessageMutation.mutate({ sessionId, message });
                      }
                    }}
                  />
                  <Button 
                    onClick={() => sendMessageMutation.mutate({ sessionId, message })}
                    disabled={!message}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Presence Awareness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See who's online and working on the project in real-time. Track participant status and activity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Cursors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View team members' cursor positions as they navigate files. Better coordination and awareness.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              File Locking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Prevent conflicts with automatic file locking. Only one person can edit a file at a time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
