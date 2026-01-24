import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Database, 
  FileCode, 
  Component, 
  Settings,
  Sparkles,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects' },
];

const projectNavItems = [
  { name: 'Entities', icon: Database, page: 'EntityDesigner' },
  { name: 'Pages', icon: FileCode, page: 'PageEditor' },
  { name: 'Components', icon: Component, page: 'Components' },
  { name: 'AI Assistant', icon: Sparkles, page: 'AIAssistant' },
  { name: 'Settings', icon: Settings, page: 'ProjectSettings' },
];

export default function Sidebar({ currentProject, collapsed, onToggle }) {
  const location = useLocation();
  
  const isActive = (page) => {
    return location.pathname.includes(page.toLowerCase());
  };

  return (
    <aside className={cn(
      "h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">AppForge</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-gray-400 hover:text-gray-600"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive(item.page)
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}

        {currentProject && (
          <>
            <div className={cn("pt-6 pb-2", collapsed ? "px-2" : "px-3")}>
              {!collapsed && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Current Project
                </p>
              )}
            </div>
            
            {!collapsed && (
              <div className="mx-2 mb-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentProject.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {currentProject.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {currentProject.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {projectNavItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page) + `?projectId=${currentProject.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive(item.page)
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Create Button */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-50">
          <Link to={createPageUrl('Projects') + '?new=true'}>
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl h-11 shadow-lg shadow-indigo-500/25">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}