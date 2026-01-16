import { useState, useMemo } from 'react';
import type { ThemeMode, ThemeColors } from '@/types';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const colors: ThemeColors = useMemo(() => {
    if (mode === 'dark') {
      return {
        primary: '#00FF41', // Tech green
        secondary: '#00CC33',
        background: '#0D1117',
        text: '#C9D1D9',
        border: '#939699FF',
        user: '#fbb463ff',
        assistant: '#42ffd3ff',
        success: '#3FB950',
        error: '#F85149',
        warning: '#D29922',
        muted: '#8B949E',
      };
    } else {
      return {
        primary: '#00AA00', // Green for light mode
        secondary: '#008800',
        background: '#FFFFFF',
        text: '#24292F',
        border: '#D0D7DE',
        user: '#0969DA',
        assistant: '#00AA00',
        success: '#1A7F37',
        error: '#CF222E',
        warning: '#9A6700',
        muted: '#656D76',
      };
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  return {
    mode,
    colors,
    toggleTheme,
  };
}
