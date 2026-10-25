import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CareerProfile, ProjectEnvelope } from '../core/models/types';
import { emptyProfile } from '../core/models/factory';
import * as db from '../core/storage/db';
import {
  getMode,
  getTheme,
  setMode as persistMode,
  setTheme as persistTheme,
  type EditorMode,
  type Theme,
} from '../core/storage/prefs';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface StoreValue {
  ready: boolean;
  storageOk: boolean;
  theme: Theme;
  toggleTheme: () => void;
  mode: EditorMode;
  setMode: (m: EditorMode) => void;

  profile: CareerProfile;
  updateProfile: (updater: (p: CareerProfile) => CareerProfile) => void;
  profileSave: SaveState;

  projects: ProjectEnvelope[];
  refreshProjects: () => Promise<void>;
  saveProjectRecord: (p: ProjectEnvelope) => Promise<void>;
  deleteProjectRecord: (id: string) => Promise<void>;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [mode, setModeState] = useState<EditorMode>(() => getMode());
  const [profile, setProfile] = useState<CareerProfile>(() => emptyProfile());
  const [profileSave, setProfileSave] = useState<SaveState>('idle');
  const [projects, setProjects] = useState<ProjectEnvelope[]>([]);

  // Apply theme to <html>.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await db.storageAvailable();
      if (cancelled) return;
      setStorageOk(ok);
      if (ok) {
        const [p, list] = await Promise.all([db.loadProfile(), db.listProjects()]);
        if (cancelled) return;
        if (p) setProfile(p);
        setProjects(list);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced profile autosave.
  const saveTimer = useRef<number | undefined>(undefined);
  const updateProfile = useCallback(
    (updater: (p: CareerProfile) => CareerProfile) => {
      setProfile((prev) => {
        const next = updater(prev);
        if (storageOk) {
          setProfileSave('saving');
          window.clearTimeout(saveTimer.current);
          saveTimer.current = window.setTimeout(async () => {
            try {
              await db.saveProfile(next);
              setProfileSave('saved');
            } catch {
              setProfileSave('error');
            }
          }, 600);
        }
        return next;
      });
    },
    [storageOk],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return next;
    });
  }, []);

  const setMode = useCallback((m: EditorMode) => {
    setModeState(m);
    persistMode(m);
  }, []);

  const refreshProjects = useCallback(async () => {
    if (!storageOk) return;
    setProjects(await db.listProjects());
  }, [storageOk]);

  const saveProjectRecord = useCallback(
    async (p: ProjectEnvelope) => {
      await db.saveProject(p);
      await refreshProjects();
    },
    [refreshProjects],
  );

  const deleteProjectRecord = useCallback(
    async (id: string) => {
      await db.deleteProject(id);
      await refreshProjects();
    },
    [refreshProjects],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      storageOk,
      theme,
      toggleTheme,
      mode,
      setMode,
      profile,
      updateProfile,
      profileSave,
      projects,
      refreshProjects,
      saveProjectRecord,
      deleteProjectRecord,
    }),
    [ready, storageOk, theme, toggleTheme, mode, setMode, profile, updateProfile, profileSave, projects, refreshProjects, saveProjectRecord, deleteProjectRecord],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
}
