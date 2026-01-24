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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={createPageUrl('EntityDesigner') + `?projectId=${project.id}`}
        className="block group"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 hover:border-indigo-100 transition-all duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: project.color ? `${project.color}15` : '#f3f4f6' }}
              >
                {project.icon || '📁'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {project.name}
                </h3>
                <Badge className={cn("mt-1 text-xs font-medium", statusStyles[project.status])}>
                  {project.status}
                </Badge>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl p-2">
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDuplicate?.(project); }} className="rounded-lg cursor-pointer">
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.preventDefault(); onDelete?.(project); }}
                  className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">
            {project.description || 'No description'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Database className="w-4 h-4" />
              <span className="text-sm">{stats.entities_count}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <FileCode className="w-4 h-4" />
              <span className="text-sm">{stats.pages_count}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Component className="w-4 h-4" />
              <span className="text-sm">{stats.components_count}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}