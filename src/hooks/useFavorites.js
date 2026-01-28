import { useState, useEffect } from 'react';
import { projectsService } from '@/api/services';

export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load favorites from backend on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await projectsService.getFavorites();
        const favoriteIds = data.map(project => project.id);
        setFavorites(new Set(favoriteIds));
        localStorage.setItem('appforge-favorites', JSON.stringify(favoriteIds));
      } catch (err) {
        console.error('Error loading favorites from backend:', err);
        // Fallback to localStorage
        const stored = localStorage.getItem('appforge-favorites');
        if (stored) {
          try {
            setFavorites(new Set(JSON.parse(stored)));
          } catch (parseErr) {
            console.error('Error parsing stored favorites:', parseErr);
          }
        }
      } finally {
        setLoaded(true);
      }
    };
    fetchFavorites();
  }, []);

  const toggleFavorite = async (projectId) => {
    const newFavorites = new Set(favorites);
    const isFavorite = newFavorites.has(projectId);
    
    if (isFavorite) {
      newFavorites.delete(projectId);
    } else {
      newFavorites.add(projectId);
    }

    // Optimistically update UI
    setFavorites(newFavorites);
    localStorage.setItem('appforge-favorites', JSON.stringify(Array.from(newFavorites)));

    // Sync to backend
    try {
      await projectsService.toggleFavorite(projectId);
    } catch (err) {
      console.error('Failed to sync favorite to backend:', err);
      // Revert on error
      setFavorites(favorites);
      localStorage.setItem('appforge-favorites', JSON.stringify(Array.from(favorites)));
      throw err;
    }
  };

  const isFavorite = (projectId) => favorites.has(projectId);

  return { favorites, toggleFavorite, isFavorite, loaded };
}
