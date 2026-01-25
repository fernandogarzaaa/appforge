import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WorkflowNodePalette from './WorkflowNodePalette';
import WorkflowNode from './WorkflowNode';
import { ZoomIn, ZoomOut, Save } from 'lucide-react';

export default function VisualWorkflowEditor({ initialNodes = [], onSave }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState(initialNodes.length > 0 ? initialNodes : []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [nodeCounter, setNodeCounter] = useState(initialNodes.length);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const nodeTypeStr = e.dataTransfer.getData('nodeType');
    if (!nodeTypeStr) return;

    const nodeType = JSON.parse(nodeTypeStr);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const newNode = {
      id: `node-${nodeCounter}`,
      type: nodeType.id,
      label: nodeType.name,
      x,
      y,
      config: {}
    };

    setNodes([...nodes, newNode]);
    setNodeCounter(nodeCounter + 1);
  };

  const handleNodeUpdate = (updatedNode) => {
    setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const handleNodeDelete = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleNodeConfigChange = (key, value) => {
    if (!selectedNode) return;
    const updated = {
      ...selectedNode,
      config: { ...selectedNode.config, [key]: value }
    };
    handleNodeUpdate(updated);
  };

  const handleSave = () => {
    onSave(nodes);
  };

  return (
    <div className="flex h-full gap-4">
      <WorkflowNodePalette />

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Workflow Canvas</h3>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button onClick={handleSave} className="ml-4">
              <Save className="w-4 h-4 mr-2" />
              Save Workflow
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg overflow-auto relative"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#999" />
                </marker>
              </defs>
              {nodes.map((node, idx) => {
                if (idx === 0) return null;
                const prevNode = nodes[idx - 1];
                return (
                  <line
                    key={`line-${node.id}`}
                    x1={prevNode.x + 96}
                    y1={prevNode.y + 48}
                    x2={node.x}
                    y2={node.y + 48}
                    stroke="#999"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="text-sm mb-2">Drag nodes from the palette to create workflow</p>
                </div>
              </div>
            )}

            {nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                onUpdate={handleNodeUpdate}
                onDelete={handleNodeDelete}
                isSelected={selectedNodeId === node.id}
                onSelect={setSelectedNodeId}
                isDragging={setIsDraggingNode}
              />
            ))}
          </div>

          {selectedNode && (
            <Card className="w-80 border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-sm">Node Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Node ID</Label>
                  <Input value={selectedNode.id} disabled className="mt-1" />
                </div>

                <div>
                  <Label className="text-sm">Type</Label>
                  <Input value={selectedNode.type} disabled className="mt-1" />
                </div>

                <div>
                  <Label className="text-sm">Label</Label>
                  <Input
                    value={selectedNode.label || ''}
                    onChange={(e) => handleNodeConfigChange('label', e.target.value)}
                    placeholder="Node name"
                    className="mt-1"
                  />
                </div>

                {selectedNode.type === 'action' && (
                  <>
                    <div>
                      <Label className="text-sm">Action Type</Label>
                      <Select defaultValue={selectedNode.config.actionType || 'api_call'}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api_call">API Call</SelectItem>
                          <SelectItem value="send_email">Send Email</SelectItem>
                          <SelectItem value="database_query">Database Query</SelectItem>
                          <SelectItem value="create_task">Create Task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Action Details</Label>
                      <Textarea
                        value={selectedNode.config.details || ''}
                        onChange={(e) => handleNodeConfigChange('details', e.target.value)}
                        placeholder="Describe the action..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <>
                    <div>
                      <Label className="text-sm">Condition</Label>
                      <Input
                        value={selectedNode.config.condition || ''}
                        onChange={(e) => handleNodeConfigChange('condition', e.target.value)}
                        placeholder="e.g., status === 'active'"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">If True Path</Label>
                      <Input
                        value={selectedNode.config.truePath || ''}
                        onChange={(e) => handleNodeConfigChange('truePath', e.target.value)}
                        placeholder="Node ID or label"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">If False Path</Label>
                      <Input
                        value={selectedNode.config.falsePath || ''}
                        onChange={(e) => handleNodeConfigChange('falsePath', e.target.value)}
                        placeholder="Node ID or label"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'loop' && (
                  <>
                    <div>
                      <Label className="text-sm">Loop Over</Label>
                      <Input
                        value={selectedNode.config.loopVar || ''}
                        onChange={(e) => handleNodeConfigChange('loopVar', e.target.value)}
                        placeholder="Variable to iterate"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Loop Count / Iterator</Label>
                      <Input
                        value={selectedNode.config.iterator || ''}
                        onChange={(e) => handleNodeConfigChange('iterator', e.target.value)}
                        placeholder="e.g., item, index"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'parallel' && (
                  <>
                    <div>
                      <Label className="text-sm">Parallel Branches</Label>
                      <Textarea
                        value={selectedNode.config.branches || ''}
                        onChange={(e) => handleNodeConfigChange('branches', e.target.value)}
                        placeholder="Comma-separated node IDs or labels"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}