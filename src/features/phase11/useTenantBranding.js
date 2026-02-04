import { useState, useCallback } from 'react';

/**
 * Hook for tenant-specific branding customization
 * @returns {Object} Branding utilities
 */
export const useTenantBranding = () => {
  const [branding, setBranding] = useState({
    logo: null,
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    customDomain: null,
    companyName: '',
    favicon: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Update branding settings
   */
  const updateBranding = useCallback(async (updates) => {
    setLoading(true);
    setError(null);

    try {
      setBranding(prev => ({ ...prev, ...updates }));
      
      // Apply color theme
      if (updates.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', updates.primaryColor);
      }
      if (updates.secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', updates.secondaryColor);
      }

      return branding;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [branding]);

  /**
   * Upload logo
   */
  const uploadLogo = useCallback(async (file) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate upload
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const logoUrl = e.target.result;
          setBranding(prev => ({ ...prev, logo: logoUrl }));
          setLoading(false);
          resolve(logoUrl);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Set custom domain
   */
  const setCustomDomain = useCallback(async (domain) => {
    setLoading(true);
    setError(null);

    try {
      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        throw new Error('Invalid domain format');
      }

      setBranding(prev => ({ ...prev, customDomain: domain }));
      return domain;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset to default branding
   */
  const resetBranding = useCallback(() => {
    setBranding({
      logo: null,
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      customDomain: null,
      companyName: '',
      favicon: null,
    });

    document.documentElement.style.setProperty('--primary-color', '#3B82F6');
    document.documentElement.style.setProperty('--secondary-color', '#10B981');
  }, []);

  /**
   * Generate CSS theme
   */
  const generateThemeCSS = useCallback(() => {
    return `
      :root {
        --primary-color: ${branding.primaryColor};
        --secondary-color: ${branding.secondaryColor};
      }
    `;
  }, [branding]);

  return {
    branding,
    loading,
    error,
    updateBranding,
    uploadLogo,
    setCustomDomain,
    resetBranding,
    generateThemeCSS,
  };
};
