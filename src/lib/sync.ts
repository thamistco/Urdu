import { supabase } from './supabase';
import { safeStorage } from '../store/storage';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Cloud save — mirrors the locally-persisted progress + settings blobs to a
 * single per-user row in Supabase (table `progress`, column `data jsonb`).
 *
 * Strategy (v1, last-write-wins):
 *  - On sign-in: if the account has no saved data, push the current (guest)
 *    progress up so nothing is lost. Otherwise adopt the cloud copy.
 *  - Afterwards, local changes are pushed up (debounced).
 */

const PROGRESS_KEY = 'harf-progress';
const SETTINGS_KEY = 'harf-settings';

let currentUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let subscribed = false;

async function readLocal() {
  const [progress, settings] = await Promise.all([
    safeStorage.getItem(PROGRESS_KEY),
    safeStorage.getItem(SETTINGS_KEY),
  ]);
  return { progress, settings };
}

type SyncPayload = { progress?: string | null; settings?: string | null };

/**
 * The Supabase client is created without a typed schema (see supabase.ts —
 * there is no backend to run codegen against until a project is configured),
 * so a row's `data` column comes back as `unknown`, not `SyncPayload`. It is
 * also, unlike everything else this app reads, a value nothing local wrote —
 * a network response, from a table this app's own migrations control but a
 * user's browser storage does not, that could in principle carry a stale
 * shape from a future/older schema version. Checked rather than trusted.
 */
function isSyncPayload(v: unknown): v is SyncPayload {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  const ok = (x: unknown) => x === undefined || x === null || typeof x === 'string';
  return ok(o.progress) && ok(o.settings);
}

async function applyRemote(data: SyncPayload) {
  if (data.progress) await safeStorage.setItem(PROGRESS_KEY, data.progress);
  if (data.settings) await safeStorage.setItem(SETTINGS_KEY, data.settings);
  // re-hydrate the zustand stores from the freshly written blobs
  await useProgressStore.persist?.rehydrate?.();
  await useSettingsStore.persist?.rehydrate?.();
}

export async function pushProgress() {
  if (!supabase || !currentUserId) return;
  const data = await readLocal();
  await supabase
    .from('progress')
    .upsert({ user_id: currentUserId, data, updated_at: new Date().toISOString() })
    .then(
      () => {},
      () => {}
    );
}

function schedulePush() {
  if (!supabase || !currentUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushProgress(), 1500);
}

/** Called after a session is established. Pulls cloud data or seeds it. */
export async function pullThenMerge(userId: string) {
  if (!supabase) return;
  currentUserId = userId;

  const { data, error } = await supabase.from('progress').select('data').eq('user_id', userId).maybeSingle();

  if (!error && data?.data && isSyncPayload(data.data)) {
    await applyRemote(data.data);
  } else {
    // no cloud copy yet — or a row present but not shaped like a payload
    // this version understands — seed it from the current (possibly guest)
    // progress rather than pass something unvalidated to applyRemote.
    await pushProgress();
  }

  // start mirroring local changes upward (subscribe once)
  if (!subscribed) {
    subscribed = true;
    useProgressStore.subscribe(() => schedulePush());
    useSettingsStore.subscribe(() => schedulePush());
  }
}

export function stopSync() {
  currentUserId = null;
  if (pushTimer) clearTimeout(pushTimer);
}
