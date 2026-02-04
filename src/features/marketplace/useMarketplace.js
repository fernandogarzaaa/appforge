import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook for managing template marketplace
 * Handles template upload, download, ratings, and monetization
 */
export const useMarketplace = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: null,
    language: null,
    minRating: 0,
    sort: 'trending',
  });
  const [userTemplates, setUserTemplates] = useState([]);

  /**
   * Load marketplace templates
   */
  const loadTemplates = useCallback(async (filterOptions = filters) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterOptions.category) params.append('category', filterOptions.category);
      if (filterOptions.language) params.append('language', filterOptions.language);
      if (filterOptions.minRating) params.append('minRating', String(filterOptions.minRating));
      params.append('sort', filterOptions.sort);

      const response = await axios.get(`/api/marketplace/templates?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setTemplates(response.data.templates || []);
      return response.data.templates;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Load user's uploaded templates
   */
  const loadUserTemplates = useCallback(async () => {
    try {
      const response = await axios.get('/api/marketplace/my-templates', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setUserTemplates(response.data.templates || []);
      return response.data.templates;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Upload new template
   */
  const uploadTemplate = useCallback(async (templateData) => {
    try {
      setError(null);

      const formData = new FormData();
      formData.append('name', templateData.name);
      formData.append('description', templateData.description);
      formData.append('category', templateData.category);
      formData.append('language', templateData.language);
      formData.append('tags', JSON.stringify(templateData.tags || []));
      formData.append('content', templateData.content);
      formData.append('preview', templateData.preview);
      formData.append('price', templateData.price || 0);
      formData.append('license', templateData.license || 'MIT');

      if (templateData.thumbnail) {
        formData.append('thumbnail', templateData.thumbnail);
      }

      const response = await axios.post('/api/marketplace/upload', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const newTemplate = response.data.template;
      setUserTemplates((prev) => [...prev, newTemplate]);

      return newTemplate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Download template
   */
  const downloadTemplate = useCallback(async (templateId) => {
    try {
      setError(null);

      const response = await axios.get(`/api/marketplace/templates/${templateId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      // Record download for analytics
      await axios.post(
        `/api/marketplace/templates/${templateId}/stats/download`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Rate template
   */
  const rateTemplate = useCallback(async (templateId, rating, review) => {
    try {
      setError(null);

      const response = await axios.post(
        `/api/marketplace/templates/${templateId}/rate`,
        {
          rating, // 1-5 stars
          review,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      // Update local template
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                averageRating: response.data.averageRating,
                totalRatings: response.data.totalRatings,
              }
            : t
        )
      );

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Search templates
   */
  const searchTemplates = useCallback(async (query) => {
    try {
      setError(null);

      const response = await axios.get('/api/marketplace/search', {
        params: { q: query, ...filters },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setTemplates(response.data.templates || []);
      return response.data.templates;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [filters]);

  /**
   * Update template
   */
  const updateTemplate = useCallback(async (templateId, updates) => {
    try {
      setError(null);

      const response = await axios.patch(
        `/api/marketplace/templates/${templateId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      setUserTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? response.data.template : t))
      );

      return response.data.template;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Delete template
   */
  const deleteTemplate = useCallback(async (templateId) => {
    try {
      setError(null);

      await axios.delete(`/api/marketplace/templates/${templateId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setUserTemplates((prev) => prev.filter((t) => t.id !== templateId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Purchase template (if paid)
   */
  const purchaseTemplate = useCallback(async (templateId) => {
    try {
      setError(null);

      const response = await axios.post(
        `/api/marketplace/templates/${templateId}/purchase`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get template versions
   */
  const getVersions = useCallback(async (templateId) => {
    try {
      const response = await axios.get(`/api/marketplace/templates/${templateId}/versions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.versions;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get earnings for templates
   */
  const getEarnings = useCallback(async () => {
    try {
      const response = await axios.get('/api/marketplace/earnings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    templates,
    userTemplates,
    isLoading,
    error,
    filters,
    setFilters,
    loadTemplates,
    loadUserTemplates,
    uploadTemplate,
    downloadTemplate,
    rateTemplate,
    searchTemplates,
    updateTemplate,
    deleteTemplate,
    purchaseTemplate,
    getVersions,
    getEarnings,
  };
};

export default useMarketplace;
