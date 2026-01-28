/**
 * ProjectList component with favorites support
 * Displays projects sorted with favorites first
 */
import React from 'react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { favoritesStorage } from '@/lib/favorites';

export function ProjectListWithFavorites({ 
  projects, 
  onDelete, 
  onDuplicate,
  showFavoritesOnly = false 
}) {
  let displayProjects = projects;

  // Filter to only favorites if requested
  if (showFavoritesOnly) {
    displayProjects = favoritesStorage.getFavoriteProjects(projects);
  } else {
    // Sort with favorites first
    displayProjects = favoritesStorage.sortWithFavoritesFirst(projects);
  }

  if (displayProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {showFavoritesOnly ? 'No favorite projects yet' : 'No projects found'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayProjects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          index={index}
        />
      ))}
    </div>
  );
}
