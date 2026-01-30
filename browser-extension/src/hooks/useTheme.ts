import { useSyncExternalStore } from 'react';

export type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'issuer-color-scheme';

const getStoredTheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY) as ColorScheme | null;
  if (stored && (stored === 'light' || stored === 'dark')) {
    return stored;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const storeTheme = (scheme: ColorScheme): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, scheme);
};

let currentScheme: ColorScheme = getStoredTheme();
const listeners: Set<() => void> = new Set();

const subscribe = (callback: () => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const getSnapshot = (): ColorScheme => currentScheme;

const getServerSnapshot = (): ColorScheme => 'light';

const toggleColorScheme = (): void => {
  currentScheme = currentScheme === 'dark' ? 'light' : 'dark';
  storeTheme(currentScheme);
  listeners.forEach((cb) => cb());
};

const setColorScheme = (scheme: ColorScheme): void => {
  currentScheme = scheme;
  storeTheme(scheme);
  listeners.forEach((cb) => cb());
};

interface ThemeState {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const useTheme = (): ThemeState => {
  const colorScheme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    colorScheme,
    toggleColorScheme,
    setColorScheme,
  };
};
