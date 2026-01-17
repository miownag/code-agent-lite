import { useState, useMemo } from 'react';
import type { ThemeMode, ThemeColors } from '@/types';

export default function useTheme() {
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
        shimmer: [
          '#4A5568',
          '#6B7280',
          '#9CA3AF',
          '#D1D5DB',
          '#F3F4F6',
          '#D1D5DB',
          '#9CA3AF',
          '#6B7280',
        ],
        gradient: [
          '#2598fd',
          '#25fddd',
          '#00FF41',
          '#66cc00',
          '#8c9900',
          '#b35100',
        ],
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
        shimmer: [
          '#2e3b4a',
          '#353d46',
          '#3c4045',
          '#515356',
          '#464646',
          '#4e5053',
          '#42464d',
          '#38424d',
        ],
        gradient: [
          '#0a3c68',
          '#076c5d',
          '#086c21',
          '#305d04',
          '#586003',
          '#502503',
        ],
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
