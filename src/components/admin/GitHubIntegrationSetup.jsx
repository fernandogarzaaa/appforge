import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Github, Plus, Trash2, ExternalLink, CheckCircle, AlertCircle, 
  GitBranch, Code, Settings 
} from 'lucide-react';
import { toast } from 'sonner';

export default function GitHubIntegrationSetup() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    repo_owner: '',
    repo_name: '',
    branch: 'main',
    commit_prefix: '[AI-Bot]',
    auto_commit_enabled: true
  });

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  // Fetch GitHub integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['githubIntegrations'],
    queryFn: () => base44.entities.ProjectGitHubIntegration.list(),
  });

  // Create integration
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectGitHubIntegration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubIntegrations'] });
      setShowAddForm(false);
      setFormData({
        project_id: '',
        repo_owner: '',
        repo_name: '',
        branch: 'main',
        commit_prefix: '[AI-Bot]',
        auto_commit_enabled: true
      });
      toast.success('GitHub integration added');
    },
  });

  // Delete integration
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectGitHubIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubIntegrations'] });
      toast.success('Integration removed');
    },
  });

  // Toggle auto-commit
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => 
      base44.entities.ProjectGitHubIntegration.update(id, { auto_commit_enabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubIntegrations'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.project_id || !formData.repo_owner || !formData.repo_name) {
      toast.error('Please fill all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Integration
              </CardTitle>
              <CardDescription>
                Connect projects to GitHub repos for autonomous code commits
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Project</Label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    <option value="">Select project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Branch</Label>
                  <Input
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="main"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Repository Owner</Label>
                  <Input
                    value={formData.repo_owner}
                    onChange={(e) => setFormData({ ...formData, repo_owner: e.target.value })}
                    placeholder="username or org"
                  />
                </div>
                <div>
                  <Label>Repository Name</Label>
                  <Input
                    value={formData.repo_name}
                    onChange={(e) => setFormData({ ...formData, repo_name: e.target.value })}
                    placeholder="my-project"
                  />
                </div>
              </div>
              <div>
                <Label>Commit Message Prefix</Label>
                <Input
                  value={formData.commit_prefix}
                  onChange={(e) => setFormData({ ...formData, commit_prefix: e.target.value })}
                  placeholder="[AI-Bot]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.auto_commit_enabled}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, auto_commit_enabled: checked })
                    }
                  />
                  <Label>Enable Auto-Commit</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Integration'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {integrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Github className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No GitHub integrations configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Github className="w-5 h-5 text-gray-600" />
                        <div>
                          <a
                            href={`https://github.com/${integration.repo_owner}/${integration.repo_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-900 hover:text-blue-600 flex items-center gap-1"
                          >
                            {integration.repo_owner}/{integration.repo_name}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <p className="text-sm text-gray-600">{getProjectName(integration.project_id)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <GitBranch className="w-3 h-3" />
                          {integration.branch}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {integration.commit_prefix}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={integration.auto_commit_enabled ? 
                          'bg-green-100 text-green-700 border-0' : 
                          'bg-gray-100 text-gray-700 border-0'
                        }>
                          {integration.auto_commit_enabled ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Auto-Commit On
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Auto-Commit Off
                            </>
                          )}
                        </Badge>
                        <Switch
                          checked={integration.auto_commit_enabled}
                          onCheckedChange={(checked) => 
                            toggleMutation.mutate({ id: integration.id, enabled: checked })
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Remove this GitHub integration?')) {
                            deleteMutation.mutate(integration.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">1. Add Bot as Collaborator</h4>
            <p className="text-blue-800 mb-2">
              Go to your GitHub repo → Settings → Collaborators → Add people
            </p>
            <p className="text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded">
              Username: {Deno.env.get('GITHUB_BOT_USERNAME') || 'Not configured'}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">2. Grant Write Access</h4>
            <p className="text-blue-800">
              Give the bot "Write" or "Maintain" permission so it can commit code
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 mb-2">3. Configure Integration</h4>
            <p className="text-blue-800">
              Add the integration above with your repo details. The bot will start monitoring and committing fixes automatically every 5 minutes.
            </p>
          </div>

          <div className="pt-3 border-t border-blue-200">
            <p className="text-blue-700 text-xs">
              ⚠️ Make sure GITHUB_BOT_TOKEN and GITHUB_BOT_USERNAME are set in your environment secrets
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}