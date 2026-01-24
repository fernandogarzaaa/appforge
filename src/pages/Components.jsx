import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Component, Plus, Save, Trash2, Search,
  MoreHorizontal, ChevronRight, Copy, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmptyState from '@/components/common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'layout', label: 'Layout', icon: '📐' },
  { value: 'form', label: 'Form', icon: '📝' },
  { value: 'display', label: 'Display', icon: '🖼️' },
  { value: 'navigation', label: 'Navigation', icon: '🧭' },
  { value: 'chart', label: 'Chart', icon: '📊' },
  { value: 'custom', label: 'Custom', icon: '🔧' },
];

const categoryColors = {
  layout: 'bg-blue-50 text-blue-600',
  form: 'bg-green-50 text-green-600',
  display: 'bg-purple-50 text-purple-600',
  navigation: 'bg-orange-50 text-orange-600',
  chart: 'bg-pink-50 text-pink-600',
  custom: 'bg-gray-100 text-gray-600',
};

export default function Components() {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newComponent, setNewComponent] = useState({ name: '', description: '', category: 'custom' });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['components', projectId],
    queryFn: () => base44.entities.Component.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Component.create(data),
    onSuccess: (newComp) => {
      queryClient.invalidateQueries({ queryKey: ['components', projectId] });
      setShowNewDialog(false);
      setNewComponent({ name: '', description: '', category: 'custom' });
      setSelectedComponent(newComp);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Component.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['components', projectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Component.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components', projectId] });
      setSelectedComponent(null);
    },
  });

  const filteredComponents = components.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSave = () => {
    updateMutation.mutate({ id: selectedComponent.id, data: selectedComponent });
  };

  const defaultCode = `import React from 'react';

export default function ${newComponent.name.replace(/\s+/g, '') || 'NewComponent'}({ children }) {
  return (
    <div className="p-4">
      {children}
    </div>
  );
}`;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={Component}
          title="No Project Selected"
          description="Please select a project to manage its components."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Components Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Components</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowNewDialog(true)}
              className="h-8 w-8 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className="pl-9 h-9 rounded-lg bg-gray-50 border-0"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 rounded-lg bg-gray-50 border-0">
                <Layers className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredComponents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery || categoryFilter !== 'all' ? 'No components found' : 'No components yet'}
              </div>
            ) : (
              <AnimatePresence>
                {filteredComponents.map((component) => (
                  <motion.button
                    key={component.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedComponent(component)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1",
                      selectedComponent?.id === component.id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {component.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{component.name}</p>
                      <Badge className={cn("text-xs mt-1", categoryColors[component.category])}>
                        {component.category}
                      </Badge>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      selectedComponent?.id === component.id && "rotate-90"
                    )} />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Component Editor */}
      <div className="flex-1 bg-gray-50/50 flex flex-col">
        {selectedComponent ? (
          <>
            {/* Component Header */}
            <div className="bg-white border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                    {selectedComponent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Input
                      value={selectedComponent.name}
                      onChange={(e) => setSelectedComponent({ ...selectedComponent, name: e.target.value })}
                      className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <Select 
                        value={selectedComponent.category} 
                        onValueChange={(v) => setSelectedComponent({ ...selectedComponent, category: v })}
                      >
                        <SelectTrigger className="h-7 w-auto border-0 p-0 text-sm text-gray-500 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-xl">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem className="rounded-lg cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(selectedComponent.id)}
                        className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 bg-[#1e1e1e]">
              <Textarea
                value={selectedComponent.code || ''}
                onChange={(e) => setSelectedComponent({ ...selectedComponent, code: e.target.value })}
                className="w-full h-full font-mono text-sm bg-transparent text-gray-200 border-0 rounded-none resize-none focus-visible:ring-0 p-4"
                placeholder="// Write your component code here..."
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Component}
              title="Select a component"
              description="Choose a component from the sidebar to edit, or create a new one."
              actionLabel="Create Component"
              onAction={() => setShowNewDialog(true)}
            />
          </div>
        )}
      </div>

      {/* New Component Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Component Name</Label>
              <Input
                value={newComponent.name}
                onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                placeholder="e.g. UserCard, DataTable, Header"
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Category</Label>
              <Select 
                value={newComponent.category} 
                onValueChange={(v) => setNewComponent({ ...newComponent, category: v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
              <Textarea
                value={newComponent.description}
                onChange={(e) => setNewComponent({ ...newComponent, description: e.target.value })}
                placeholder="What does this component do?"
                className="rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ 
                ...newComponent, 
                project_id: projectId,
                code: defaultCode.replace(/NewComponent/g, newComponent.name.replace(/\s+/g, '') || 'NewComponent')
              })}
              disabled={!newComponent.name || createMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}