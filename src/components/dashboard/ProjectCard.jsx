import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MoreHorizontal, Database, FileCode, Component, ExternalLink, Copy, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusStyles = {
  draft: 'bg-gray-100 text-gray-600',
  development: 'bg-amber-50 text-amber-600',
  published: 'bg-emerald-50 text-emerald-600',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ProjectCard({ 
  project, 
  onDelete, 
  onDuplicate, 
  onClone, 
  index,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) {
  const stats = project.stats || { pages_count: 0, entities_count: 0, components_count: 0 };
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleCardClick = (e) => {
    if (isSelectionMode) {
      e.preventDefault();
      onToggleSelect?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        to={createPageUrl('EntityDesigner') + `?projectId=${project.id}`}
        className="block group"
        onClick={handleCardClick}
      >
        <div className={cn(
          "bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all duration-200",
          isSelectionMode 
            ? isSelected 
              ? "border-indigo-500 ring-2 ring-indigo-200 shadow-md" 
              : "border-gray-200 dark:border-gray-800 hover:border-indigo-300"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-gray-700 hover:shadow-sm"
        )}>
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <div className="absolute top-3 left-3 z-10">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelect?.();
                }}
                className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center transition-all",
                  isSelected 
                    ? "bg-indigo-600 text-white" 
                    : "bg-white border-2 border-gray-300 hover:border-indigo-400"
                )}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          )}

          {/* Header */}
          <div className={cn("flex items-start justify-between mb-3", isSelectionMode && "ml-7")}>
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: project.color ? `${project.color}15` : '#f3f4f6' }}
              >
                {project.icon || '📁'}
              </div>
              <div>
                <h3 className="font-medium text-[13px] text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {project.name}
                </h3>
                <Badge className={cn("mt-0.5 text-[10px] font-medium", statusStyles[project.status])}>
                  {project.status}
                </Badge>
              </div>
            </div>
            
            {!isSelectionMode && (
              <div className="flex items-center gap-1">
                <FavoriteButton 
                  projectId={project.id}
                  isFavorite={isFavorite(project.id)}
                  onToggle={toggleFavorite}
                  size="sm"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-lg p-1">
                    <DropdownMenuItem className="rounded-md cursor-pointer text-[13px]">
                      <ExternalLink className="w-3.5 h-3.5 mr-2" />
                      Open Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onClone?.(project); }} className="rounded-md cursor-pointer text-[13px]">
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Clone
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDuplicate?.(project); }} className="rounded-md cursor-pointer text-[13px]">
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { e.preventDefault(); onDelete?.(project); }}
                      className="rounded-md cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 text-[13px]"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 min-h-[34px]">
            {project.description || 'No description'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Database className="w-3.5 h-3.5" />
              <span className="text-[11px]">{stats.entities_count}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <FileCode className="w-3.5 h-3.5" />
              <span className="text-[11px]">{stats.pages_count}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Component className="w-3.5 h-3.5" />
              <span className="text-[11px]">{stats.components_count}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}