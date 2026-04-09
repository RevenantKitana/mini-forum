import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 
  | 'light' 
  | 'dark' 
  | 'high-contrast' 
  | 'high-contrast-dark'
  | 'warm' 
  | 'warm-dark'
  | 'forest' 
  | 'forest-dark'
  | 'ocean' 
  | 'ocean-dark'
  | 'purple' 
  | 'purple-dark';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_LABELS: Record<ThemeName, string> = {
  'light': 'Sáng',
  'dark': 'Tối',
  'high-contrast': 'Độ Tương Phản Cao - Sáng',
  'high-contrast-dark': 'Độ Tương Phản Cao - Tối',
  'warm': 'Ấm Áp - Sáng',
  'warm-dark': 'Ấm Áp - Tối',
  'forest': 'Rừng - Sáng',
  'forest-dark': 'Rừng - Tối',
  'ocean': 'Đại Dương - Sáng',
  'ocean-dark': 'Đại Dương - Tối',
  'purple': 'Tím - Sáng',
  'purple-dark': 'Tím - Tối',
};

const LocalStorageKey = 'forum_theme';

// Get initial theme from localStorage or system preference
function getInitialTheme(): ThemeName {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LocalStorageKey) as ThemeName | null;
    if (saved && saved in THEME_LABELS) {
      return saved;
    }
    
    // Check system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);

  // Apply theme on mount
  useEffect(() => {
    applyThemeToDOM(theme);
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem(LocalStorageKey, newTheme);
    applyThemeToDOM(newTheme);
  };

  const isDark = theme.includes('dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
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

function applyThemeToDOM(theme: ThemeName) {
  const html = document.documentElement;
  
  // Remove all theme classes
  html.classList.remove(
    'light', 'dark',
    'high-contrast', 'high-contrast-dark',
    'warm', 'warm-dark',
    'forest', 'forest-dark',
    'ocean', 'ocean-dark',
    'purple', 'purple-dark'
  );

  // Handle light theme (no class needed, it's default)
  if (theme === 'light') {
    html.classList.remove('dark');
  } else {
    // Add the theme class
    html.classList.add(theme);
  }
}

export { THEME_LABELS };
