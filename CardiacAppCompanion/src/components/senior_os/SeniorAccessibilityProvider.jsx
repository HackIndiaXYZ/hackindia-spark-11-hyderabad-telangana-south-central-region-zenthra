import React, { createContext, useContext, useState } from 'react';
import { setHapticAssuranceEnabled } from '../../utils/hapticsEngine';

const AccessibilityContext = createContext({
  fontSize: 18,
  highContrast: false,
  hapticAssurance: true,
  increaseFont: () => {},
  decreaseFont: () => {},
  toggleHighContrast: () => {},
  toggleHapticAssurance: () => {},
  themeStyles: {},
  getResponsiveStyle: () => {},
});

export function SeniorAccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(18); // default 18, range 16 - 36
  const [themeMode, setThemeMode] = useState('light'); // default to 'light' (Senior Light Theme)
  const [hapticAssurance, setHapticAssurance] = useState(true);

  const increaseFont = () => {
    setFontSize(prev => Math.min(36, prev + 2));
  };

  const decreaseFont = () => {
    setFontSize(prev => Math.max(16, prev - 2));
  };

  const toggleHighContrast = () => {
    setThemeMode(prev => {
      if (prev === 'light') return 'hcDark';
      if (prev === 'hcDark') return 'standard';
      return 'light';
    });
  };

  const toggleHapticAssurance = () => {
    setHapticAssurance(prev => {
      const next = !prev;
      setHapticAssuranceEnabled(next);
      return next;
    });
  };

  const isLight = themeMode === 'light';
  const isHcDark = themeMode === 'hcDark';

  // Theme Styles config
  const themeStyles = {
    mode: themeMode,
    isLight,
    highContrast: themeMode !== 'standard',
    background: isLight ? '#FFFFFF' : (isHcDark ? '#121212' : '#0f172a'),
    cardBackground: isLight ? '#FFFFFF' : (isHcDark ? '#1c1c1c' : '#1e293b'),
    text: isLight ? '#0F172A' : (isHcDark ? '#FFFFFF' : '#f8fafc'),
    textMuted: isLight ? '#475569' : (isHcDark ? '#E0E0E0' : '#94a3b8'),
    primary: isLight ? '#2563EB' : (isHcDark ? '#FFD700' : '#3b82f6'),
    accent: isLight ? '#16A34A' : (isHcDark ? '#FFD700' : '#10b981'),
    border: isLight ? '#0F172A' : (isHcDark ? '#FFD700' : 'rgba(255, 255, 255, 0.1)'),
    danger: '#ef4444',
  };

  const highContrast = themeMode !== 'standard';

  // Helper function to dynamically scale text styles and enforce minimum font sizes
  const getResponsiveStyle = (baseSize, isHeader = false) => {
    let scaledSize = Math.round((baseSize * fontSize) / 18);
    const minSize = isHeader ? 24 : 18;
    if (scaledSize < minSize) {
      scaledSize = minSize;
    }
    return {
      fontSize: scaledSize,
      lineHeight: Math.round(scaledSize * 1.4),
      color: themeStyles.text,
    };
  };

  const value = {
    fontSize,
    highContrast,
    hapticAssurance,
    increaseFont,
    decreaseFont,
    toggleHighContrast,
    toggleHapticAssurance,
    themeStyles,
    getResponsiveStyle,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
