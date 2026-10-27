import { useCallback, useEffect, useState } from 'react';
import { readPref, writePref } from '@/lib/prefs';

export type ThemeChoice = 'system' | 'light' | 'dark';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function applyTheme(choice: ThemeChoice): void {
  const dark = choice === 'dark' || (choice === 'system' && media().matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function getSavedTheme(): ThemeChoice {
  const t = readPref('theme');
  return t === 'light' || t === 'dark' ? t : 'system';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(getSavedTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = media();
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemeChoice) => {
    writePref('theme', t);
    setThemeState(t);
  }, []);

  /** Back to "match phone" without saving a preference (used after "Delete all my data"). */
  const resetTheme = useCallback(() => {
    writePref('theme', null);
    setThemeState('system');
  }, []);

  return { theme, setTheme, resetTheme };
}
