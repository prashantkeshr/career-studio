// Tiny, non-sensitive UI preferences only. Never store documents here.

export type Theme = 'light' | 'dark';

const THEME_KEY = 'cs.theme';
const MODE_KEY = 'cs.mode';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore: private mode / blocked storage */
  }
}

export function getTheme(): Theme {
  const stored = safeGet(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark =
    typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  safeSet(THEME_KEY, theme);
}

export type EditorMode = 'simple' | 'advanced';

export function getMode(): EditorMode {
  return safeGet(MODE_KEY) === 'advanced' ? 'advanced' : 'simple';
}

export function setMode(mode: EditorMode): void {
  safeSet(MODE_KEY, mode);
}
