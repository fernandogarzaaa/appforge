import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VisualWorkflowEditor from './VisualWorkflowEditor';
import AdvancedNodePalette from './AdvancedNodePalette';
import AdvancedNodeConfigurator from './AdvancedNodeConfigurator';
import { Save, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedVisualEditor({ initialNodes = [], onSave }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const handleAddAdvancedNode = (nodeType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType.id,
      label: nodeType.name,
      config: nodeType.config,
      position: { x: 100, y: 100 + nodes.length * 50 }
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    toast.success(`${nodeType.name} added`);
  };

  const handleUpdateNode = (updatedConfig) => {
    if (!selectedNode) return;

    const updated = nodes.map(n =>
      n.id === selectedNode.id
        ? { ...n, config: updatedConfig }
        : n
    );

    setNodes(updated);
    setSelectedNode({ ...selectedNode, config: updatedConfig });
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes(nodes.filter(n => n.id !== selectedNode.id));
    setSelectedNode(null);
    toast.success('Node deleted');
  };

  const handleTestRun = async () => {
    setIsTestRunning(true);
    try {
      const response = await fetch('/api/executeAdvancedWorkflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          initialContext: { timestamp: new Date().toISOString() }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Test run successful');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Test run failed: ' + error.message);
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[80vh]">
      {/* Node Palette */}
      <div className="lg:col-span-1 overflow-y-auto border-r pr-4">
        <AdvancedNodePalette onNodeSelect={handleAddAdvancedNode} />
      </div>

      {/* Canvas and Config */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <Tabs defaultValue="canvas" className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="flex-1 border rounded-lg overflow-hidden">
            <VisualWorkflowEditor
              initialNodes={nodes}
              onNodeSelect={setSelectedNode}
              onNodesChange={setNodes}
            />
          </TabsContent>

          <TabsContent value="config" className="flex-1 overflow-y-auto">
            {selectedNode ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{selectedNode.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-gray-600">ID: {selectedNode.id}</p>
                    <p className="text-xs text-gray-600">Type: {selectedNode.type}</p>
                  </CardContent>
                </Card>

                <AdvancedNodeConfigurator
                  nodeType={selectedNode.type}
                  config={selectedNode.config}
                  onConfigChange={handleUpdateNode}
                />

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDeleteNode}
                >
                  Delete Node
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm">Select a node to configure</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleTestRun}
            disabled={isTestRunning || nodes.length === 0}
            variant="outline"
          >
            <Play className="w-4 h-4 mr-2" />
            {isTestRunning ? 'Testing...' : 'Test Run'}
          </Button>
          <Button
            onClick={() => {
              onSave(nodes);
              toast.success('Workflow saved');
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}