import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Colors = {
  light: {
    text: '#0f172a',
    subtext: '#64748b',
    background: '#f8fafc',
    primary: '#3b82f6',
    border: '#f1f5f9',
    cardAlt: '#eff6ff',
    card: '#ffffff',
  },
  dark: {
    text: '#f8fafc',
    subtext: '#94a3b8',
    background: '#0f172a',
    primary: '#3b82f6',
    border: '#1e293b',
    cardAlt: '#1e293b',
    card: '#1e293b',
  }
};

const ThemeContext = createContext({
  theme: 'light' as 'light' | 'dark',
  colors: Colors.light,
  hasSelectedTheme: false,
  setHasSelectedTheme: (val: boolean) => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hasSelectedTheme, setHasSelectedThemeState] = useState(false);

  useEffect(() => {
    loadThemeState();
  }, []);

  const loadThemeState = async () => {
    try {
      const val = await AsyncStorage.getItem('@has_selected_theme');
      const savedTheme = await AsyncStorage.getItem('@app_theme');
      if (val === 'true') setHasSelectedThemeState(true);
      if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
    } catch (e) {}
  };

  const setHasSelectedTheme = async (val: boolean) => {
    setHasSelectedThemeState(val);
    try {
      await AsyncStorage.setItem('@has_selected_theme', val ? 'true' : 'false');
    } catch (e) {}
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('@app_theme', newTheme);
    } catch (e) {}
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colors: Colors[theme], 
      hasSelectedTheme, 
      setHasSelectedTheme,
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
