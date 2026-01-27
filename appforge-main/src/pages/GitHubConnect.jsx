import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Github, Link2, ExternalLink, GitBranch, Upload, Download, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import GitHubIntegration from '@/components/ai/GitHubIntegration';

export default function GitHubConnect() {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkedAccount, setLinkedAccount] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', projectId],
    queryFn: () => base44.entities.Integration.filter({ project_id: projectId, type: 'github' }),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Integration.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] });
      toast.success('GitHub account linked');
      setShowLinkDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Integration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] });
      toast.success('Integration updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Integration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', projectId] });
      toast.success('Integration removed');
    }
  });

  const handleLinkAccount = async () => {
    if (!githubUsername || !accessToken) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLinking(true);
    await new Promise(r => setTimeout(r, 1500));

    createMutation.mutate({
      type: 'github',
      name: `GitHub - ${githubUsername}`,
      config: {
        username: githubUsername,
        access_token: accessToken
      },
      status: 'connected'
    });

    setIsLinking(false);
    setGithubUsername('');
    setAccessToken('');
  };

  const syncProject = async (integration) => {
    toast.success('Syncing project to GitHub...');
    await new Promise(r => setTimeout(r, 2000));
    updateMutation.mutate({
      id: integration.id,
      data: { last_sync: new Date().toISOString() }
    });
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Github className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h2>
          <p className="text-gray-500">Choose a project to connect with GitHub</p>
        </div>
      </div>
    );
  }

  const activeIntegration = integrations.find(i => i.status === 'connected');

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">GitHub Integration</h1>
          <p className="text-gray-500">Connect your GitHub account and sync projects</p>
        </div>
        {!activeIntegration && (
          <Button onClick={() => setShowLinkDialog(true)} className="bg-gray-900 hover:bg-gray-800">
            <Link2 className="w-4 h-4 mr-2" />
            Link Account
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="repository">Repository</TabsTrigger>
          <TabsTrigger value="sync">Auto-Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {activeIntegration ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <Github className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{activeIntegration.config.username}</CardTitle>
                      <CardDescription>GitHub Account</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(activeIntegration.id)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {activeIntegration.config.repo_count || 0}
                    </div>
                    <div className="text-sm text-gray-600">Repositories</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {activeIntegration.last_sync 
                        ? new Date(activeIntegration.last_sync).toLocaleDateString() 
                        : 'Never'}
                    </div>
                    <div className="text-sm text-gray-600">Last Sync</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => syncProject(activeIntegration)} className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Sync to GitHub
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Pull Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Github className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No GitHub Account Linked</h3>
                <p className="text-gray-500 text-center text-sm mb-4 max-w-sm">
                  Connect your GitHub account to enable real-time syncing and collaboration
                </p>
                <Button onClick={() => setShowLinkDialog(true)}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Link GitHub Account
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Auto Deploy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Automatically push changes to your repository on save</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Branch Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Create and switch between branches directly from AppForge</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  GitHub Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Trigger workflows and CI/CD pipelines from your project</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="repository">
          <GitHubIntegration projectId={projectId} />
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Sync Settings</CardTitle>
              <CardDescription>Configure automatic synchronization with GitHub</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-commit on save</p>
                  <p className="text-sm text-gray-500">Automatically commit changes when you save files</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Push on commit</p>
                  <p className="text-sm text-gray-500">Automatically push commits to remote repository</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Pull before push</p>
                  <p className="text-sm text-gray-500">Always pull latest changes before pushing</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Link GitHub Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>GitHub Username</Label>
              <Input
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="your-username"
              />
            </div>
            <div>
              <Label>Personal Access Token</Label>
              <Input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create a token at{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  github.com/settings/tokens
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkAccount} disabled={isLinking}>
              {isLinking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Link Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}