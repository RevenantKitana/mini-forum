import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface FontSizeContextType {
  scale: FontSizeScale;
  setScale: (scale: FontSizeScale) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const SCALE_VALUES: Record<FontSizeScale, number> = {
  xs: 0.7,   // Very Small
  sm: 0.85,  // Small
  md: 1,     // Medium
  lg: 1.15,  // Large
  xl: 1.3,   // Very Large
};

const SCALE_LABELS: Record<FontSizeScale, string> = {
  xs: 'Rất Nhỏ',
  sm: 'Nhỏ',
  md: 'Trung Bình',
  lg: 'Lớn',
  xl: 'Rất Lớn',
};

const LocalStorageKey = 'forum_font_size_scale';

// Get initial scale from localStorage or default to 'md'
function getInitialScale(): FontSizeScale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LocalStorageKey) as FontSizeScale | null;
    if (saved && saved in SCALE_VALUES) {
      return saved;
    }
  }
  return 'md';
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScaleState] = useState<FontSizeScale>(getInitialScale);

  // Apply saved font scale CSS variable on initial mount (fix: localStorage scale not applied after reload)
  useEffect(() => {
    applyFontScaleToDOM(scale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setScale = (newScale: FontSizeScale) => {
    setScaleState(newScale);
    localStorage.setItem(LocalStorageKey, newScale);
    applyFontScaleToDOM(newScale);
  };

  return (
    <FontSizeContext.Provider value={{ scale, setScale }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within FontSizeProvider');
  }
  return context;
}

function applyFontScaleToDOM(scale: FontSizeScale) {
  const scaleValue = SCALE_VALUES[scale];
  const root = document.documentElement;
  
  // Set scale multiplier CSS variable
  root.style.setProperty('--font-size-scale', String(scaleValue));
}

export { SCALE_LABELS, SCALE_VALUES };
