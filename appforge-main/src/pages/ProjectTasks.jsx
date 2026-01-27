import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ListTodo, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KanbanBoard from '@/components/projects/KanbanBoard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ProjectTasks() {
  const [view, setView] = useState('kanban');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: ''
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setIsDialogOpen(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '' });
      toast.success('Task created');
    }
  });

  const handleCreateTask = () => {
    if (!newTask.title) {
      toast.error('Task title is required');
      return;
    }
    createTaskMutation.mutate({ ...newTask, project_id: projectId });
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No project selected</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{project?.icon || '📋'}</span>
              <h1 className="text-base font-semibold text-gray-900">Tasks</h1>
            </div>
            <p className="text-[11px] text-gray-500">
              Manage tasks and track progress for {project?.name || 'this project'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={setView}>
              <TabsList className="h-8">
                <TabsTrigger value="kanban" className="text-[12px]">
                  <LayoutGrid className="w-3 h-3 mr-1.5" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="text-[12px]">
                  <ListTodo className="w-3 h-3 mr-1.5" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-8 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-[13px]">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-base">Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[12px]">Title</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="h-9 text-[13px]"
                      placeholder="Task title"
                    />
                  </div>
                  <div>
                    <Label className="text-[12px]">Description</Label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="text-[13px]"
                      placeholder="Task description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Status</Label>
                      <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[12px]">Priority</Label>
                      <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[12px]">Due Date</Label>
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      className="h-9 text-[13px]"
                    />
                  </div>
                  <Button
                    onClick={handleCreateTask}
                    className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-[13px]"
                  >
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-[13px]">Loading tasks...</div>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard tasks={tasks} projectId={projectId} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-2">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <h3 className="font-medium text-[13px] text-gray-900">{task.title}</h3>
                {task.description && (
                  <p className="text-[12px] text-gray-500 mt-1">{task.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}