import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('appforge-favorites');
    if (stored) {
      try {
        setFavorites(new Set(JSON.parse(stored)));
      } catch (err) {
        console.error('Error loading favorites:', err);
      }
    }
    setLoaded(true);
  }, []);

  const toggleFavorite = async (projectId) => {
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(projectId)) {
      newFavorites.delete(projectId);
    } else {
      newFavorites.add(projectId);
    }

    setFavorites(newFavorites);
    localStorage.setItem('appforge-favorites', JSON.stringify(Array.from(newFavorites)));

    // TODO: Sync to backend with toggleFavorite.ts function
    // await fetch('/api/toggleFavorite', {
    //   method: 'POST',
    //   body: JSON.stringify({ projectId, isFavorite: newFavorites.has(projectId) })
    // });
  };

  const isFavorite = (projectId) => favorites.has(projectId);

  return { favorites, toggleFavorite, isFavorite, loaded };
}
