import React, { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_SCOPES } from '@/lib/apiKeyUtils';

export function CreateAPIKeyModal({ onCreateKey }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState(
    DEFAULT_SCOPES.filter(s => s.checked).map(s => s.id)
  );
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!keyName.trim()) return;

    setIsLoading(true);
    try {
      const newKey = await onCreateKey(keyName, selectedScopes);
      setCreatedKey(newKey);
      setKeyName('');
      setSelectedScopes(DEFAULT_SCOPES.filter(s => s.checked).map(s => s.id));
    } finally {
      setIsLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedKey(null);
    setCopied(false);
  };

  const toggleScope = (scopeId) => {
    setSelectedScopes(prev =>
      prev.includes(scopeId)
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Create New Key</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key for programmatic access
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          // Success State
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                <CheckCircle className="w-4 h-4" />
                API Key Created Successfully
              </div>
              <p className="text-xs text-green-800 dark:text-green-200 mb-3">
                Save this key somewhere safe. You won't be able to see it again!
              </p>
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded font-mono text-sm break-all">
                <code className="flex-1 text-gray-900 dark:text-gray-100">
                  {createdKey.key}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={copyKey}
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Create Form
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                Key Name
              </label>
              <Input
                placeholder="e.g., My CI/CD Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Give your key a descriptive name
              </p>
            </div>

            {/* Scopes */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {DEFAULT_SCOPES.map(scope => (
                  <div key={scope.id} className="flex items-center gap-2">
                    <Checkbox
                      id={scope.id}
                      checked={selectedScopes.includes(scope.id)}
                      onCheckedChange={() => toggleScope(scope.id)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={scope.id}
                      className="text-sm cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      {scope.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select the minimum permissions needed
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!keyName.trim() || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Key'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
