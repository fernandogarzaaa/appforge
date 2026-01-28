import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FavoriteButton({ projectId, isFavorite, onToggle, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`${buttonSize} hover:bg-red-50 dark:hover:bg-red-950 transition-colors`}
      onClick={() => onToggle(projectId)}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`${sizeClass} transition-all ${
          isFavorite
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 dark:text-gray-600 hover:text-red-400'
        }`}
      />
    </Button>
  );
}
