import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnvironmentVariables } from '@/hooks/useEnvironmentVariables';
import { EnvironmentVariablesForm } from '@/components/EnvironmentVariablesForm';
import { EnvironmentVariablesTable } from '@/components/EnvironmentVariablesTable';
import { generateEnvFileContent, ENVIRONMENT_NAMES } from '@/lib/environmentVariables';
import { Plus, Download, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EnvironmentVariables({ projectId = 'proj_default' }) {
  const {
    variables,
    isLoading,
    selectedEnvironment,
    setSelectedEnvironment,
    addVariable,
    updateVariable,
    deleteVariable,
    toggleReveal,
    isRevealed,
    getVariablesByEnvironment,
    duplicateVariable
  } = useEnvironmentVariables(projectId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);

  const currentVariables = getVariablesByEnvironment(selectedEnvironment);
  const secretCount = currentVariables.filter(v => v.type === 'secret').length;

  const handleAddVariable = () => {
    setEditingVariable(null);
    setFormOpen(true);
  };

  const handleEditVariable = (variable) => {
    setEditingVariable(variable);
    setFormOpen(true);
  };

  const handleFormSubmit = (formData) => {
    if (editingVariable) {
      updateVariable(editingVariable.id, formData);
      toast.success('Variable updated');
    } else {
      addVariable({
        ...formData,
        id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      toast.success('Variable added');
    }
  };

  const handleDeleteVariable = (id) => {
    deleteVariable(id);
    toast.success('Variable deleted');
  };

  const handleDuplicateVariable = (id) => {
    duplicateVariable(id);
    toast.success('Variable duplicated');
  };

  const handleExportEnv = () => {
    const content = generateEnvFileContent(currentVariables);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `.env.${selectedEnvironment}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Downloaded .env file');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-1">Environment Variables</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage configuration variables for your project</p>
        </div>
        <Button
          onClick={handleAddVariable}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variable
        </Button>
      </div>

      {/* Environment Selector */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Select Environment</CardTitle>
          <CardDescription className="dark:text-gray-400">Choose which environment to manage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.values(ENVIRONMENT_NAMES).map((env) => (
              <Button
                key={env}
                variant={selectedEnvironment === env ? 'default' : 'outline'}
                onClick={() => setSelectedEnvironment(env)}
                className={`capitalize ${
                  selectedEnvironment === env
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                    : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {env}
                <Badge
                  variant="secondary"
                  className="ml-2 dark:bg-gray-700 dark:text-gray-300"
                >
                  {getVariablesByEnvironment(env).length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      {secretCount > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">Security Notice</h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You have {secretCount} secret variable{secretCount !== 1 ? 's' : ''} in this environment. 
                  Always keep these values secure and never commit them to version control.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Variables</p>
                <p className="text-3xl font-bold dark:text-white">{variables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">In {selectedEnvironment}</p>
                <p className="text-3xl font-bold dark:text-white">{currentVariables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secret Variables
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{secretCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variables Table */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Variables</CardTitle>
              <CardDescription className="dark:text-gray-400">
                {currentVariables.length} variable{currentVariables.length !== 1 ? 's' : ''} in {selectedEnvironment}
              </CardDescription>
            </div>
            {currentVariables.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportEnv}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Export .env
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <EnvironmentVariablesTable
            variables={currentVariables}
            isLoading={isLoading}
            revealedIds={new Set()}
            onToggleReveal={toggleReveal}
            onEdit={handleEditVariable}
            onDelete={handleDeleteVariable}
            onDuplicate={handleDuplicateVariable}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      <EnvironmentVariablesForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        variable={editingVariable}
        isLoading={false}
      />
    </div>
  );
}
