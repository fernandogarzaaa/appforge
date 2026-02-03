import React, { createContext, useContext, useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Zustand store for theme persistence
const useThemeStore = create(
  persist(
    (set) => ({
      isDark: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setTheme: (isDark) => set({ isDark }),
    }),
    {
      name: 'appforge-theme', // localStorage key
    }
  )
);

// React Context for theme
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { isDark, toggleTheme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Apply theme to DOM
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark, mounted]);

  if (!mounted) {
    return children; // Prevent hydration mismatch
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
