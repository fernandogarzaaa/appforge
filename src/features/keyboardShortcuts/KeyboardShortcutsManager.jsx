import React from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Keyboard Shortcuts Manager Component
 */
export function KeyboardShortcutsManager() {
  const {
    shortcuts,
    updateShortcut,
    preset,
    applyPreset,
    resetToDefault,
    availablePresets,
  } = useKeyboardShortcuts();

  const [editingId, setEditingId] = React.useState(null);
  const [tempValue, setTempValue] = React.useState('');

  const handleEditClick = (id, value) => {
    setEditingId(id);
    setTempValue(value);
  };

  const handleSave = (id) => {
    if (tempValue.trim()) {
      updateShortcut(id, tempValue);
    }
    setEditingId(null);
  };

  const shortcutGroups = {
    'Navigation': ['cmd-palette', 'search', 'go-to-line', 'go-to-definition'],
    'Editing': ['save', 'new-file', 'open-file', 'close-file', 'delete-line', 'format-document'],
    'Selection': ['expand-selection', 'shrink-selection', 'comment-line'],
    'History': ['undo', 'redo'],
    'Tabs': ['prev-editor', 'next-editor'],
  };

  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg mb-4">Keyboard Shortcut Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {availablePresets.map(p => (
            <Button
              key={p}
              onClick={() => applyPreset(p)}
              variant={preset === p ? 'default' : 'outline'}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
        <Button
          onClick={resetToDefault}
          variant="outline"
          className="mt-4 w-full"
        >
          Reset to Default
        </Button>
      </div>

      {/* Shortcuts Editor */}
      {Object.entries(shortcutGroups).map(([group, ids]) => (
        <div key={group} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4">{group}</h3>
          <div className="space-y-2">
            {ids.map(id => (
              <div key={id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                  {id.replace(/-/g, ' ').toUpperCase()}
                </label>
                {editingId === id ? (
                  <div className="flex gap-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="e.g., Cmd+K"
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleSave(id)}
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingId(null)}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(id, shortcuts[id])}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {shortcuts[id] || 'Not set'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
