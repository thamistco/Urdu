import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Resilient persistence adapter. Uses AsyncStorage when available, but falls
 * back to an in-memory map if storage is blocked (e.g. a sandboxed browser
 * preview with no localStorage access). This keeps the app from crashing on
 * launch anywhere it runs — device, Expo Go, web, or an embedded preview frame.
 */
const memory = new Map<string, string>();

/**
 * Whether storage has refused anything this session. A strict privacy mode or
 * a locked-down webview throws on every access; the app then runs from the
 * in-memory map and says, once, that nothing will be kept (QA, 2026-10-13,
 * M21). Read by the banner in App.tsx.
 */
let refused = false;
const listeners = new Set<() => void>();
const markRefused = () => {
  if (refused) return;
  refused = true;
  listeners.forEach((l) => l());
};
export const storageRefused = () => refused;
export function onStorageRefused(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Whether the saved progress could not be read this session and was set aside
 * in a backup. The app then starts fresh, which it did without a word: a
 * learner met the welcome screen and could only think their progress was gone
 * (QA, 2026-10-13). Read by the notice in App.tsx.
 */
let setAside = false;
const setAsideListeners = new Set<() => void>();
export const progressSetAside = () => setAside;
export function onProgressSetAside(fn: () => void): () => void {
  setAsideListeners.add(fn);
  return () => setAsideListeners.delete(fn);
}

export const safeStorage: StateStorage = {
  async getItem(name) {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      markRefused();
      return memory.get(name) ?? null;
    }
  },
  async setItem(name, value) {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      markRefused();
      memory.set(name, value);
    }
  },
  async removeItem(name) {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      markRefused();
      memory.delete(name);
    }
  },
};

/**
 * Storage for a persisted store that never lets a save be lost unread.
 *
 * Zustand discards a saved blob whose version differs from the store's, and
 * one that will not parse fails hydration; either way the next write replaces
 * it with a fresh profile. A save from another version of the app, or one a
 * crash left half-written, was wiped silently: back to onboarding with 20 gems
 * (QA, 2026-10-13, H12).
 *
 * Now, before anything can overwrite it, a save that will not parse, has no
 * state object, or carries a different version is copied as it was to
 * `<name>-backup-<time>`. Then:
 * - one that parses with a state object is handed on, and the store's
 *   `migrate` (`keepSavedFields`) keeps its fields;
 * - one that does not is treated as absent, since there is nothing to read.
 */
export function guardedStorage(version: number): StateStorage {
  return {
    async getItem(name) {
      const raw = await safeStorage.getItem(name);
      if (raw == null) return null;
      let saved: { state?: unknown; version?: unknown } | null = null;
      try {
        saved = JSON.parse(raw);
      } catch {
        saved = null;
      }
      const readable = !!saved && typeof saved === 'object' && !!saved.state && typeof saved.state === 'object';
      if (!readable || (saved!.version ?? 0) !== version) {
        await safeStorage.setItem(`${name}-backup-${Date.now()}`, raw);
      }
      if (!readable && name === 'qaaf-progress' && !setAside) {
        setAside = true;
        setAsideListeners.forEach((l) => l());
      }
      return readable ? raw : null;
    },
    setItem: (name, value) => safeStorage.setItem(name, value),
    removeItem: (name) => safeStorage.removeItem(name),
  };
}

/**
 * The `migrate` for every persisted store: keep what was saved.
 *
 * Called for a save written under any other version. Its fields are kept as
 * they are and merged over the store's defaults, so a newer field this
 * version does not know survives the next write instead of being dropped,
 * and an older save keeps everything it has. The original is already in a
 * backup (`guardedStorage`), so a translation that turns out wrong can be
 * undone.
 */
export function keepSavedFields<T>(persisted: unknown): T {
  return (persisted && typeof persisted === 'object' ? persisted : {}) as T;
}

const kind = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/**
 * The `merge` for every persisted store: saved fields over the defaults, but
 * only where a field still has the type its default has.
 *
 * One wrong-typed field was enough to stop the app: `learnedWords: 5` left
 * Profile and every lesson blank, `srs: null` crashed Home on every load, and
 * nothing was backed up, because the save as a whole looked fine (QA round 5,
 * M29). Such a field now falls back to its default, and the save as read is
 * first copied to `<name>-backup-<time>` with the names of the fields that
 * were replaced. A field whose default is null has no type to check, and a
 * field the defaults do not have is kept, as `keepSavedFields` promises.
 * One level deep: what is inside a list or a record is not checked.
 */
export function keepWellTypedFields<T extends object>(name: string) {
  return (persisted: unknown, current: T): T => {
    if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) return current;
    const defaults = current as Record<string, unknown>;
    const kept: Record<string, unknown> = {};
    const replaced: string[] = [];
    for (const [key, value] of Object.entries(persisted)) {
      const fallback = defaults[key];
      if (fallback === undefined || fallback === null || kind(fallback) === kind(value)) kept[key] = value;
      else replaced.push(key);
    }
    if (replaced.length) {
      void safeStorage.setItem(`${name}-backup-${Date.now()}`, JSON.stringify({ state: persisted, replaced }));
    }
    return { ...current, ...kept };
  };
}
