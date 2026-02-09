import React, { useState, useEffect, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Filter,
  FolderKanban,
  Trash2,
  Copy,
  CheckSquare,
  Square,
  Sparkles,
  Database,
  FileCode,
  X
} from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

// Lazy load AI Generator
const AIProjectGenerator = lazy(() => import('@/components/ai/AIProjectGenerator'));

export default function ProjectsNew() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Project.list('-updated_date');
        return Array.isArray(result) ? result : (result?.data || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
        return [];
      }
    },
    retry: 1,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.entities.Project.create(data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowNewDialog(false);
      setNewProject({ name: '', description: '' });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: error?.message || 'An error occurred',
        variant: "destructive"
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project deleted",
        description: "The project has been removed.",
      });
    },
  });

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Project.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjects(new Set());
      setIsSelectionMode(false);
      toast({
        title: "Projects deleted",
        description: `${selectedProjects.size} project(s) removed.`,
      });
    },
  });

  // Batch duplicate mutation
  const batchDuplicateMutation = useMutation({
    mutationFn: async (ids) => {
      const projectsToDuplicate = projects.filter(p => ids.includes(p.id));
      await Promise.all(projectsToDuplicate.map(project =>
        base44.entities.Project.create({
          name: `${project.name} (Copy)`,
          description: project.description,
          status: 'draft'
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjects(new Set());
      setIsSelectionMode(false);
      toast({
        title: "Projects duplicated",
        description: `${selectedProjects.size} project(s) copied.`,
      });
    },
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

  const handleCreate = () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }

    const projectData = {
      name: newProject.name.trim(),
      ...(newProject.description && { description: newProject.description.trim() }),
      status: 'draft'
    };

    createMutation.mutate(projectData);
  };

  const toggleProjectSelection = (projectId) => {
    const newSelection = new Set(selectedProjects);
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId);
    } else {
      newSelection.add(projectId);
    }
    setSelectedProjects(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === paginatedProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(paginatedProjects.map(p => p.id)));
    }
  };

  const handleBatchDelete = () => {
    if (window.confirm(`Delete ${selectedProjects.size} project(s)? This action cannot be undone.`)) {
      batchDeleteMutation.mutate(Array.from(selectedProjects));
    }
  };

  const handleBatchDuplicate = () => {
    batchDuplicateMutation.mutate(Array.from(selectedProjects));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage and organize all your applications</p>
          </div>
          <div className="flex gap-3">
            {filteredProjects.length > 0 && (
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedProjects(new Set());
                }}
                className={isSelectionMode ? "bg-gray-900 hover:bg-gray-800 text-white" : "border-gray-300"}
              >
                {isSelectionMode ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Done
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Select
                  </>
                )}
              </Button>
            )}
            <Suspense fallback={null}>
              <Button
                onClick={() => setShowAIGenerator(true)}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
            </Suspense>
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {isSelectionMode && selectedProjects.size > 0 && (
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    {selectedProjects.size} selected
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {selectedProjects.size === paginatedProjects.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchDuplicate}
                    disabled={batchDuplicateMutation.isPending}
                    className="h-8 border-gray-300"
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    {batchDuplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={batchDeleteMutation.isPending}
                    className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    {batchDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-40 border-gray-300">
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
            <Tabs value={viewMode} onValueChange={(val) => setViewMode(val)}>
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="grid" className="data-[state=active]:bg-gray-100">
                  <Grid3X3 className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-gray-100">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Projects Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border border-gray-200 animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-16 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded mb-4" />
                  <div className="h-8 bg-gray-50 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Create your first project to start building amazing applications'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowNewDialog(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-3'
            }>
              <AnimatePresence mode="popLayout">
                {paginatedProjects.map((project) => (
                  <ProjectCardMinimal
                    key={project.id}
                    project={project}
                    onDelete={() => deleteMutation.mutate(project.id)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedProjects.has(project.id)}
                    onToggleSelect={() => toggleProjectSelection(project.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-300"
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
                  className="border-gray-300"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* AI Generator Modal */}
        <Suspense fallback={null}>
          <AIProjectGenerator
            isOpen={showAIGenerator}
            onClose={() => setShowAIGenerator(false)}
            onProjectCreated={() => {
              queryClient.invalidateQueries({ queryKey: ['projects'] });
            }}
          />
        </Suspense>

        {/* New Project Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="sm:max-w-md">
            <div className="flex items-center justify-between mb-6">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Create Project
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewDialog(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My Awesome App"
                  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe what your project does..."
                  className="resize-none h-24 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* AI Helper Card */}
              <Card className="border border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-semibold text-purple-900">Need AI help?</p>
                      </div>
                      <p className="text-sm text-purple-700">
                        Let AI design and build your project automatically
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-600 hover:bg-purple-100 hover:border-purple-400"
                      onClick={() => {
                        setShowNewDialog(false);
                        setShowAIGenerator(true);
                      }}
                    >
                      Use AI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowNewDialog(false)}
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newProject.name.trim() || createMutation.isPending}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

// Minimal Project Card Component
function ProjectCardMinimal({ project, onDelete, isSelectionMode, isSelected, onToggleSelect }) {
  const stats = project.stats || {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`h-full border transition-all cursor-pointer ${isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
        onClick={isSelectionMode ? onToggleSelect : undefined}
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                {isSelectionMode && (
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={createPageUrl('ProjectDetail', { id: project.id })}>
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                      {project.name || 'Untitled Project'}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(project.updated_date || project.created_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>{stats.entities_count || 0} entities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4" />
                <span>{stats.pages_count || 0} pages</span>
              </div>
            </div>

            {/* Actions */}
            {!isSelectionMode && (
              <div className="flex items-center gap-2 pt-2">
                <Link to={createPageUrl('ProjectDetail', { id: project.id })} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-gray-300 hover:border-gray-400">
                    Open
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this project? This action cannot be undone.')) {
                      onDelete();
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
