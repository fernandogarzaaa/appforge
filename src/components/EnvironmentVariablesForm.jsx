import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { validateVariableName, validateVariableValue, ENV_VAR_TYPES, ENVIRONMENT_NAMES } from '@/lib/environmentVariables';

export const EnvironmentVariablesForm = ({
  open,
  onClose,
  onSubmit,
  variable,
  isLoading: _isLoading
}) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState(ENV_VAR_TYPES.STRING);
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState(ENVIRONMENT_NAMES.DEVELOPMENT);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (variable) {
      setName(variable.name);
      setValue(variable.value);
      setType(variable.type);
      setDescription(variable.description);
      setEnvironment(variable.environment);
    } else {
      resetForm();
    }
    setErrors({});
  }, [variable, open]);

  const resetForm = () => {
    setName('');
    setValue('');
    setType(ENV_VAR_TYPES.STRING);
    setDescription('');
    setEnvironment(ENVIRONMENT_NAMES.DEVELOPMENT);
  };

  const validateForm = () => {
    const newErrors = {};

    const nameValidation = validateVariableName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    const valueValidation = validateVariableValue(value, type);
    if (!valueValidation.isValid) {
      newErrors.value = valueValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSubmit({
        id: variable?.id,
        name,
        value,
        type,
        description,
        environment
      });
      resetForm();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {variable ? 'Edit Variable' : 'Add Variable'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="dark:text-gray-300">
              Variable Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value.toUpperCase());
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              placeholder="API_KEY"
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type" className="dark:text-gray-300">
              Type
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value={ENV_VAR_TYPES.STRING}>String</SelectItem>
                <SelectItem value={ENV_VAR_TYPES.NUMBER}>Number</SelectItem>
                <SelectItem value={ENV_VAR_TYPES.BOOLEAN}>Boolean</SelectItem>
                <SelectItem value={ENV_VAR_TYPES.SECRET}>Secret</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          <div>
            <Label htmlFor="value" className="dark:text-gray-300">
              Value
            </Label>
            {type === ENV_VAR_TYPES.BOOLEAN ? (
              <Select value={value.toString()} onValueChange={setValue}>
                <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="value"
                type={type === ENV_VAR_TYPES.SECRET ? 'password' : 'text'}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (errors.value) setErrors(prev => ({ ...prev, value: null }));
                }}
                placeholder="Enter value"
                className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            )}
            {errors.value && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.value}
              </p>
            )}
          </div>

          {/* Environment */}
          <div>
            <Label htmlFor="environment" className="dark:text-gray-300">
              Environment
            </Label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value={ENVIRONMENT_NAMES.DEVELOPMENT}>Development</SelectItem>
                <SelectItem value={ENVIRONMENT_NAMES.STAGING}>Staging</SelectItem>
                <SelectItem value={ENVIRONMENT_NAMES.PRODUCTION}>Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="dark:text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this variable used for?"
              rows={3}
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Type Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-3 text-xs text-blue-900 dark:text-blue-300">
            {type === ENV_VAR_TYPES.SECRET && '🔒 This value will be encrypted at rest'}
            {type === ENV_VAR_TYPES.NUMBER && '🔢 Only numeric values are allowed'}
            {type === ENV_VAR_TYPES.BOOLEAN && '✓ Will be converted to true/false'}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !name || !value}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isSaving ? '...' : variable ? 'Update' : 'Add'} Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnvironmentVariablesForm;
