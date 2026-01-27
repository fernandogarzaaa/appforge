import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Settings, Save, Trash2, Globe, Palette, Shield,
  AlertTriangle, Check, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';

const projectIcons = ['📁', '🚀', '💼', '🎨', '📱', '🌐', '🛒', '📊', '🎮', '📝', '🔧', '💡'];
const projectColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
const statusOptions = [
  { value: 'draft', label: 'Draft', description: 'Work in progress' },
  { value: 'development', label: 'Development', description: 'Being actively developed' },
  { value: 'published', label: 'Published', description: 'Live and accessible' },
  { value: 'archived', label: 'Archived', description: 'No longer active' },
];

export default function ProjectSettings() {
  const [project, setProject] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: fetchedProject, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (fetchedProject) {
      setProject(fetchedProject);
    }
  }, [fetchedProject]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Settings saved successfully');
      setHasChanges(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Project.delete(projectId),
    onSuccess: () => {
      toast.success('Project deleted');
      navigate(createPageUrl('Projects'));
    },
  });

  const handleChange = (field, value) => {
    setProject((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSettingsChange = (field, value) => {
    setProject((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(project);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(projectId);
    toast.success('Project ID copied');
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={Settings}
          title="No Project Selected"
          description="Please select a project to view its settings."
        />
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
            <p className="text-gray-500 mt-1">Manage your project configuration</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={cn(
              "rounded-xl h-11 px-6",
              hasChanges
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                : "bg-gray-100 text-gray-400"
            )}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card className="rounded-2xl border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg">General</CardTitle>
              <CardDescription>Basic project information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Icon & Color */}
              <div className="flex gap-8">
                <div className="flex-1">
                  <Label className="text-sm text-gray-600 mb-3 block">Icon</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {projectIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => handleChange('icon', icon)}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
                          project.icon === icon
                            ? "bg-indigo-100 ring-2 ring-indigo-500"
                            : "bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-3 block">Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {projectColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleChange('color', color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          project.color === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Project Name</Label>
                <Input
                  value={project.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
                <Textarea
                  value={project.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="rounded-xl resize-none h-24"
                />
              </div>

              {/* Status */}
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Status</Label>
                <Select value={project.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div>
                          <p className="font-medium">{status.label}</p>
                          <p className="text-xs text-gray-500">{status.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project ID */}
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Project ID</Label>
                <div className="flex gap-2">
                  <Input
                    value={projectId}
                    readOnly
                    className="h-11 rounded-xl bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyId}
                    className="h-11 px-4 rounded-xl"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Settings */}
          <Card className="rounded-2xl border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-500" />
                <div>
                  <CardTitle className="text-lg">Publishing</CardTitle>
                  <CardDescription>Control how your app is accessed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <Label className="font-medium">Public Access</Label>
                  <p className="text-sm text-gray-500 mt-0.5">Allow anyone to access your app</p>
                </div>
                <Switch
                  checked={project.settings?.is_public || false}
                  onCheckedChange={(v) => handleSettingsChange('is_public', v)}
                />
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Custom Domain</Label>
                <Input
                  value={project.settings?.custom_domain || ''}
                  onChange={(e) => handleSettingsChange('custom_domain', e.target.value)}
                  placeholder="app.yourdomain.com"
                  className="h-11 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="rounded-2xl border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-purple-500" />
                <div>
                  <CardTitle className="text-lg">Appearance</CardTitle>
                  <CardDescription>Customize the look of your app</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Theme</Label>
                <Select 
                  value={project.settings?.theme || 'system'} 
                  onValueChange={(v) => handleSettingsChange('theme', v)}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="rounded-2xl border-red-200 bg-red-50/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
                  <CardDescription className="text-red-500/80">
                    Irreversible actions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">Delete Project</p>
                  <p className="text-sm text-gray-500">
                    Permanently delete this project and all its data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{project.name}" and all of its entities, pages, and components.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}