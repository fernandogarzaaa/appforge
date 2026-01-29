/**
 * Favorites utility functions
 * Manages project favorites with localStorage persistence
 */

const FAVORITES_KEY = 'favorites';
const LEGACY_KEY = 'appforge-favorites';

const readFavoriteIds = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY) || localStorage.getItem(LEGACY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const favoritesStorage = {
  // Get all favorite project IDs
  getFavorites: () => {
    return readFavoriteIds();
  },

  // Add project to favorites
  addFavorite: (projectId) => {
    const favorites = readFavoriteIds();
    if (!favorites.includes(projectId)) {
      favorites.push(projectId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
    return favorites;
  },

  // Remove project from favorites
  removeFavorite: (projectId) => {
    const favorites = readFavoriteIds();
    const filtered = favorites.filter(id => id !== projectId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return filtered;
  },

  // Check if project is favorite
  isFavorite: (projectId) => {
    return readFavoriteIds().includes(projectId);
  },

  // Toggle favorite status
  toggleFavorite: (projectId) => {
    if (favoritesStorage.isFavorite(projectId)) {
      return favoritesStorage.removeFavorite(projectId);
    } else {
      return favoritesStorage.addFavorite(projectId);
    }
  },

  // Get favorite projects (filtered list)
  getFavoriteProjects: (allProjects) => {
    const favorites = readFavoriteIds();
    return allProjects.filter(p => favorites.includes(p.id));
  },

  // Sort projects with favorites first
  sortWithFavoritesFirst: (projects) => {
    const favorites = new Set(readFavoriteIds());
    return [...projects].sort((a, b) => {
      const aIsFav = favorites.has(a.id);
      const bIsFav = favorites.has(b.id);
      return bIsFav - aIsFav; // Favorites come first
    });
  }
};

export const generateMockFavorites = (count = 3) => {
  return Array.from({ length: count }, (_, index) => ({
    projectId: `proj-${index + 1}`,
    timestamp: Date.now() - index * 1000
  }));
};

export const toggleFavorite = (favorites = [], projectId) => {
  if (!projectId) return favorites;
  const exists = favorites.some(fav => fav.projectId === projectId);
  if (exists) {
    return favorites.filter(fav => fav.projectId !== projectId);
  }
  return [...favorites, { projectId, timestamp: Date.now() }];
};

export const isFavorited = (favorites = [], projectId) => {
  return favorites.some(fav => fav.projectId === projectId);
};

export const getFavoriteCount = (favorites = []) => favorites.length;

export const sortByFavorites = (projects = [], favorites = []) => {
  const favoriteIds = new Set(favorites.map(fav => fav.projectId));
  return [...projects].sort((a, b) => {
    const aFav = favoriteIds.has(a.id);
    const bFav = favoriteIds.has(b.id);
    if (aFav === bFav) return 0;
    return aFav ? -1 : 1;
  });
};

export const calculateFavoriteStats = (projects = [], favorites = []) => {
  const totalProjects = projects.length;
  const favoriteCount = favorites.length;
  const favoritePercentage = totalProjects === 0
    ? 0
    : Math.round((favoriteCount / totalProjects) * 100);

  return { totalProjects, favoriteCount, favoritePercentage };
};
