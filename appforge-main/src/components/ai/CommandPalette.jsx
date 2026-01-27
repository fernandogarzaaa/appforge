import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Search, Sparkles, Globe, Brain, Wand2, Github, 
  Workflow, Shield, FileText, Smartphone, Code, Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const commands = [
  { id: 'api', label: 'API Discovery', icon: Globe, panel: 'api', description: 'Find and integrate APIs' },
  { id: 'models', label: 'Predictive Models', icon: Brain, panel: 'models', description: 'Run AI predictions' },
  { id: 'functions', label: 'AI Functions', icon: Wand2, panel: 'functions', description: 'Image gen, translation' },
  { id: 'github', label: 'GitHub', icon: Github, panel: 'github', description: 'Sync with repository' },
  { id: 'automations', label: 'Workflows', icon: Workflow, panel: 'automations', description: 'Build automations' },
  { id: 'codereview', label: 'Code Review', icon: Shield, panel: 'codereview', description: 'AI code feedback' },
  { id: 'docs', label: 'Documents', icon: FileText, panel: 'docs', description: 'Upload project docs' },
  { id: 'mobile', label: 'Mobile Apps', icon: Smartphone, panel: 'mobile', description: 'Build mobile apps' },
  { id: 'snippets', label: 'Code Snippets', icon: Code, panel: 'snippets', description: 'Save & search snippets' },
  { id: 'auditor', label: 'Project Auditor', icon: Zap, panel: 'auditor', description: 'Error detection' },
  { id: 'advanced', label: 'Advanced Tools', icon: Code, panel: 'advanced', description: 'Refactor & optimize' },
];

export default function CommandPalette({ isOpen, onClose, onSelectPanel }) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (command) => {
    onSelectPanel(command.panel);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools and features..."
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No commands found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, idx) => (
                <button
                  key={command.id}
                  onClick={() => handleSelect(command)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    idx === selectedIndex
                      ? "bg-indigo-50 border-indigo-200 border"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    idx === selectedIndex ? "bg-indigo-100" : "bg-gray-100"
                  )}>
                    <command.icon className={cn(
                      "w-5 h-5",
                      idx === selectedIndex ? "text-indigo-600" : "text-gray-600"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{command.label}</div>
                    <div className="text-sm text-gray-500">{command.description}</div>
                  </div>
                  {idx === selectedIndex && (
                    <div className="text-xs text-gray-400">↵</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-white border rounded">⌘</kbd>
            <kbd className="px-2 py-0.5 bg-white border rounded">K</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}