import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function TriggerConfiguration({ triggerType, config, onChange }) {
  const handleConfigChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm">Trigger Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {triggerType === 'schedule' && (
          <>
            <div>
              <Label className="text-sm">Frequency</Label>
              <Select defaultValue={config.frequency || 'daily'}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom Cron</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Time</Label>
              <Input
                type="time"
                value={config.time || '09:00'}
                onChange={(e) => handleConfigChange('time', e.target.value)}
                className="mt-1"
              />
            </div>
          </>
        )}

        {triggerType === 'webhook' && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800">
                Webhook URL will be generated after bot creation
              </div>
            </div>
            <div>
              <Label className="text-sm">Allowed Methods</Label>
              <div className="flex gap-2 mt-2">
                {['GET', 'POST', 'PUT'].map((method) => (
                  <Badge
                    key={method}
                    variant={config.methods?.includes(method) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const methods = config.methods || ['POST'];
                      handleConfigChange(
                        'methods',
                        methods.includes(method)
                          ? methods.filter(m => m !== method)
                          : [...methods, method]
                      );
                    }}
                  >
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Require API Key</Label>
              <Select defaultValue={config.requireApiKey ? 'yes' : 'no'}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {triggerType === 'email' && (
          <>
            <div>
              <Label className="text-sm">Monitor Email Address</Label>
              <Input
                type="email"
                value={config.emailAddress || ''}
                onChange={(e) => handleConfigChange('emailAddress', e.target.value)}
                placeholder="bot@company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Trigger on</Label>
              <Select defaultValue={config.trigger || 'received'}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Email Received</SelectItem>
                  <SelectItem value="subject_contains">Subject Contains</SelectItem>
                  <SelectItem value="from_address">From Address</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.trigger === 'subject_contains' && (
              <div>
                <Label className="text-sm">Subject Keywords</Label>
                <Input
                  value={config.keywords || ''}
                  onChange={(e) => handleConfigChange('keywords', e.target.value)}
                  placeholder="urgent, approval, etc"
                  className="mt-1"
                />
              </div>
            )}
          </>
        )}

        {triggerType === 'entity_change' && (
          <>
            <div>
              <Label className="text-sm">Entity to Monitor</Label>
              <Input
                value={config.entityName || ''}
                onChange={(e) => handleConfigChange('entityName', e.target.value)}
                placeholder="e.g., Order, User, Product"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Trigger on</Label>
              <Select defaultValue={config.event || 'create'}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Created</SelectItem>
                  <SelectItem value="update">Updated</SelectItem>
                  <SelectItem value="delete">Deleted</SelectItem>
                  <SelectItem value="any">Any Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Field Changes (Optional)</Label>
              <Input
                value={config.fields || ''}
                onChange={(e) => handleConfigChange('fields', e.target.value)}
                placeholder="Comma-separated field names (leave empty for any)"
                className="mt-1"
              />
            </div>
          </>
        )}

        {triggerType === 'api_endpoint' && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm font-semibold text-green-900 mb-2">External Webhook Setup</div>
              <div className="text-xs text-green-800 space-y-1">
                <p>• Send POST requests to trigger this bot</p>
                <p>• Webhook URL will be provided after creation</p>
                <p>• Configure authentication method below</p>
              </div>
            </div>
            <div>
              <Label className="text-sm">Authentication Type</Label>
              <Select defaultValue={config.authType || 'none'}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Authentication</SelectItem>
                  <SelectItem value="api_key">API Key (Header)</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Accepted Payload Format</Label>
              <Select defaultValue={config.payloadFormat || 'json'}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="form">Form Data</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Expected Payload (JSON Schema)</Label>
              <Textarea
                value={config.payloadSchema || ''}
                onChange={(e) => handleConfigChange('payloadSchema', e.target.value)}
                placeholder='{"property1": "string", "property2": "number"}'
                rows={3}
                className="mt-1 text-xs font-mono"
              />
            </div>
          </>
        )}

        {triggerType === 'database_change' && (
          <>
            <div>
              <Label className="text-sm">Database Entity</Label>
              <Input
                value={config.entity || ''}
                onChange={(e) => handleConfigChange('entity', e.target.value)}
                placeholder="e.g., users, orders, products"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Trigger Event</Label>
              <Select defaultValue={config.event || 'insert'}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insert">Record Created</SelectItem>
                  <SelectItem value="update">Record Updated</SelectItem>
                  <SelectItem value="delete">Record Deleted</SelectItem>
                  <SelectItem value="all">Any Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Conditions (Optional)</Label>
              <Textarea
                value={config.conditions || ''}
                onChange={(e) => handleConfigChange('conditions', e.target.value)}
                placeholder="e.g., status = 'active' AND amount > 1000"
                rows={2}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-sm">Debounce (seconds)</Label>
              <Input
                type="number"
                min="0"
                value={config.debounce || '0'}
                onChange={(e) => handleConfigChange('debounce', e.target.value)}
                placeholder="Prevent triggering multiple times quickly"
                className="mt-1"
              />
            </div>
          </>
        )}

        {triggerType === 'file_upload' && (
          <>
            <div>
              <Label className="text-sm">Upload Directory/Bucket</Label>
              <Input
                value={config.directory || ''}
                onChange={(e) => handleConfigChange('directory', e.target.value)}
                placeholder="/uploads, s3-bucket-name, etc"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">File Types (optional)</Label>
              <Input
                value={config.fileTypes || ''}
                onChange={(e) => handleConfigChange('fileTypes', e.target.value)}
                placeholder=".pdf, .jpg, .png (leave empty for all)"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Maximum File Size (MB)</Label>
              <Input
                type="number"
                min="1"
                value={config.maxSize || '100'}
                onChange={(e) => handleConfigChange('maxSize', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">File Name Pattern (regex)</Label>
              <Input
                value={config.filePattern || ''}
                onChange={(e) => handleConfigChange('filePattern', e.target.value)}
                placeholder=".*\.pdf$ (leave empty to match all)"
                className="mt-1"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}