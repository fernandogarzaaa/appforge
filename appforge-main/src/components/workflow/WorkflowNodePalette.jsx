import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, GitBranch, Repeat, Layers, AlertCircle } from 'lucide-react';

export default function WorkflowNodePalette() {
  const nodeTypes = [
    {
      id: 'action',
      name: 'Action',
      icon: Zap,
      description: 'Execute a task',
      color: 'bg-blue-100'
    },
    {
      id: 'condition',
      name: 'Condition',
      icon: GitBranch,
      description: 'If/Else logic',
      color: 'bg-orange-100'
    },
    {
      id: 'loop',
      name: 'Loop',
      icon: Repeat,
      description: 'Repeat logic',
      color: 'bg-purple-100'
    },
    {
      id: 'parallel',
      name: 'Parallel',
      icon: Layers,
      description: 'Execute in parallel',
      color: 'bg-green-100'
    },
    {
      id: 'trigger',
      name: 'Trigger',
      icon: AlertCircle,
      description: 'Start point',
      color: 'bg-red-100'
    }
  ];

  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', JSON.stringify(nodeType));
  };

  return (
    <div className="w-72 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-900">Node Types</h3>
        <p className="text-xs text-gray-500 mt-1">Drag nodes to canvas</p>
      </div>
      
      <div className="p-4 space-y-2">
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon;
          return (
            <div
              key={nodeType.id}
              draggable
              onDragStart={(e) => handleDragStart(e, nodeType)}
              className={`${nodeType.color} p-3 rounded-lg cursor-move hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{nodeType.name}</div>
                  <div className="text-xs text-gray-600">{nodeType.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <span className="font-semibold">Action:</span>
            <span>Execute API calls, send emails, create tasks</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold">Condition:</span>
            <span>Branch workflow based on if/else logic</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold">Loop:</span>
            <span>Repeat steps for collections</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold">Parallel:</span>
            <span>Execute multiple paths simultaneously</span>
          </div>
        </div>
      </div>
    </div>
  );
}