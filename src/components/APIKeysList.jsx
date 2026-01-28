import React, { useState } from 'react';
import { Copy, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDate, maskAPIKey, isKeyExpiringSoon } from '@/lib/apiKeyUtils';

export function APIKeysList({ keys, onRevoke, onDelete: _onDelete }) {
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  const toggleReveal = (keyId) => {
    setRevealedKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (key, keyId) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (keys.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No API keys yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map(key => {
        const isExpiring = isKeyExpiringSoon(key.createdAt);
        const isRevealed = revealedKeys[key.id];

        return (
          <div
            key={key.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Key Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {key.name}
                  </h3>
                  {isExpiring && (
                    <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      90+ days old
                    </Badge>
                  )}
                </div>

                {/* Key Display */}
                <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono text-sm">
                  <code className="flex-1 break-all text-gray-600 dark:text-gray-400">
                    {isRevealed ? key.key : maskAPIKey(key.key)}
                  </code>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleReveal(key.id)}
                      title={isRevealed ? 'Hide' : 'Show'}
                    >
                      {isRevealed ? (
                        <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(key.key, key.id)}
                      title="Copy to clipboard"
                    >
                      {copiedKey === key.id ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(key.createdAt)}
                  </div>
                  <div>
                    <span className="font-medium">Last Used:</span>{' '}
                    {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                  </div>
                </div>

                {/* Scopes */}
                {key.scopes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {key.scopes.map(scope => (
                      <Badge
                        key={scope}
                        variant="secondary"
                        className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      >
                        {scope}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                      Revoke
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately disable this API key. Any applications using it will stop working.
                      This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="flex gap-3 justify-end">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRevoke(key.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Revoke Key
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
