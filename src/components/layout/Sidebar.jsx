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
  Plus,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Projects', icon: FolderKanban, page: 'Projects' },
];

const projectNavItems = [
  { name: 'AI Assistant', icon: Sparkles, page: 'AIAssistant' },
  { name: 'Entities', icon: Database, page: 'EntityDesigner' },
  { name: 'Pages', icon: FileCode, page: 'PageEditor' },
];



export default function Sidebar({ currentProject, collapsed, onToggle }) {
  const location = useLocation();
  
  const isActive = (page) => {
    return location.pathname.includes(page.toLowerCase());
  };

  return (
    <aside className={cn(
      "h-screen bg-white/60 backdrop-blur-xl border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-out",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200/50">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-base tracking-tight">AppForge</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100/50"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
              isActive(item.page)
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}

        {currentProject && (
          <>
            <div className={cn("pt-4 pb-1.5", collapsed ? "px-2" : "px-2.5")}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">
                  Project
                </p>
              )}
            </div>
            
            {!collapsed && (
              <div className="mx-2 mb-2 p-2.5 bg-white/60 border border-gray-200/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">{currentProject.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-[13px]">
                      {currentProject.name}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize">
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
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                  isActive(item.page)
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Create Button */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-200/50">
          <Link to={createPageUrl('Projects') + '?new=true'}>
            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-9 text-[13px] font-medium shadow-sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Project
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}