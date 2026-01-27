import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MoreHorizontal, Database, FileCode, Component, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function ProjectCard({ project, onDelete, onDuplicate, index }) {
  const stats = project.stats || { pages_count: 0, entities_count: 0, components_count: 0 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        to={createPageUrl('EntityDesigner') + `?projectId=${project.id}`}
        className="block group"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-900 hover:shadow-sm transition-all duration-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: project.color ? `${project.color}15` : '#f3f4f6' }}
              >
                {project.icon || '📁'}
              </div>
              <div>
                <h3 className="font-medium text-[13px] text-gray-900 group-hover:text-gray-700 transition-colors">
                  {project.name}
                </h3>
                <Badge className={cn("mt-0.5 text-[10px] font-medium", statusStyles[project.status])}>
                  {project.status}
                </Badge>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg p-1">
                <DropdownMenuItem className="rounded-md cursor-pointer text-[13px]">
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Open Preview
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

          {/* Description */}
          <p className="text-[13px] text-gray-500 line-clamp-2 mb-3 min-h-[34px]">
            {project.description || 'No description'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-gray-500">
              <Database className="w-3.5 h-3.5" />
              <span className="text-[11px]">{stats.entities_count}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <FileCode className="w-3.5 h-3.5" />
              <span className="text-[11px]">{stats.pages_count}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Component className="w-3.5 h-3.5" />
              <span className="text-[11px]">{stats.components_count}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}