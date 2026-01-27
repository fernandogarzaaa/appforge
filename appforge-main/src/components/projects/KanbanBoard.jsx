import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusColumns = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { id: 'review', label: 'Review', color: 'bg-purple-100 text-purple-700' },
  { id: 'done', label: 'Done', color: 'bg-green-100 text-green-700' }
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export default function KanbanBoard({ tasks, projectId }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task updated');
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const task = tasks.find(t => t.id === draggableId);
    
    if (task && task.status !== destination.droppableId) {
      updateTaskMutation.mutate({
        id: draggableId,
        data: { status: destination.droppableId }
      });
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-72">
              <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[13px] text-gray-900">{column.label}</h3>
                    <Badge className={cn("text-[10px]", column.color)}>
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-2 space-y-2 min-h-[200px]",
                        snapshot.isDraggingOver && "bg-gray-50"
                      )}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing",
                                snapshot.isDragging && "shadow-lg"
                              )}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-[13px] font-medium text-gray-900 flex-1">
                                  {task.title}
                                </h4>
                                <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              {task.description && (
                                <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={cn("text-[10px]", priorityColors[task.priority])}>
                                  {task.priority}
                                </Badge>
                                {task.due_date && (
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </div>
                                )}
                                {task.tags?.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}