import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Command Palette Hook
 * Provides searchable command execution with keyboard shortcuts
 */
export function useCommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define all available commands
  const commands = [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', category: 'Navigation', fn: () => navigate('/dashboard') },
    { id: 'nav-projects', label: 'Go to Projects', category: 'Navigation', fn: () => navigate('/projects') },
    { id: 'nav-settings', label: 'Go to Settings', category: 'Navigation', fn: () => navigate('/settings') },
    { id: 'nav-analytics', label: 'Go to Analytics', category: 'Navigation', fn: () => navigate('/analytics') },
    { id: 'nav-integrations', label: 'Go to Integrations', category: 'Navigation', fn: () => navigate('/integrations') },
    { id: 'nav-team', label: 'Go to Team', category: 'Navigation', fn: () => navigate('/team') },
    
    // Project Actions
    { id: 'action-new-project', label: 'Create New Project', category: 'Projects', fn: () => setIsOpen(false), tags: ['create', 'new'] },
    { id: 'action-search-projects', label: 'Search Projects', category: 'Projects', fn: () => navigate('/projects?search=true') },
    { id: 'action-recent-projects', label: 'Recent Projects', category: 'Projects', fn: () => navigate('/projects?filter=recent') },
    
    // Development
    { id: 'dev-local-sync', label: 'Sync with Local Development', category: 'Development', fn: () => setIsOpen(false), tags: ['sync'] },
    { id: 'dev-run-tests', label: 'Run Tests', category: 'Development', fn: () => setIsOpen(false), tags: ['test'] },
    { id: 'dev-build', label: 'Build Project', category: 'Development', fn: () => setIsOpen(false), tags: ['build'] },
    { id: 'dev-deploy', label: 'Deploy', category: 'Development', fn: () => setIsOpen(false), tags: ['deploy'] },
    
    // Tools
    { id: 'tool-keyboard-shortcuts', label: 'Keyboard Shortcuts', category: 'Tools', fn: () => setIsOpen(false), tags: ['help'] },
    { id: 'tool-themes', label: 'Change Theme', category: 'Tools', fn: () => setIsOpen(false), tags: ['theme'] },
    { id: 'tool-export', label: 'Export Report', category: 'Tools', fn: () => setIsOpen(false), tags: ['export'] },
    { id: 'tool-documentation', label: 'View Documentation', category: 'Tools', fn: () => window.open('/docs', '_blank'), tags: ['help', 'docs'] },
    
    // Account
    { id: 'account-profile', label: 'Edit Profile', category: 'Account', fn: () => navigate('/profile') },
    { id: 'account-logout', label: 'Logout', category: 'Account', fn: () => setIsOpen(false), tags: ['exit'] },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    const query = searchQuery.toLowerCase();
    return cmd.label.toLowerCase().includes(query) || 
           cmd.category.toLowerCase().includes(query) ||
           (cmd.tags && cmd.tags.some(tag => tag.includes(query)));
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to open palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearchQuery('');
        setSelectedIndex(0);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      
      // Arrow keys for navigation
      if (isOpen && e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      }
      
      if (isOpen && e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
      }
      
      // Enter to execute
      if (isOpen && e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].fn();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  const executeCommand = useCallback((command) => {
    command.fn();
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  return {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    filteredCommands,
    selectedIndex,
    setSelectedIndex,
    executeCommand,
    allCommands: commands,
  };
}
