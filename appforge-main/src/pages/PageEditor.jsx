import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileCode, Plus, Save, Trash2, Eye, Code, Layout,
  Search, MoreHorizontal, ChevronRight, Home, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const pageIcons = ['📄', '🏠', '⚙️', '👤', '📊', '🛒', '📝', '📋', '🔍', '💬'];

export default function PageEditor() {
  const [selectedPage, setSelectedPage] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('code');
  const [newPage, setNewPage] = useState({ name: '', path: '', icon: '📄', is_home: false });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['pages', projectId],
    queryFn: () => base44.entities.Page.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Page.create(data),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] });
      setShowNewDialog(false);
      setNewPage({ name: '', path: '', icon: '📄', is_home: false });
      setSelectedPage(newPage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Page.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pages', projectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Page.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', projectId] });
      setSelectedPage(null);
    },
  });

  const filteredPages = pages.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    updateMutation.mutate({ id: selectedPage.id, data: selectedPage });
  };

  const defaultCode = `import React from 'react';

export default function ${(newPage.name || '').replace(/\s+/g, '') || 'NewPage'}() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome to ${newPage.name || 'New Page'}</h1>
    </div>
  );
}`;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={FileCode}
          title="No Project Selected"
          description="Please select a project to manage its pages."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Pages Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Pages</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowNewDialog(true)}
              className="h-8 w-8 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="pl-9 h-9 rounded-lg bg-gray-50 border-0"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No pages found' : 'No pages yet'}
              </div>
            ) : (
              <AnimatePresence>
                {filteredPages.map((page) => (
                  <motion.button
                    key={page.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedPage(page)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1",
                      selectedPage?.id === page.id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <span className="text-xl">{page.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{page.name}</p>
                        {page.is_home && (
                          <Home className="w-3 h-3 text-indigo-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        /{page.path || (page.name || '').toLowerCase().replace(/\s+/g, '-')}
                      </p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      selectedPage?.id === page.id && "rotate-90"
                    )} />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Page Editor */}
      <div className="flex-1 bg-gray-50/50 flex flex-col">
        {selectedPage ? (
          <>
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                    {selectedPage.icon || '📄'}
                  </div>
                  <div>
                    <Input
                      value={selectedPage.name}
                      onChange={(e) => setSelectedPage({ ...selectedPage, name: e.target.value })}
                      className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">/</span>
                      <Input
                        value={selectedPage.path || ''}
                        onChange={(e) => setSelectedPage({ ...selectedPage, path: e.target.value })}
                        className="text-sm text-gray-500 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent w-auto"
                        placeholder="page-path"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                    <Switch
                      checked={selectedPage.is_home || false}
                      onCheckedChange={(v) => setSelectedPage({ ...selectedPage, is_home: v })}
                    />
                    <Label className="text-sm text-gray-600">Home Page</Label>
                  </div>
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
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(selectedPage.id)}
                        className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Page
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Editor Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="bg-white border-b border-gray-100 px-4">
                <TabsList className="h-12 bg-transparent p-0 gap-4">
                  <TabsTrigger 
                    value="code" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger 
                    value="design"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0"
                  >
                    <Layout className="w-4 h-4 mr-2" />
                    Design
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0"
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 m-0 p-0">
                <div className="h-full bg-[#1e1e1e]">
                  <Textarea
                    value={selectedPage.code || ''}
                    onChange={(e) => setSelectedPage({ ...selectedPage, code: e.target.value })}
                    className="w-full h-full font-mono text-sm bg-transparent text-gray-200 border-0 rounded-none resize-none focus-visible:ring-0 p-4"
                    placeholder="// Write your page code here..."
                    spellCheck={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="design" className="flex-1 m-0">
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Visual Designer</p>
                    <p className="text-sm text-gray-400 mt-1">Coming soon...</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 m-0 p-6">
                <div className="max-w-lg space-y-6">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1.5 block">Page Icon</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {pageIcons.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setSelectedPage({ ...selectedPage, icon })}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all",
                            selectedPage.icon === icon
                              ? "bg-indigo-100 ring-2 ring-indigo-500"
                              : "bg-white border border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={FileCode}
              title="Select a page"
              description="Choose a page from the sidebar to edit, or create a new one."
              actionLabel="Create Page"
              onAction={() => setShowNewDialog(true)}
            />
          </div>
        )}
      </div>

      {/* New Page Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {pageIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewPage({ ...newPage, icon })}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all",
                      newPage.icon === icon
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
              <Label className="text-sm text-gray-600 mb-1.5 block">Page Name</Label>
              <Input
                value={newPage.name}
                onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                placeholder="e.g. Dashboard, Settings, Profile"
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">URL Path</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">/</span>
                <Input
                  value={newPage.path}
                  onChange={(e) => setNewPage({ ...newPage, path: e.target.value })}
                  placeholder={(newPage.name || '').toLowerCase().replace(/\s+/g, '-') || 'page-path'}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <Label className="text-sm text-gray-600">Set as Home Page</Label>
              <Switch
                checked={newPage.is_home}
                onCheckedChange={(v) => setNewPage({ ...newPage, is_home: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ 
                ...newPage, 
                project_id: projectId, 
                code: defaultCode.replace(/NewPage/g, (newPage.name || '').replace(/\s+/g, '') || 'NewPage').replace(/New Page/g, newPage.name || 'New Page')
              })}
              disabled={!newPage.name || createMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}