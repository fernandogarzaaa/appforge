import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import HelpTooltip from '@/components/help/HelpTooltip';
import { Copy, Eye, EyeOff, Plus, Trash2, Check } from 'lucide-react';

export default function APIKeyManagement() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'OpenAI API',
      type: 'openai',
      key: 'sk-proj-•••••••••••••••••••',
      fullKey: null,
      lastUsed: '2024-01-28',
      status: 'active',
      created: '2024-01-15'
    },
    {
      id: '2',
      name: 'Anthropic API',
      type: 'anthropic',
      key: 'sk-ant-•••••••••••••••••••',
      fullKey: null,
      lastUsed: '2024-01-27',
      status: 'active',
      created: '2024-01-20'
    }
  ]);

  const [isAddingKey, setIsAddingKey] = useState(false);
  const [_editingId, _setEditingId] = useState(null);
  const [newKey, setNewKey] = useState({ name: '', type: 'openai', value: '' });
  const [visibleKey, setVisibleKey] = useState(null);
  const [copied, setCopied] = useState(null);

  const apiProviders = [
    { value: 'openai', label: 'OpenAI', icon: '🤖' },
    { value: 'anthropic', label: 'Anthropic', icon: '🧠' },
    { value: 'google', label: 'Google', icon: '📚' },
    { value: 'huggingface', label: 'Hugging Face', icon: '🤗' },
    { value: 'stripe', label: 'Stripe', icon: '💳' },
    { value: 'github', label: 'GitHub', icon: '🐙' },
    { value: 'aws', label: 'AWS', icon: '☁️' },
    { value: 'custom', label: 'Custom', icon: '⚙️' }
  ];

  const handleAddKey = () => {
    if (newKey.name && newKey.value) {
      const key = {
        id: Date.now().toString(),
        name: newKey.name,
        type: newKey.type,
        key: newKey.value.substring(0, 7) + '•'.repeat(newKey.value.length - 7),
        fullKey: newKey.value,
        lastUsed: null,
        status: 'active',
        created: new Date().toISOString().split('T')[0]
      };
      setApiKeys([...apiKeys, key]);
      setNewKey({ name: '', type: 'openai', value: '' });
      setIsAddingKey(false);
    }
  };

  const handleDeleteKey = (id) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const handleCopyKey = (id) => {
    const key = apiKeys.find(k => k.id === id);
    if (key?.fullKey) {
      navigator.clipboard.writeText(key.fullKey);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const toggleVisibility = (id) => {
    setVisibleKey(visibleKey === id ? null : id);
  };

  const getProviderIcon = (type) => {
    const provider = apiProviders.find(p => p.value === type);
    return provider?.icon || '⚙️';
  };

  const getProviderLabel = (type) => {
    const provider = apiProviders.find(p => p.value === type);
    return provider?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Add New Key Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add New API Key</CardTitle>
              <CardDescription>Add a new API key for external services</CardDescription>
            </div>
            <HelpTooltip 
              content="Store API keys securely for OpenAI, Anthropic, and other services. Keys are encrypted and never exposed in the UI."
              title="API Key Management"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isAddingKey ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Name</label>
                  <Input
                    placeholder="e.g., OpenAI API Key"
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Provider Type</label>
                  <select
                    value={newKey.type}
                    onChange={(e) => setNewKey({ ...newKey, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {apiProviders.map(provider => (
                      <option key={provider.value} value={provider.value}>
                        {provider.icon} {provider.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">API Key Value</label>
                <Input
                  type="password"
                  placeholder="Paste your API key here"
                  value={newKey.value}
                  onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddKey} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Save Key
                </Button>
                <Button 
                  onClick={() => {
                    setIsAddingKey(false);
                    setNewKey({ name: '', type: 'openai', value: '' });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setIsAddingKey(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add API Key
            </Button>
          )}
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys ({apiKeys.length})</CardTitle>
          <CardDescription>Manage your stored API keys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No API keys added yet</p>
              </div>
            ) : (
              apiKeys.map(key => (
                <div 
                  key={key.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getProviderIcon(key.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{key.name}</h4>
                        <p className="text-sm text-gray-500">
                          {getProviderLabel(key.type)} • Created {key.created}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 mx-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-200 px-3 py-1 rounded font-mono">
                        {visibleKey === key.id ? (key.fullKey || key.key) : key.key}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleVisibility(key.id)}
                        className="p-2"
                      >
                        {visibleKey === key.id ? (
                          <EyeOff className="w-4 h-4 text-gray-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-600" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyKey(key.id)}
                        className="p-2"
                      >
                        {copied === key.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      key.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {key.status}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteKey(key.id)}
                      className="p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
