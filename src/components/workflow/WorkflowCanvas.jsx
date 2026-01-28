import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, Brain, Mail, FileText, BarChart3, 
  Trash2, Play, ArrowRight, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeTypes = {
  trigger: { icon: Play, color: 'green', label: 'Trigger' },
  data_input: { icon: Database, color: 'blue', label: 'Data Input' },
  llm: { icon: Brain, color: 'purple', label: 'AI Processing' },
  data_analysis: { icon: BarChart3, color: 'indigo', label: 'Data Analysis' },
  medical_ai: { icon: FileText, color: 'red', label: 'Medical AI' },
  government_ai: { icon: FileText, color: 'cyan', label: 'Government AI' },
  conditional: { icon: ArrowRight, color: 'yellow', label: 'Conditional' },
  email: { icon: Mail, color: 'orange', label: 'Send Email' },
  slack: { icon: Mail, color: 'purple', label: 'Slack' },
  google_drive: { icon: Database, color: 'blue', label: 'Google Drive' },
  zapier: { icon: Mail, color: 'orange', label: 'Zapier' },
  output: { icon: FileText, color: 'gray', label: 'Output' }
};

export default function WorkflowCanvas({ nodes, connections, onNodesChange, onConnectionsChange, onNodeClick }) {
  const canvasRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNodeDragStart = (node) => {
    setDraggingNode(node);
  };

  const handleNodeDrag = (e, node) => {
    if (!draggingNode) return;
    
    const updatedNodes = nodes.map(n => 
      n.id === node.id 
        ? { ...n, position: { x: e.clientX - 100, y: e.clientY - 300 } }
        : n
    );
    onNodesChange(updatedNodes);
  };

  const handleNodeDragEnd = () => {
    setDraggingNode(null);
  };

  const startConnection = (nodeId) => {
    setConnectingFrom(nodeId);
  };

  const completeConnection = (toNodeId) => {
    if (connectingFrom && connectingFrom !== toNodeId) {
      const newConnection = { from: connectingFrom, to: toNodeId };
      onConnectionsChange([...connections, newConnection]);
    }
    setConnectingFrom(null);
  };

  const deleteNode = (nodeId, e) => {
    e.stopPropagation();
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    const updatedConnections = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
    onNodesChange(updatedNodes);
    onConnectionsChange(updatedConnections);
  };

  const deleteConnection = (connection, e) => {
    e.stopPropagation();
    const updatedConnections = connections.filter(
      c => !(c.from === connection.from && c.to === connection.to)
    );
    onConnectionsChange(updatedConnections);
  };

  const getNodePosition = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.position : { x: 0, y: 0 };
  };

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
    >
      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {connections.map((conn, idx) => {
          const fromPos = getNodePosition(conn.from);
          const toPos = getNodePosition(conn.to);
          const midX = (fromPos.x + toPos.x) / 2;
          
          return (
            <g key={idx}>
              <path
                d={`M ${fromPos.x + 150} ${fromPos.y + 40} Q ${midX} ${fromPos.y + 40}, ${midX} ${(fromPos.y + toPos.y) / 2 + 40} T ${toPos.x} ${toPos.y + 40}`}
                stroke="#6366f1"
                strokeWidth="2"
                fill="none"
                className="pointer-events-auto cursor-pointer hover:stroke-red-500"
                onClick={(e) => deleteConnection(conn, e)}
              />
              <circle
                cx={(fromPos.x + toPos.x) / 2 + 75}
                cy={(fromPos.y + toPos.y) / 2 + 40}
                r="4"
                fill="#6366f1"
              />
            </g>
          );
        })}
        
        {/* Temporary connection line while connecting */}
        {connectingFrom && (
          <line
            x1={getNodePosition(connectingFrom).x + 150}
            y1={getNodePosition(connectingFrom).y + 40}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const NodeIcon = nodeTypes[node.type]?.icon || FileText;
        const nodeColor = nodeTypes[node.type]?.color || 'gray';
        
        return (
          <div
            key={node.id}
            className="absolute cursor-move"
            style={{ 
              left: node.position.x, 
              top: node.position.y,
              zIndex: 2
            }}
            onMouseDown={() => handleNodeDragStart(node)}
            onMouseMove={(e) => handleNodeDrag(e, node)}
            onMouseUp={handleNodeDragEnd}
          >
            <Card 
              className={cn(
                "w-[300px] shadow-lg hover:shadow-xl transition-all",
                draggingNode?.id === node.id && "scale-105"
              )}
              onClick={() => onNodeClick(node)}
            >
              <div className={`p-4 bg-${nodeColor}-50 border-b`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-${nodeColor}-100 flex items-center justify-center`}>
                      <NodeIcon className={`w-4 h-4 text-${nodeColor}-600`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{node.name}</p>
                      <p className="text-xs text-gray-500">{nodeTypes[node.type]?.label}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-red-600 hover:bg-red-100"
                    onClick={(e) => deleteNode(node.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                {node.config && Object.keys(node.config).length > 0 && (
                  <div className="text-xs space-y-1">
                    {Object.entries(node.config).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {key}: {String(value).substring(0, 30)}...
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {/* Connection points */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      startConnection(node.id);
                    }}
                  >
                    Connect
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (connectingFrom) {
                        completeConnection(node.id);
                      }
                    }}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Plus className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-semibold">Add nodes to start building</p>
            <p className="text-sm">Click "Add Node" to begin your workflow</p>
          </div>
        </div>
      )}
    </div>
  );
}