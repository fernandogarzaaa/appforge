import { useState, useCallback, useEffect } from 'react';

/**
 * useAdvancedSettings Hook
 * Manage advanced application settings and preferences
 */
export function useAdvancedSettings() {
  const [userSettings, setUserSettings] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      inApp: true,
      digest: 'daily'
    },
    privacy: {
      shareActivity: false,
      analyticsTracking: true,
      profileVisibility: 'private'
    },
    accessibility: {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: false,
      screenReader: false
    },
    performance: {
      caching: true,
      compression: true,
      imageOptimization: true,
      lazyLoading: true
    }
  });

  const [settingsGroups, setSettingsGroups] = useState([]);
  const [customSettings, setCustomSettings] = useState({});
  const [settingsHistory, setSettingsHistory] = useState([]);

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appforge_user_settings');
    if (saved) setUserSettings(JSON.parse(saved));

    const custom = localStorage.getItem('appforge_custom_settings');
    if (custom) setCustomSettings(JSON.parse(custom));

    const history = localStorage.getItem('appforge_settings_history');
    if (history) setSettingsHistory(JSON.parse(history));
  }, []);

  // Update user settings
  const updateUserSettings = useCallback((key, value) => {
    const updated = { ...userSettings };
    const keys = key.split('.');
    let current = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const oldValue = current[keys[keys.length - 1]];
    current[keys[keys.length - 1]] = value;

    setUserSettings(updated);
    localStorage.setItem('appforge_user_settings', JSON.stringify(updated));

    // Add to history
    addSettingsHistory(key, oldValue, value);

    return updated;
  }, [userSettings]);

  // Add to settings history
  const addSettingsHistory = useCallback((key, oldValue, newValue) => {
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      key,
      oldValue,
      newValue
    };

    const updated = [historyEntry, ...settingsHistory].slice(0, 500);
    setSettingsHistory(updated);
    localStorage.setItem('appforge_settings_history', JSON.stringify(updated));
  }, [settingsHistory]);

  // Reset settings to default
  const resetToDefaults = useCallback(() => {
    const defaults = {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        inApp: true,
        digest: 'daily'
      },
      privacy: {
        shareActivity: false,
        analyticsTracking: true,
        profileVisibility: 'private'
      },
      accessibility: {
        highContrast: false,
        fontSize: 'medium',
        reducedMotion: false,
        screenReader: false
      },
      performance: {
        caching: true,
        compression: true,
        imageOptimization: true,
        lazyLoading: true
      }
    };

    setUserSettings(defaults);
    localStorage.setItem('appforge_user_settings', JSON.stringify(defaults));
  }, []);

  // Create custom setting
  const createCustomSetting = useCallback((key, value, metadata = {}) => {
    const updated = { ...customSettings };
    updated[key] = {
      value,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCustomSettings(updated);
    localStorage.setItem('appforge_custom_settings', JSON.stringify(updated));

    return updated[key];
  }, [customSettings]);

  // Update custom setting
  const updateCustomSetting = useCallback((key, value) => {
    const updated = { ...customSettings };
    if (updated[key]) {
      updated[key] = {
        ...updated[key],
        value,
        updatedAt: new Date().toISOString()
      };

      setCustomSettings(updated);
      localStorage.setItem('appforge_custom_settings', JSON.stringify(updated));
    }

    return updated[key];
  }, [customSettings]);

  // Get setting with path notation
  const getSetting = useCallback((key, defaultValue = null) => {
    const keys = key.split('.');
    let current = userSettings;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }

    return current;
  }, [userSettings]);

  // Get all settings as flat object
  const getAllSettingsFlat = useCallback(() => {
    const flat = {};

    const flatten = (obj, prefix = '') => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          flatten(obj[key], prefix ? `${prefix}.${key}` : key);
        } else {
          flat[prefix ? `${prefix}.${key}` : key] = obj[key];
        }
      }
    };

    flatten(userSettings);
    return flat;
  }, [userSettings]);

  // Export settings
  const exportSettings = useCallback(() => {
    const settings = {
      timestamp: new Date().toISOString(),
      userSettings,
      customSettings,
      version: '1.0'
    };

    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return settings;
  }, [userSettings, customSettings]);

  // Import settings
  const importSettings = useCallback((settingsJson) => {
    try {
      const parsed = typeof settingsJson === 'string' 
        ? JSON.parse(settingsJson) 
        : settingsJson;

      if (parsed.userSettings) {
        setUserSettings(parsed.userSettings);
        localStorage.setItem('appforge_user_settings', JSON.stringify(parsed.userSettings));
      }

      if (parsed.customSettings) {
        setCustomSettings(parsed.customSettings);
        localStorage.setItem('appforge_custom_settings', JSON.stringify(parsed.customSettings));
      }

      return { success: true, message: 'Settings imported successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Get settings by category
  const getSettingsByCategory = useCallback((category) => {
    const categorySettings = {
      notifications: userSettings.notifications || {},
      privacy: userSettings.privacy || {},
      accessibility: userSettings.accessibility || {},
      performance: userSettings.performance || {}
    };

    return categorySettings[category] || null;
  }, [userSettings]);

  // Create settings group
  const createSettingsGroup = useCallback((groupName, settings) => {
    const group = {
      id: Date.now(),
      name: groupName,
      settings,
      createdAt: new Date().toISOString()
    };

    const updated = [...settingsGroups, group];
    setSettingsGroups(updated);
    localStorage.setItem('appforge_settings_groups', JSON.stringify(updated));

    return group;
  }, [settingsGroups]);

  // Apply settings group
  const applySettingsGroup = useCallback((groupId) => {
    const group = settingsGroups.find(g => g.id === groupId);
    if (!group) return null;

    Object.entries(group.settings).forEach(([key, value]) => {
      updateUserSettings(key, value);
    });

    return group;
  }, [settingsGroups, updateUserSettings]);

  // Validate settings
  const validateSettings = useCallback(() => {
    const errors = [];

    if (!userSettings.theme) {
      errors.push('Theme is required');
    }

    if (!userSettings.language) {
      errors.push('Language is required');
    }

    if (!userSettings.timezone) {
      errors.push('Timezone is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, [userSettings]);

  return {
    // Core settings
    userSettings,
    customSettings,
    settingsHistory,
    settingsGroups,

    // Updates
    updateUserSettings,
    updateCustomSetting,
    createCustomSetting,
    resetToDefaults,

    // Retrieval
    getSetting,
    getAllSettingsFlat,
    getSettingsByCategory,

    // Groups
    createSettingsGroup,
    applySettingsGroup,

    // Import/Export
    exportSettings,
    importSettings,

    // Validation
    validateSettings
  };
}
