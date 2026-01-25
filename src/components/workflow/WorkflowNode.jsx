import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, GitBranch, Repeat, Layers, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeIcons = {
  action: Zap,
  condition: GitBranch,
  loop: Repeat,
  parallel: Layers,
  trigger: AlertCircle
};

const nodeColors = {
  action: 'bg-blue-50 border-blue-200',
  condition: 'bg-orange-50 border-orange-200',
  loop: 'bg-purple-50 border-purple-200',
  parallel: 'bg-green-50 border-green-200',
  trigger: 'bg-red-50 border-red-200'
};

export default function WorkflowNode({ node, onUpdate, onDelete, isSelected, onSelect, isDragging }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [label, setLabel] = React.useState(node.label || '');
  const dragRef = useRef(null);

  const Icon = nodeIcons[node.type] || Zap;

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('nodeId', node.id);
    isDragging?.(true);
  };

  const handleDragEnd = (e) => {
    isDragging?.(false);
  };

  const handleSaveLabel = () => {
    onUpdate({ ...node, label });
    setIsEditing(false);
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect(node.id)}
      className={cn(
        'absolute cursor-move rounded-lg border-2 p-3 w-48 transition-all',
        nodeColors[node.type],
        isSelected ? 'ring-2 ring-blue-500 border-blue-400' : 'border-gray-300'
      )}
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
    >
      <div className="flex items-start gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveLabel()}
              className="h-6 text-sm"
              placeholder="Node name..."
            />
          ) : (
            <div className="text-sm font-semibold text-gray-900 truncate">
              {label || node.type}
            </div>
          )}
          <div className="text-xs text-gray-600 capitalize">{node.type}</div>
        </div>
      </div>

      {node.config && Object.keys(node.config).length > 0 && (
        <div className="text-xs bg-white bg-opacity-50 p-1.5 rounded mb-2 max-h-16 overflow-y-auto">
          {Object.entries(node.config).map(([key, value]) => (
            <div key={key} className="text-gray-600 truncate">
              <span className="font-medium">{key}:</span> {String(value).slice(0, 15)}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Edit2 className="w-3 h-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </Button>
      </div>

      {/* Connection points */}
      <div className="absolute w-2 h-2 bg-gray-400 rounded-full -right-1 top-1/2 transform -translate-y-1/2" />
      <div className="absolute w-2 h-2 bg-gray-400 rounded-full -left-1 top-1/2 transform -translate-y-1/2" />
    </div>
  );
}