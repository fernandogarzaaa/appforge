import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { userService } from '@/api/appforge';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Grid3X3, List, Filter, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/common/EmptyState';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const projectIcons = ['📁', '🚀', '💼', '🎨', '📱', '🌐', '🛒', '📊', '🎮', '📝', '🔧', '💡'];
const projectColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

export default function Projects() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#6366f1',
    status: 'draft',
  });
  const [_selectedTemplate, _setSelectedTemplate] = useState(null);

  const queryClient = useQueryClient();
  const { isAuthenticated } = useBackendAuth();
  const { toast: _toast } = useToast();

  // Fetch base44 projects
  const { data: projects = [], isLoading, error: _error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Project.list('-updated_date');
        console.log('Projects loaded:', result);
        // Handle both array and {data: array} formats
        return Array.isArray(result) ? result : (result?.data || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
        return [];
      }
    },
    retry: 1,
  });

  // Fetch backend projects (optional - shows integration)
  const { data: _backendProjects = [] } = useQuery({
    queryKey: ['backendProjects'],
    queryFn: () => userService.listProjects(),
    enabled: isAuthenticated,
    retry: 1,
    // Silent fail - backend projects are optional
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Mutation called with:', data);
      // Use base44.entities.Project.create without ID, let base44 auto-generate
      const result = await base44.entities.Project.create(data);
      return result;
    },
    onSuccess: () => {
      console.log('Project created successfully!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowNewDialog(false);
      setNewProject({ name: '', description: '', icon: '📁', color: '#6366f1', status: 'draft' });
    },
    onError: (error) => {
      const errorMessage = error?.message || 'Failed to create project';
      console.error('Project creation error:', error);
      alert(`Error: ${errorMessage}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      setShowNewDialog(true);
    }
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleCreate = () => {
    console.log('Creating project with data:', newProject);
    // Filter out any undefined/null values and only send what we have
    const projectData = {
      name: newProject.name.trim(),
      ...(newProject.description && { description: newProject.description.trim() }),
      ...(newProject.icon && { icon: newProject.icon }),
      ...(newProject.color && { color: newProject.color }),
      status: 'draft'
    };
    console.log('Sending to API (filtered):', projectData);
    createMutation.mutate(projectData);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Projects</h1>
          <p className="text-gray-500">Manage and organize all your applications</p>
        </div>
        <Button
          onClick={() => setShowNewDialog(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); handleFilterChange(); }}>
            <SelectTrigger className="w-40 h-11 rounded-xl border-gray-200">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="h-11 rounded-xl bg-gray-100 p-1">
              <TabsTrigger value="grid" className="rounded-lg px-3">
                <Grid3X3 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg px-3">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-10 bg-gray-100 rounded mb-4" />
              <div className="h-8 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={searchQuery ? 'No projects found' : 'No projects yet'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Create your first project to start building amazing applications.'
          }
          actionLabel={!searchQuery ? 'Create Project' : undefined}
          onAction={!searchQuery ? () => setShowNewDialog(true) : undefined}
        />
      ) : (
        <div>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'
          }>
            <AnimatePresence mode="popLayout">
              {paginatedProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onDelete={(p) => deleteMutation.mutate(p.id)}
                />
              ))}
            </AnimatePresence>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent 
          className="sm:max-w-lg rounded-2xl p-6"
          style={{
            maxHeight: '90vh',
            overflowY: 'scroll',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="mb-4">
            <DialogTitle className="text-base font-semibold">Create New Project</DialogTitle>
          </div>
          <div className="space-y-4">
            {/* Icon & Color Selection */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-[13px] text-gray-600 mb-2 block">Icon</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {projectIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewProject({ ...newProject, icon })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                        newProject.icon === icon
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-[13px] text-gray-600 mb-2 block">Color</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {projectColors.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewProject({ ...newProject, color })}
                      className={`w-7 h-7 rounded-lg transition-all ${
                        newProject.color === color ? 'ring-2 ring-offset-1 ring-gray-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-[13px] text-gray-600 mb-1.5 block">Project Name</Label>
              <Input
                value={newProject.name}
                onChange={(e) => {
                  console.log('Name changed to:', e.target.value);
                  setNewProject({ ...newProject, name: e.target.value });
                }}
                placeholder="My Awesome App"
                className="h-9 rounded-lg border-gray-200 text-[13px]"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-[13px] text-gray-600 mb-1.5 block">Description</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="What's this project about?"
                className="rounded-lg border-gray-200 resize-none h-20 text-[13px]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-8 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setShowNewDialog(false)}
              className="rounded-lg h-9 text-[13px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newProject.name || createMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-9 text-[13px] flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}