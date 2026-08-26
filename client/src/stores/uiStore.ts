// UI chrome state: theme, active screen, drawer.
// Theme is applied to <html data-theme> and persisted under the same key the
// vanilla app used, so returning visitors keep their preference.
import { create } from 'zustand';
import type { Screen, Theme } from '../types';

const THEME_KEY = 'cscd_theme';

const SCREENS: Screen[] = [
  'dashboard',
  'interview',
  'activity',
  'about',
  'rundown',
  'venue',
  'hotel',
  'schedule',
  'contact',
  'scholarship-holders',
];

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function initialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Light by default, regardless of system preference - dark is opt-in only
  // (matches the pre-paint script in index.html).
  return 'light';
}

function initialScreen(): Screen {
  const hash = location.hash.slice(1) as Screen;
  return SCREENS.includes(hash) ? hash : 'dashboard';
}

interface UIState {
  theme: Theme;
  activeScreen: Screen;
  menuOpen: boolean;

  toggleTheme: () => void;
  switchScreen: (screen: Screen) => void;
  setMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: initialTheme(),
  activeScreen: initialScreen(),
  menuOpen: false,

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },

  switchScreen: (screen) => {
    if (!SCREENS.includes(screen)) screen = 'dashboard';
    history.replaceState(null, '', `#${screen}`);
    set({ activeScreen: screen, menuOpen: false });
  },

  setMenuOpen: (open) => set({ menuOpen: open }),
}));

// Apply the persisted/initial theme immediately on module load (before first paint
// of the React tree; the inline script in index.html covers the pre-JS window).
applyTheme(useUIStore.getState().theme);
