import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fieldTypes = [
  { value: 'string', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Boolean', icon: '✓' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'array', label: 'Array', icon: '📋' },
  { value: 'object', label: 'Object', icon: '📦' },
  { value: 'reference', label: 'Reference', icon: '🔗' },
];

export default function FieldEditor({ field, onChange, onDelete, entities, dragHandleProps }) {
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (key, value) => {
    onChange({ ...field, [key]: value });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-4">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 grid grid-cols-12 gap-3 items-center">
          <div className="col-span-4">
            <Input
              value={field.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Field name"
              className="h-10 rounded-lg border-gray-200"
            />
          </div>

          <div className="col-span-3">
            <Select value={field.type || 'string'} onValueChange={(v) => handleChange('type', v)}>
              <SelectTrigger className="h-10 rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <Switch
              checked={field.required || false}
              onCheckedChange={(v) => handleChange('required', v)}
            />
            <Label className="text-sm text-gray-600">Required</Label>
          </div>

          <div className="col-span-3 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Options */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50/50 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
                  <Input
                    value={field.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Field description"
                    className="h-10 rounded-lg border-gray-200"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Default Value</Label>
                  <Input
                    value={field.default_value || ''}
                    onChange={(e) => handleChange('default_value', e.target.value)}
                    placeholder="Default value"
                    className="h-10 rounded-lg border-gray-200"
                  />
                </div>
              </div>

              {field.type === 'string' && (
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">
                    Enum Values (comma-separated)
                  </Label>
                  <Input
                    value={field.enum_values?.join(', ') || ''}
                    onChange={(e) => handleChange('enum_values', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
                    placeholder="option1, option2, option3"
                    className="h-10 rounded-lg border-gray-200"
                  />
                </div>
              )}

              {field.type === 'reference' && (
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Reference Entity</Label>
                  <Select 
                    value={field.reference_entity || ''} 
                    onValueChange={(v) => handleChange('reference_entity', v)}
                  >
                    <SelectTrigger className="h-10 rounded-lg border-gray-200">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities?.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}