import { useState, useEffect, useMemo } from 'react';

const FAVORITES_KEY = 'favorites';
const LEGACY_KEY = 'appforge-favorites';

const loadFavorites = () => {
  const stored = localStorage.getItem(FAVORITES_KEY) || localStorage.getItem(LEGACY_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(item => item && item.projectId)
        .map(item => ({
          projectId: item.projectId,
          timestamp: item.timestamp || Date.now(),
        }));
    }
  } catch (error) {
    console.error('Error parsing stored favorites:', error);
  }
  return [];
};

const persistFavorites = (items) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
};

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const initial = loadFavorites();
    setFavorites(initial);
    setLoaded(true);
  }, []);

  const isFavorited = (projectId) => {
    return favorites.some(favorite => favorite.projectId === projectId);
  };

  const addFavorite = (projectId) => {
    if (!projectId) return;
    setFavorites(prev => {
      if (prev.some(favorite => favorite.projectId === projectId)) {
        return prev;
      }
      const next = [...prev, { projectId, timestamp: Date.now() }];
      persistFavorites(next);
      return next;
    });
  };

  const removeFavorite = (projectId) => {
    setFavorites(prev => {
      const next = prev.filter(favorite => favorite.projectId !== projectId);
      persistFavorites(next);
      return next;
    });
  };

  const toggleFavorite = (projectId) => {
    if (!projectId) return;
    setFavorites(prev => {
      const exists = prev.some(favorite => favorite.projectId === projectId);
      const next = exists
        ? prev.filter(favorite => favorite.projectId !== projectId)
        : [...prev, { projectId, timestamp: Date.now() }];
      persistFavorites(next);
      return next;
    });
  };

  const clearFavorites = () => {
    setFavorites([]);
    persistFavorites([]);
  };

  const getFavoriteCount = () => favorites.length;

  const getFavoriteIds = () => favorites.map(favorite => favorite.projectId);

  const sortByFavorites = (projects = []) => {
    const favoriteIds = new Set(getFavoriteIds());
    return [...projects].sort((a, b) => {
      const aFav = favoriteIds.has(a.id);
      const bFav = favoriteIds.has(b.id);
      if (aFav === bFav) return 0;
      return aFav ? -1 : 1;
    });
  };

  const getRecentFavorites = (limit = 5) => {
    return [...favorites]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  };

  const stats = useMemo(() => {
    const total = favorites.length;
    return {
      total,
      percentage: total > 0 ? 100 : 0,
    };
  }, [favorites]);

  const isFavorite = (projectId) => isFavorited(projectId);

  return {
    favorites,
    loaded,
    isFavorited,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    getFavoriteCount,
    getFavoriteIds,
    getRecentFavorites,
    sortByFavorites,
    stats,
  };
}
