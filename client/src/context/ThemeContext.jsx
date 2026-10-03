import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    } catch (e) {}
    return 'light'; // Default is LIGHT MODE as requested!
  });

  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise_theme');
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      if (saved === 'system') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    const computeEffective = (currentTheme) => {
      if (currentTheme === 'system') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return currentTheme;
    };

    const calculated = computeEffective(theme);
    setEffectiveTheme(calculated);

    root.setAttribute('data-theme', calculated);
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${calculated}`);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', calculated === 'dark' ? '#000000' : '#F8FAFC');
    }

    try {
      localStorage.setItem('spendwise_theme', theme);
    } catch (e) {}

    // System theme change listener
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newEff = mediaQuery.matches ? 'dark' : 'light';
        setEffectiveTheme(newEff);
        root.setAttribute('data-theme', newEff);
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.add(`theme-${newEff}`);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const currentEff = prev === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : prev;
      return currentEff === 'dark' ? 'light' : 'dark';
    });
  };

  const isDark = effectiveTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
