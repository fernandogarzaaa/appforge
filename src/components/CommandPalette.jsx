import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, ArrowRight, Command } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);

  const commands = [
    { id: 1, label: 'Dashboard', category: 'Navigation', action: () => window.location.href = createPageUrl('Dashboard') },
    { id: 2, label: 'Projects', category: 'Navigation', action: () => window.location.href = createPageUrl('Projects') },
    { id: 3, label: 'Entity Designer', category: 'Navigation', action: () => window.location.href = createPageUrl('EntityDesigner') },
    { id: 4, label: 'Page Editor', category: 'Navigation', action: () => window.location.href = createPageUrl('PageEditor') },
    { id: 5, label: 'API Management', category: 'Navigation', action: () => window.location.href = createPageUrl('APIManagement') },
    { id: 6, label: 'Webhook Monitor', category: 'Navigation', action: () => window.location.href = createPageUrl('WebhookMonitor') },
    { id: 7, label: 'Settings', category: 'Navigation', action: () => window.location.href = createPageUrl('Settings') },
    { id: 8, label: 'Code Generator', category: 'Development', action: () => window.location.href = createPageUrl('CodeGenerator') },
    { id: 9, label: 'Deployments', category: 'Development', action: () => window.location.href = createPageUrl('Deployments') },
    { id: 10, label: 'Collaboration', category: 'Team', action: () => window.location.href = createPageUrl('Collaboration') },
  ];

  const filtered = search
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [search]);

  const handleSelect = () => {
    filtered[selected]?.action();
    setOpen(false);
  };

  const groupedCommands = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <div className="bg-white dark:bg-gray-900 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center border-b dark:border-gray-700 px-4 py-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                autoFocus
                placeholder="Search commands..."
                className="flex-1 ml-3 bg-transparent outline-none text-sm placeholder-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelected(Math.min(selected + 1, filtered.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelected(Math.max(selected - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSelect();
                  }
                }}
              />
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No commands found
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {category}
                    </div>
                    {cmds.map((cmd, idx) => {
                      const globalIdx = filtered.indexOf(cmd);
                      const isSelected = globalIdx === selected;
                      return (
                        <motion.button
                          key={cmd.id}
                          onClick={handleSelect}
                          onMouseEnter={() => setSelected(globalIdx)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{cmd.label}</span>
                            {isSelected && <ArrowRight className="w-4 h-4" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Press ESC to close</span>
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3" /> K
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
      >
        <Search className="w-4 h-4" />
        <span className="hidden lg:inline text-gray-500">Search commands...</span>
        <kbd className="hidden lg:inline ml-auto text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </button>
    </>
  );
}