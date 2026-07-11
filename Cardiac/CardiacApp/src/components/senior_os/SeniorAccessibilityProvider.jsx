import React, { createContext, useContext, useState } from 'react';

const AccessibilityContext = createContext({
  fontSize: 18,
  highContrast: false,
  increaseFont: () => {},
  decreaseFont: () => {},
  toggleHighContrast: () => {},
  themeStyles: {},
  getResponsiveStyle: () => {},
});

export function SeniorAccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(18); // default 18, range 18 - 24
  const [highContrast, setHighContrast] = useState(false);

  const increaseFont = () => {
    setFontSize(prev => Math.min(24, prev + 2));
  };

  const decreaseFont = () => {
    setFontSize(prev => Math.max(18, prev - 2));
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  // High contrast palette:
  // - Dark Charcoal: #121212
  // - Stark White: #FFFFFF
  // - Bright Yellow: #FFD700
  // - Border: Yellow if High Contrast, otherwise standard gray/blue.
  const themeStyles = {
    background: highContrast ? '#121212' : '#0f172a', // deep slate/charcoal
    cardBackground: highContrast ? '#1c1c1c' : '#1e293b',
    text: highContrast ? '#FFFFFF' : '#f8fafc',
    textMuted: highContrast ? '#E0E0E0' : '#94a3b8',
    primary: highContrast ? '#FFD700' : '#3b82f6', // yellow vs blue
    accent: highContrast ? '#FFD700' : '#10b981', // yellow vs emerald
    border: highContrast ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
    danger: '#ef4444',
  };

  // Helper function to dynamically scale text styles and touch sizes
  const getResponsiveStyle = (baseSize) => {
    const scaledSize = Math.round((baseSize * fontSize) / 18);
    return {
      fontSize: scaledSize,
      lineHeight: Math.round(scaledSize * 1.4),
      color: themeStyles.text,
    };
  };

  const value = {
    fontSize,
    highContrast,
    increaseFont,
    decreaseFont,
    toggleHighContrast,
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
