import React from 'react';
import { Key, AlertCircle } from 'lucide-react';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { CreateAPIKeyModal } from '@/components/CreateAPIKeyModal';
import { APIKeysList } from '@/components/APIKeysList';
import { useToast } from '@/components/ui/use-toast';

export default function APIKeysPage() {
  const { keys, createKey, revokeKey } = useAPIKeys();
  const { toast } = useToast();

  const handleCreateKey = async (name, scopes) => {
    try {
      const newKey = await createKey(name, scopes);
      toast({
        title: 'API Key Created',
        description: 'Your new API key has been created successfully.',
      });
      return newKey;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleRevokeKey = async (keyId) => {
    try {
      await revokeKey(keyId);
      toast({
        title: 'API Key Revoked',
        description: 'The API key has been disabled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke API key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              API Keys
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage API keys for programmatic access to AppForge
          </p>
        </div>

        {/* Security Warning */}
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              Keep Your Keys Safe
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Never commit API keys to version control or share them publicly. 
              Treat them like passwords.
            </p>
          </div>
        </div>

        {/* Create Key Button */}
        <div className="mb-6">
          <CreateAPIKeyModal onCreateKey={handleCreateKey} />
        </div>

        {/* Keys List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Your API Keys ({keys.length})
            </h2>
          </div>
          <div className="px-6 py-4">
            <APIKeysList
              keys={keys}
              onRevoke={handleRevokeKey}
              onDelete={handleRevokeKey}
            />
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📚 API Documentation
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            Use your API key to authenticate requests to the AppForge API:
          </p>
          <pre className="p-3 bg-blue-100 dark:bg-blue-900 rounded text-xs text-blue-900 dark:text-blue-100 overflow-x-auto">
{`curl https://api.appforge.fun/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          </pre>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
            See our <a href="/docs/api" className="underline hover:no-underline">API documentation</a> for more examples
          </p>
        </div>
      </div>
    </div>
  );
}
