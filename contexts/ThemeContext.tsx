import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { themes, Theme } from '../themes';
import { DEFAULT_THEME_NAME } from '../constants';
import { localStorageService } from '../services/localStorageService';

interface ThemeContextType {
  currentTheme: Theme;
  themeName: string;
  setThemeName: (name: string) => void;
  availableThemes: Record<string, Theme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeNameState] = useState<string>(localStorageService.getThemePreference());
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[themeName] || themes[DEFAULT_THEME_NAME]);

  const applyThemeColors = useCallback((theme: Theme) => {
    const root = document.documentElement;
    if (theme && theme.colors) {
      for (const [key, value] of Object.entries(theme.colors)) {
        const kebabKey = key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
        root.style.setProperty(`--theme-color-${kebabKey}`, value);
      }
      // Ensure body background and text color are directly applied as well,
      // complementing the Tailwind classes that use these CSS variables.
      document.body.style.backgroundColor = theme.colors.primaryBg;
      document.body.style.color = theme.colors.textPrimary;
    }
  }, []);

  useEffect(() => {
    const selectedTheme = themes[themeName];
    if (selectedTheme) {
      setCurrentTheme(selectedTheme);
      applyThemeColors(selectedTheme);
    } else {
      // Fallback to default if stored theme name is invalid
      const defaultThemeInstance = themes[DEFAULT_THEME_NAME];
      setCurrentTheme(defaultThemeInstance);
      applyThemeColors(defaultThemeInstance);
      localStorageService.setThemePreference(DEFAULT_THEME_NAME); // Correct localStorage
    }
  }, [themeName, applyThemeColors]);

  const setThemeName = (name: string) => {
    if (themes[name]) {
      localStorageService.setThemePreference(name);
      setThemeNameState(name);
    } else {
      console.warn(`Theme "${name}" not found. Falling back to default.`);
      localStorageService.setThemePreference(DEFAULT_THEME_NAME);
      setThemeNameState(DEFAULT_THEME_NAME);
    }
  };
  
  // This effect runs once on mount to ensure initial theme variables are set by React if the inline script missed something
  // or if state hydration logic is complex. The inline script in index.html is the primary FOUC mitigator.
  useEffect(() => {
    applyThemeColors(currentTheme);
  }, [currentTheme, applyThemeColors]);


  return (
    <ThemeContext.Provider value={{ currentTheme, themeName, setThemeName, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
