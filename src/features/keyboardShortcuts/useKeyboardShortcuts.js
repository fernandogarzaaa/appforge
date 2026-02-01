import { useEffect, useState } from 'react';

/**
 * Keyboard Shortcuts Management Hook
 * Manage custom keyboard shortcuts with presets
 * Persists to backend API instead of localStorage
 */
export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState(getDefaultShortcuts());
  const [preset, setPreset] = useState('default');
  const [isLoading, setIsLoading] = useState(true);

  // Load shortcuts from backend on mount
  useEffect(() => {
    loadKeyboardShortcuts();
  }, []);

  const loadKeyboardShortcuts = async () => {
    try {
      const response = await fetch('/api/user/keyboard-shortcuts', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setShortcuts(data.shortcuts || getDefaultShortcuts());
        setPreset(data.preset || 'default');
      }
    } catch (error) {
      console.error('Failed to load keyboard shortcuts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveKeyboardShortcuts = async (newShortcuts, newPreset) => {
    try {
      await fetch('/api/user/keyboard-shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shortcuts: newShortcuts,
          preset: newPreset
        })
      });
    } catch (error) {
      console.error('Failed to save keyboard shortcuts:', error);
    }
  };

  const updateShortcut = (id, keys) => {
    const updated = { ...shortcuts, [id]: keys };
    setShortcuts(updated);
    saveKeyboardShortcuts(updated, preset);
  };

  const applyPreset = (presetName) => {
    const presets = {
      default: getDefaultShortcuts(),
      vscode: getVSCodeShortcuts(),
      vim: getVimShortcuts(),
      emacs: getEmacsShortcuts(),
    };
    
    if (presets[presetName]) {
      setShortcuts(presets[presetName]);
      setPreset(presetName);
      saveKeyboardShortcuts(presets[presetName], presetName);
    }
  };

  const resetToDefault = () => {
    const defaults = getDefaultShortcuts();
    setShortcuts(defaults);
    setPreset('default');
    saveKeyboardShortcuts(defaults, 'default');
  };

  return {
    shortcuts,
    updateShortcut,
    preset,
    applyPreset,
    resetToDefault,
    availablePresets: ['default', 'vscode', 'vim', 'emacs'],
  };
}

function getDefaultShortcuts() {
  return {
    'cmd-palette': 'Cmd+K',
    'save': 'Cmd+S',
    'search': 'Cmd+F',
    'replace': 'Cmd+H',
    'new-file': 'Cmd+N',
    'open-file': 'Cmd+O',
    'close-file': 'Cmd+W',
    'go-to-line': 'Cmd+G',
    'go-to-definition': 'Cmd+Click',
    'find-references': 'Cmd+Shift+F',
    'rename-symbol': 'Cmd+R',
    'format-document': 'Cmd+Shift+I',
    'comment-line': 'Cmd+/',
    'delete-line': 'Cmd+Shift+K',
    'expand-selection': 'Ctrl+Shift+Right',
    'shrink-selection': 'Ctrl+Shift+Left',
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Shift+Z',
    'prev-editor': 'Ctrl+Shift+Tab',
    'next-editor': 'Ctrl+Tab',
  };
}

function getVSCodeShortcuts() {
  return {
    'cmd-palette': 'Cmd+Shift+P',
    'save': 'Cmd+S',
    'search': 'Cmd+F',
    'replace': 'Cmd+H',
    'new-file': 'Cmd+N',
    'open-file': 'Cmd+O',
    'close-file': 'Cmd+W',
    'go-to-line': 'Cmd+G',
    'go-to-definition': 'F12',
    'find-references': 'Shift+F12',
    'rename-symbol': 'F2',
    'format-document': 'Shift+Alt+F',
    'comment-line': 'Cmd+/',
    'delete-line': 'Cmd+Shift+K',
    'expand-selection': 'Shift+Alt+Right',
    'shrink-selection': 'Shift+Alt+Left',
    'undo': 'Cmd+Z',
    'redo': 'Cmd+Y',
    'prev-editor': 'Ctrl+Shift+Tab',
    'next-editor': 'Ctrl+Tab',
  };
}

function getVimShortcuts() {
  return {
    'cmd-palette': ':',
    'save': ':w',
    'search': '/',
    'replace': ':%s',
    'new-file': ':e',
    'open-file': ':o',
    'close-file': ':q',
    'go-to-line': ':123',
    'go-to-definition': 'gd',
    'find-references': 'gr',
    'rename-symbol': 'cw',
    'format-document': '=',
    'comment-line': 'gc',
    'delete-line': 'dd',
    'expand-selection': 'V',
    'shrink-selection': 'v',
    'undo': 'u',
    'redo': 'Ctrl+R',
    'prev-editor': 'gT',
    'next-editor': 'gt',
  };
}

function getEmacsShortcuts() {
  return {
    'cmd-palette': 'Ctrl+X Ctrl+F',
    'save': 'Ctrl+X Ctrl+S',
    'search': 'Ctrl+S',
    'replace': 'Ctrl+H',
    'new-file': 'Ctrl+X Ctrl+N',
    'open-file': 'Ctrl+X Ctrl+O',
    'close-file': 'Ctrl+X Ctrl+W',
    'go-to-line': 'Ctrl+G',
    'go-to-definition': 'Ctrl+.',
    'find-references': 'Ctrl+?',
    'rename-symbol': 'Ctrl+R',
    'format-document': 'Ctrl+M',
    'comment-line': 'Ctrl+;',
    'delete-line': 'Ctrl+K',
    'expand-selection': 'Shift+Ctrl+Right',
    'shrink-selection': 'Shift+Ctrl+Left',
    'undo': 'Ctrl+/',
    'redo': 'Ctrl+_',
    'prev-editor': 'Ctrl+X Left',
    'next-editor': 'Ctrl+X Right',
  };
}
