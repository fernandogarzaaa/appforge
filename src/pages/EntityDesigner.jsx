import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, Plus, Save, Trash2, Copy, Search,
  Table, MoreHorizontal, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import FieldEditor from '@/components/entity/FieldEditor';
import EmptyState from '@/components/common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const entityIcons = ['📦', '👤', '📝', '🛒', '📊', '💳', '📧', '🏷️', '📋', '⚙️', '🎯', '📌'];

export default function EntityDesigner() {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEntity, setNewEntity] = useState({ name: '', description: '', icon: '📦' });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ['entities', projectId],
    queryFn: () => base44.entities.Entity.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Entity.create(data),
    onSuccess: (newEntity) => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] });
      setShowNewDialog(false);
      setNewEntity({ name: '', description: '', icon: '📦' });
      setSelectedEntity(newEntity);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Entity.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entities', projectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Entity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', projectId] });
      setSelectedEntity(null);
    },
  });

  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddField = () => {
    const newField = {
      name: '',
      type: 'string',
      required: false,
      description: '',
    };
    setSelectedEntity({
      ...selectedEntity,
      fields: [...(selectedEntity.fields || []), newField],
    });
  };

  const handleFieldChange = (index, updatedField) => {
    const newFields = [...(selectedEntity.fields || [])];
    newFields[index] = updatedField;
    setSelectedEntity({ ...selectedEntity, fields: newFields });
  };

  const handleDeleteField = (index) => {
    const newFields = selectedEntity.fields.filter((_, i) => i !== index);
    setSelectedEntity({ ...selectedEntity, fields: newFields });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedEntity.fields || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedEntity({ ...selectedEntity, fields: items });
  };

  const handleSave = () => {
    updateMutation.mutate({ id: selectedEntity.id, data: selectedEntity });
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={Database}
          title="No Project Selected"
          description="Please select a project to manage its entities."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Entities Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Entities</h2>
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
              placeholder="Search entities..."
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
            ) : filteredEntities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No entities found' : 'No entities yet'}
              </div>
            ) : (
              <AnimatePresence>
                {filteredEntities.map((entity) => (
                  <motion.button
                    key={entity.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedEntity(entity)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1",
                      selectedEntity?.id === entity.id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <span className="text-xl">{entity.icon || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{entity.name}</p>
                      <p className="text-xs text-gray-500">
                        {entity.fields?.length || 0} fields
                      </p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      selectedEntity?.id === entity.id && "rotate-90"
                    )} />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Entity Editor */}
      <div className="flex-1 bg-gray-50/50">
        {selectedEntity ? (
          <div className="h-full flex flex-col">
            {/* Entity Header */}
            <div className="bg-white border-b border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
                    {selectedEntity.icon || '📦'}
                  </div>
                  <div>
                    <Input
                      value={selectedEntity.name}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, name: e.target.value })}
                      className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                      placeholder="Entity Name"
                    />
                    <Input
                      value={selectedEntity.description || ''}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, description: e.target.value })}
                      className="text-sm text-gray-500 border-0 p-0 h-auto focus-visible:ring-0 bg-transparent mt-1"
                      placeholder="Add a description..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                      <DropdownMenuItem className="rounded-lg cursor-pointer">
                        <Table className="w-4 h-4 mr-2" />
                        View Data
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(selectedEntity.id)}
                        className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Entity
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Fields Editor */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Fields</h3>
                  <Button
                    onClick={handleAddField}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {/* Built-in fields info */}
                <div className="bg-indigo-50/50 rounded-xl p-4 mb-6 border border-indigo-100">
                  <p className="text-sm text-indigo-700">
                    <span className="font-medium">Built-in fields:</span> id, created_date, updated_date, created_by are automatically included.
                  </p>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        <AnimatePresence>
                          {selectedEntity.fields?.map((field, index) => (
                            <Draggable key={index} draggableId={`field-${index}`} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps}>
                                  <FieldEditor
                                    field={field}
                                    onChange={(updated) => handleFieldChange(index, updated)}
                                    onDelete={() => handleDeleteField(index)}
                                    entities={entities.filter(e => e.id !== selectedEntity.id)}
                                    dragHandleProps={provided.dragHandleProps}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {(!selectedEntity.fields || selectedEntity.fields.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-2">No custom fields yet</p>
                    <Button onClick={handleAddField} variant="outline" className="rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Add your first field
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Database}
              title="Select an entity"
              description="Choose an entity from the sidebar to edit its schema, or create a new one."
              actionLabel="Create Entity"
              onAction={() => setShowNewDialog(true)}
            />
          </div>
        )}
      </div>

      {/* New Entity Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Entity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {entityIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewEntity({ ...newEntity, icon })}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
                      newEntity.icon === icon
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
              <Label className="text-sm text-gray-600 mb-1.5 block">Name</Label>
              <Input
                value={newEntity.name}
                onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                placeholder="e.g. Product, Customer, Order"
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
              <Textarea
                value={newEntity.description}
                onChange={(e) => setNewEntity({ ...newEntity, description: e.target.value })}
                placeholder="Describe what this entity represents..."
                className="rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ ...newEntity, project_id: projectId, fields: [] })}
              disabled={!newEntity.name || createMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Entity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}