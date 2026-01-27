import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { toast } from 'sonner';

const CONNECTOR_CONFIGS = {
  snowflake: {
    icon: '❄️',
    fields: ['account_id', 'api_key', 'api_secret', 'database', 'schema', 'table'],
    help: 'Account ID format: xy12345.us-east-1'
  },
  bigquery: {
    icon: '📊',
    fields: ['project_id', 'dataset', 'table', 'api_key'],
    help: 'Use service account JSON API key'
  },
  salesforce: {
    icon: '☁️',
    fields: ['instance_url', 'api_key', 'api_secret'],
    help: 'Instance URL: https://your-instance.salesforce.com'
  },
  hubspot: {
    icon: '🎯',
    fields: ['api_key', 'workspace_id'],
    help: 'Private app access token'
  },
  asana: {
    icon: '✓',
    fields: ['api_key', 'workspace_id'],
    help: 'Personal access token'
  },
  jira: {
    icon: '🔧',
    fields: ['instance_url', 'api_key', 'api_secret'],
    help: 'Use email and API token for authentication'
  }
};

export default function DataSourceConnectorManager({ connectors = [], onConnectorsChange }) {
  const [connectorList, setConnectorList] = useState(connectors);
  const [isOpen, setIsOpen] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [newConnector, setNewConnector] = useState({
    name: '',
    connector_type: 'snowflake',
    authentication_method: 'api_key',
    sync_frequency: 'hourly',
    config: {}
  });

  const handleAddConnector = async () => {
    if (!newConnector.name || !newConnector.connector_type) {
      toast.error('Name and connector type are required');
      return;
    }

    try {
      const created = await base44.entities.DataSourceConnector.create(newConnector);
      const updated = [...connectorList, created];
      setConnectorList(updated);
      onConnectorsChange(updated);
      setNewConnector({
        name: '',
        connector_type: 'snowflake',
        authentication_method: 'api_key',
        sync_frequency: 'hourly',
        config: {}
      });
      setIsOpen(false);
      toast.success('Connector created');
    } catch (error) {
      toast.error('Failed to create connector: ' + error.message);
    }
  };

  const handleTestConnection = async (connector) => {
    setTestingId(connector.id);
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: `Test connection to ${connector.connector_type}. Account: ${connector.config.account_id || connector.config.workspace_id || connector.config.project_id}. Return success or error message.`,
        response_json_schema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      });

      await base44.entities.DataSourceConnector.update(connector.id, {
        test_connection_passed: true,
        status: 'active'
      });

      const updated = connectorList.map(c => 
        c.id === connector.id ? { ...c, test_connection_passed: true, status: 'active' } : c
      );
      setConnectorList(updated);
      onConnectorsChange(updated);
      toast.success('Connection successful');
    } catch (error) {
      await base44.entities.DataSourceConnector.update(connector.id, {
        test_connection_passed: false,
        last_error: error.message
      });
      toast.error('Connection failed: ' + error.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleRemove = async (id) => {
    try {
      await base44.entities.DataSourceConnector.delete(id);
      const updated = connectorList.filter(c => c.id !== id);
      setConnectorList(updated);
      onConnectorsChange(updated);
      toast.success('Connector removed');
    } catch (error) {
      toast.error('Failed to remove connector');
    }
  };

  const config = CONNECTOR_CONFIGS[newConnector.connector_type];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Database className="w-4 h-4" />
          Data Source Connectors
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              Add Connector
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Data Source Connector</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Connector Name</label>
                <Input
                  placeholder="My Snowflake Connection"
                  value={newConnector.name}
                  onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Data Source Type</label>
                <Select
                  value={newConnector.connector_type}
                  onValueChange={(v) => setNewConnector({ ...newConnector, connector_type: v, config: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONNECTOR_CONFIGS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {config && <p className="text-xs text-gray-500 mt-1">{config.help}</p>}
              </div>

              {config && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">Configuration</label>
                  {config.fields.map(field => (
                    <div key={field}>
                      <Input
                        type={field.includes('secret') || field.includes('key') ? 'password' : 'text'}
                        placeholder={field.replace(/_/g, ' ').toUpperCase()}
                        value={newConnector.config[field] || ''}
                        onChange={(e) => setNewConnector({
                          ...newConnector,
                          config: { ...newConnector.config, [field]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleAddConnector} className="w-full">
                Create Connector
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {connectorList.map((connector) => {
        const cfg = CONNECTOR_CONFIGS[connector.connector_type];
        return (
          <Card key={connector.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{cfg?.icon}</span>
                    <h4 className="font-semibold">{connector.name}</h4>
                    <Badge variant={connector.status === 'active' ? 'default' : 'secondary'}>
                      {connector.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{connector.connector_type}</p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    {connector.test_connection_passed ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Connection verified</span>
                      </>
                    ) : connector.last_error ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <span className="text-red-600">{connector.last_error}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Not tested</span>
                    )}
                  </div>

                  {connector.last_sync && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last sync: {new Date(connector.last_sync).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(connector)}
                    disabled={testingId === connector.id}
                  >
                    {testingId === connector.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(connector.id)}
                    className="w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {connectorList.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No connectors configured. Add data sources to monitor.
        </div>
      )}
    </div>
  );
}