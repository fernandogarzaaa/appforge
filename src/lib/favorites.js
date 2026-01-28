/**
 * Favorites utility functions
 * Manages project favorites with localStorage persistence
 */

export const favoritesStorage = {
  // Get all favorite project IDs
  getFavorites: () => {
    try {
      const stored = localStorage.getItem('appforge-favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Add project to favorites
  addFavorite: (projectId) => {
    const favorites = favoritesStorage.getFavorites();
    if (!favorites.includes(projectId)) {
      favorites.push(projectId);
      localStorage.setItem('appforge-favorites', JSON.stringify(favorites));
    }
    return favorites;
  },

  // Remove project from favorites
  removeFavorite: (projectId) => {
    const favorites = favoritesStorage.getFavorites();
    const filtered = favorites.filter(id => id !== projectId);
    localStorage.setItem('appforge-favorites', JSON.stringify(filtered));
    return filtered;
  },

  // Check if project is favorite
  isFavorite: (projectId) => {
    return favoritesStorage.getFavorites().includes(projectId);
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
    const favorites = favoritesStorage.getFavorites();
    return allProjects.filter(p => favorites.includes(p.id));
  },

  // Sort projects with favorites first
  sortWithFavoritesFirst: (projects) => {
    const favorites = new Set(favoritesStorage.getFavorites());
    return [...projects].sort((a, b) => {
      const aIsFav = favorites.has(a.id);
      const bIsFav = favorites.has(b.id);
      return bIsFav - aIsFav; // Favorites come first
    });
  }
};
