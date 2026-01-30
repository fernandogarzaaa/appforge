import { useEffect, useState, createContext, useContext } from 'react';

const ThemeContext = createContext(null);

/**
 * Theme management hook with custom themes and time-based switching
 */
export function useThemeManager() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appforge_theme') || 'light';
  });

  const [customTheme, setCustomTheme] = useState(() => {
    const saved = localStorage.getItem('appforge_custom_theme');
    return saved ? JSON.parse(saved) : getDefaultCustomTheme();
  });

  const [timeBasedTheme, setTimeBasedTheme] = useState(() => {
    return localStorage.getItem('appforge_time_based_theme') === 'true';
  });

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('appforge_theme', theme);

    // Apply custom CSS variables
    if (customTheme) {
      Object.entries(customTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }
  }, [theme, customTheme]);

  // Auto-switch theme based on time
  useEffect(() => {
    if (!timeBasedTheme) return;

    const checkTime = () => {
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 20 || hour < 6; // 8 PM to 6 AM
      setTheme(shouldBeDark ? 'dark' : 'light');
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [timeBasedTheme]);

  const switchTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const updateCustomTheme = (updates) => {
    const updated = { ...customTheme, ...updates };
    setCustomTheme(updated);
    localStorage.setItem('appforge_custom_theme', JSON.stringify(updated));
  };

  const enableTimeBasedTheme = (enabled) => {
    setTimeBasedTheme(enabled);
    localStorage.setItem('appforge_time_based_theme', enabled);
  };

  return {
    theme,
    switchTheme,
    toggleTheme,
    customTheme,
    updateCustomTheme,
    timeBasedTheme,
    enableTimeBasedTheme,
    availableThemes: ['light', 'dark', 'auto'],
  };
}

function getDefaultCustomTheme() {
  return {
    name: 'Default',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#f3f4f6',
      'muted-foreground': '#6b7280',
    },
    fonts: {
      body: '"Inter", sans-serif',
      mono: '"Fira Code", monospace',
    },
    borderRadius: '0.5rem',
  };
}

// Preset themes
export const PRESET_THEMES = {
  solarized_dark: {
    name: 'Solarized Dark',
    colors: {
      primary: '#268bd2',
      secondary: '#2aa198',
      accent: '#d33682',
      background: '#002b36',
      foreground: '#839496',
      muted: '#073642',
      'muted-foreground': '#586e75',
    },
  },
  nord: {
    name: 'Nord',
    colors: {
      primary: '#88c0d0',
      secondary: '#81a1c1',
      accent: '#bf616a',
      background: '#2e3440',
      foreground: '#eceff4',
      muted: '#3b4252',
      'muted-foreground': '#d8dee9',
    },
  },
  dracula: {
    name: 'Dracula',
    colors: {
      primary: '#8be9fd',
      secondary: '#ff79c6',
      accent: '#ff5555',
      background: '#282a36',
      foreground: '#f8f8f2',
      muted: '#44475a',
      'muted-foreground': '#6272a4',
    },
  },
  gruvbox_dark: {
    name: 'Gruvbox Dark',
    colors: {
      primary: '#83a598',
      secondary: '#d3869b',
      accent: '#fb4934',
      background: '#282828',
      foreground: '#ebdbb2',
      muted: '#3c3836',
      'muted-foreground': '#928374',
    },
  },
  tokyo_night: {
    name: 'Tokyo Night',
    colors: {
      primary: '#7aa2f7',
      secondary: '#bb9af7',
      accent: '#f7768e',
      background: '#1a1b26',
      foreground: '#c0caf5',
      muted: '#2a2b3d',
      'muted-foreground': '#565f89',
    },
  },
};
