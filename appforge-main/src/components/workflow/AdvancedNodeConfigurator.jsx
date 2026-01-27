import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { NODE_OPERATORS, TRANSFORMATION_TYPES } from './nodeTypes';

export default function AdvancedNodeConfigurator({ nodeType, config, onConfigChange }) {
  const [localConfig, setLocalConfig] = useState(config);

  const updateConfig = (newConfig) => {
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Conditional Node
  if (nodeType === 'condition') {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Conditional Logic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {localConfig.conditions?.map((cond, idx) => (
            <div key={idx} className="p-3 bg-white rounded border space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Field name"
                  value={cond.field}
                  onChange={(e) => {
                    const updated = [...localConfig.conditions];
                    updated[idx].field = e.target.value;
                    updateConfig({ ...localConfig, conditions: updated });
                  }}
                  className="text-sm"
                />
                <Select
                  value={cond.operator}
                  onValueChange={(op) => {
                    const updated = [...localConfig.conditions];
                    updated[idx].operator = op;
                    updateConfig({ ...localConfig, conditions: updated });
                  }}
                >
                  <SelectTrigger className="w-28 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NODE_OPERATORS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={cond.value}
                  onChange={(e) => {
                    const updated = [...localConfig.conditions];
                    updated[idx].value = e.target.value;
                    updateConfig({ ...localConfig, conditions: updated });
                  }}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const updated = localConfig.conditions.filter((_, i) => i !== idx);
                    updateConfig({ ...localConfig, conditions: updated });
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <Input placeholder="Then execute node ID" className="text-xs" />
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full" onClick={() => {
            updateConfig({
              ...localConfig,
              conditions: [...(localConfig.conditions || []), { id: `cond${Date.now()}`, field: '', operator: 'equals', value: '', thenNodeId: null }]
            });
          }}>
            <Plus className="w-3 h-3 mr-1" /> Add Condition
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loop Node
  if (nodeType === 'loop') {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-sm">Loop Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Array/List Variable</Label>
            <Input
              placeholder="e.g., data.items"
              value={localConfig.arrayField}
              onChange={(e) => updateConfig({ ...localConfig, arrayField: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Item Variable Name</Label>
            <Input
              placeholder="e.g., item"
              value={localConfig.itemVariableName}
              onChange={(e) => updateConfig({ ...localConfig, itemVariableName: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Max Iterations</Label>
            <Input
              type="number"
              value={localConfig.maxIterations}
              onChange={(e) => updateConfig({ ...localConfig, maxIterations: parseInt(e.target.value) })}
              className="text-sm"
            />
          </div>
          <Input placeholder="Loop body node ID" className="text-xs" />
        </CardContent>
      </Card>
    );
  }

  // Parallel Node
  if (nodeType === 'parallel') {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-sm">Parallel Paths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {localConfig.paths?.map((path, idx) => (
            <div key={path.id} className="p-2 bg-white rounded border">
              <p className="text-xs font-semibold mb-2">Path {idx + 1}</p>
              <Input placeholder="Node ID to execute in parallel" className="text-xs" />
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full" onClick={() => {
            updateConfig({
              ...localConfig,
              paths: [...localConfig.paths, { id: `path${Date.now()}`, nodeId: null }]
            });
          }}>
            <Plus className="w-3 h-3 mr-1" /> Add Path
          </Button>
        </CardContent>
      </Card>
    );
  }

  // API Call Node
  if (nodeType === 'api_call') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-sm">API Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Method</Label>
            <Select value={localConfig.method} onValueChange={(m) => updateConfig({ ...localConfig, method: m })}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">URL</Label>
            <Input
              placeholder="https://api.example.com/endpoint"
              value={localConfig.url}
              onChange={(e) => updateConfig({ ...localConfig, url: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Headers (JSON)</Label>
            <Textarea
              placeholder='{"Authorization": "Bearer token"}'
              value={JSON.stringify(localConfig.headers, null, 2)}
              onChange={(e) => {
                try {
                  updateConfig({ ...localConfig, headers: JSON.parse(e.target.value) });
                } catch (err) {
                  console.error('Invalid JSON in headers:', err);
                  // Keep the current valid headers on parse error
                }
              }}
              rows={3}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Response Variable Name</Label>
            <Input
              value={localConfig.responseVariableName}
              onChange={(e) => updateConfig({ ...localConfig, responseVariableName: e.target.value })}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Data Transformation Node
  if (nodeType === 'data_transform') {
    return (
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-sm">Data Transformation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Source Variable</Label>
            <Input
              placeholder="e.g., data.date"
              value={localConfig.sourceVariable}
              onChange={(e) => updateConfig({ ...localConfig, sourceVariable: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Transformations</Label>
            {localConfig.transformations?.map((trans, idx) => (
              <div key={trans.id} className="p-2 bg-white rounded border">
                <Select
                  value={trans.type}
                  onValueChange={(t) => {
                    const updated = [...localConfig.transformations];
                    updated[idx].type = t;
                    updateConfig({ ...localConfig, transformations: updated });
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSFORMATION_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => {
              updateConfig({
                ...localConfig,
                transformations: [...(localConfig.transformations || []), { id: `t${Date.now()}`, type: 'format_date', params: {} }]
              });
            }}>
              <Plus className="w-3 h-3 mr-1" /> Add Transformation
            </Button>
          </div>
          <div>
            <Label className="text-xs">Output Variable</Label>
            <Input
              value={localConfig.outputVariable}
              onChange={(e) => updateConfig({ ...localConfig, outputVariable: e.target.value })}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Delay Node
  if (nodeType === 'delay') {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm">Delay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="number"
              value={localConfig.duration}
              onChange={(e) => updateConfig({ ...localConfig, duration: parseInt(e.target.value) })}
              className="text-sm flex-1"
            />
            <Select value={localConfig.unit} onValueChange={(u) => updateConfig({ ...localConfig, unit: u })}>
              <SelectTrigger className="w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">Seconds</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-gray-500">Advanced configuration for {nodeType}</p>
      </CardContent>
    </Card>
  );
}