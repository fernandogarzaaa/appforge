import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ADVANCED_NODE_TYPES } from './nodeTypes';

export default function AdvancedNodePalette({ onNodeSelect }) {
  const categories = {
    control: 'Control Flow',
    integration: 'Integration & API',
    data: 'Data Manipulation',
    standard: 'Standard'
  };

  const groupedNodes = Object.values(ADVANCED_NODE_TYPES).reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="font-semibold text-sm mb-3">Advanced Nodes</h3>
      </div>
      {Object.entries(groupedNodes).map(([category, nodes]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">{categories[category] || category}</p>
          <div className="space-y-2">
            {nodes.map((node) => {
              const Icon = node.icon;
              return (
                <Card
                  key={node.id}
                  className="cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all"
                  onClick={() => onNodeSelect(node)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('nodeType', node.id);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold">{node.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{node.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}