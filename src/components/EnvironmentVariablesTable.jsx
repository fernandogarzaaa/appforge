import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/dialog';
import { maskValue, ENV_VAR_TYPES } from '@/lib/environmentVariables';
import { Eye, EyeOff, Copy, Edit, Trash2, Copy as CopyIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const EnvironmentVariablesTable = ({
  variables,
  isLoading,
  revealedIds,
  onToggleReveal,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  const handleCopy = (value, name) => {
    navigator.clipboard.writeText(value);
    toast.success(`Copied ${name}`);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case ENV_VAR_TYPES.SECRET:
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      case ENV_VAR_TYPES.NUMBER:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case ENV_VAR_TYPES.BOOLEAN:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variables.length === 0) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-4xl mb-4">🔐</p>
              <h3 className="text-lg font-semibold dark:text-white mb-1">No Variables</h3>
              <p className="text-gray-500 dark:text-gray-400">Add environment variables to get started</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {variables.map((variable, index) => (
          <motion.div
            key={variable.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 border-b border-gray-200 dark:border-gray-800 last:border-b-0 ${
              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950/50'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Name & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="font-mono text-sm font-semibold dark:text-white">
                    {variable.name}
                  </code>
                  <Badge className={`text-xs ${getTypeColor(variable.type)}`}>
                    {variable.type}
                  </Badge>
                </div>
                {variable.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{variable.description}</p>
                )}
              </div>

              {/* Value Display */}
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs text-gray-700 dark:text-gray-300">
                  {revealedIds.has(variable.id) ? variable.value : maskValue(variable.value, variable.type)}
                </code>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Reveal Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleReveal(variable.id)}
                  title={revealedIds.has(variable.id) ? 'Hide' : 'Show'}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {revealedIds.has(variable.id) ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>

                {/* Copy Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(variable.value, variable.name)}
                  title="Copy value"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>

                {/* Duplicate Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDuplicate(variable.id)}
                  title="Duplicate"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <CopyIcon className="w-4 h-4" />
                </Button>

                {/* Edit Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(variable)}
                  title="Edit"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                {/* Delete Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteConfirm(variable)}
                  title="Delete"
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">Delete Variable?</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                Are you sure you want to delete <span className="font-mono font-semibold">{deleteConfirm.name}</span>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDelete(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default EnvironmentVariablesTable;
