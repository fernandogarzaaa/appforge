import { useState, useCallback, useEffect } from 'react';

/**
 * Quick Actions Manager
 * Right-click context menu actions
 */
export function useQuickActions() {
  const [contextMenu, setContextMenu] = useState(null);

  const showContextMenu = useCallback((e, actions) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      actions,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const executeAction = useCallback((action) => {
    action.handler();
    hideContextMenu();
  }, [hideContextMenu]);

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => hideContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [hideContextMenu]);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    executeAction,
  };
}

/**
 * Quick Actions for different contexts
 */
export const QUICK_ACTIONS = {
  project: [
    { id: 'edit', label: 'Edit', handler: () => console.log('Edit project') },
    { id: 'duplicate', label: 'Duplicate', handler: () => console.log('Duplicate project') },
    { id: 'clone', label: 'Clone', handler: () => console.log('Clone project') },
    { id: 'export', label: 'Export', handler: () => console.log('Export project') },
    { id: 'settings', label: 'Settings', handler: () => console.log('Settings') },
    { id: 'delete', label: 'Delete', handler: () => console.log('Delete project'), danger: true },
  ],

  entity: [
    { id: 'view-fields', label: 'View Fields', handler: () => console.log('View fields') },
    { id: 'add-field', label: 'Add Field', handler: () => console.log('Add field') },
    { id: 'duplicate', label: 'Duplicate', handler: () => console.log('Duplicate entity') },
    { id: 'export', label: 'Export Schema', handler: () => console.log('Export schema') },
    { id: 'delete', label: 'Delete', handler: () => console.log('Delete entity'), danger: true },
  ],

  file: [
    { id: 'edit', label: 'Edit', handler: () => console.log('Edit file') },
    { id: 'rename', label: 'Rename', handler: () => console.log('Rename file') },
    { id: 'copy', label: 'Copy Path', handler: () => console.log('Copy path') },
    { id: 'move', label: 'Move', handler: () => console.log('Move file') },
    { id: 'delete', label: 'Delete', handler: () => console.log('Delete file'), danger: true },
  ],

  code: [
    { id: 'copy', label: 'Copy Code', handler: () => console.log('Copy code') },
    { id: 'format', label: 'Format', handler: () => console.log('Format code') },
    { id: 'refactor', label: 'Refactor', handler: () => console.log('Refactor code') },
    { id: 'analyze', label: 'Analyze', handler: () => console.log('Analyze code') },
    { id: 'ai-comment', label: 'AI Comment', handler: () => console.log('AI comment') },
  ],

  user: [
    { id: 'view-profile', label: 'View Profile', handler: () => console.log('View profile') },
    { id: 'message', label: 'Send Message', handler: () => console.log('Send message') },
    { id: 'collaborate', label: 'Collaborate', handler: () => console.log('Start collaboration') },
    { id: 'permissions', label: 'Manage Permissions', handler: () => console.log('Manage permissions') },
    { id: 'remove', label: 'Remove', handler: () => console.log('Remove user'), danger: true },
  ],
};
