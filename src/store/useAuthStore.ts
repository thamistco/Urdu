import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';

import { supabase, isAuthConfigured } from '../lib/supabase';
import { safeStorage } from './storage';
import { pullThenMerge, stopSync } from '../lib/sync';

WebBrowser.maybeCompleteAuthSession();

type Provider = 'google' | 'apple';

type AuthState = {
  initialized: boolean;
  session: Session | null;
  isGuest: boolean;
  authConfigured: boolean;
  busy: null | Provider;
  /**
   * The account deleted on this device, so its session cannot come back:
   * supabase-js keeps the stored session when the sign-out request fails on a
   * bad network, and a reload would restore it, showing a deleted account's
   * email until its token expired.
   */
  deletedUserId: string | null;
  init: () => Promise<void>;
  continueAsGuest: () => void;
  signIn: (provider: Provider) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  /**
   * Delete the signed-in learner's account and the progress saved with it.
   * Progress on this device is theirs and stays until they reset it.
   */
  deleteAccount: () => Promise<{ ok: boolean; message?: string }>;
};

/** True once the user is past the gate — either signed in or chose guest. */
export const isAuthed = (s: AuthState) => !!s.session || s.isGuest;

async function nativeOAuth(provider: Provider): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: 'Backend not connected' };
  const redirectTo = makeRedirectUri({ scheme: 'qaaf', path: 'auth' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return { ok: false, message: error?.message ?? 'Could not start sign-in' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { ok: false, message: 'Sign-in cancelled' };

  // PKCE: the redirect carries a `code` we exchange for a session.
  const code = /[?&]code=([^&]+)/.exec(result.url)?.[1];
  if (!code) return { ok: false, message: 'No auth code returned' };
  const { error: exErr } = await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
  if (exErr) return { ok: false, message: exErr.message };
  return { ok: true };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      initialized: false,
      session: null,
      isGuest: false,
      authConfigured: isAuthConfigured,
      busy: null,
      deletedUserId: null,

      init: async () => {
        if (!supabase) {
          set({ initialized: true, authConfigured: false });
          return;
        }
        const { data } = await supabase.auth.getSession();
        const deleted = (s: Session | null) => !!s && s.user.id === get().deletedUserId;
        if (deleted(data.session)) await supabase.auth.signOut().catch(() => {});
        const restored = deleted(data.session) ? null : (data.session ?? null);
        set({ session: restored, initialized: true, authConfigured: true });
        if (restored) pullThenMerge(restored.user.id);

        supabase.auth.onAuthStateChange((_event, session) => {
          if (deleted(session)) return;
          set({ session: session ?? null });
          if (session) {
            set({ isGuest: false });
            pullThenMerge(session.user.id);
          }
        });
      },

      continueAsGuest: () => set({ isGuest: true }),

      signIn: async (provider) => {
        if (!supabase) {
          // Written for a learner, not for whoever is wiring the backend up.
          // This string was once a setup instruction naming a vendor and a file
          // in the repository, and it reached the screen: with no keys in the
          // build, the two biggest buttons on the app's first screen answered a
          // tap with "Add your Supabase keys (see SUPABASE_SETUP.md)". Those
          // buttons no longer render when there is nothing behind them, so this
          // is now unreachable from the sign-in screen, and it stays honest in
          // case some other caller ever finds it.
          return { ok: false, message: 'Sign-in isn’t available right now. You can carry on without an account.' };
        }
        set({ busy: provider });
        try {
          if (Platform.OS === 'web') {
            const redirectTo = typeof window !== 'undefined' ? window.location.href.split('#')[0] : undefined;
            const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
            if (error) return { ok: false, message: error.message };
            return { ok: true }; // browser redirects away
          }
          return await nativeOAuth(provider);
        } finally {
          set({ busy: null });
        }
      },

      signOut: async () => {
        // Stop uploading under the account being left, as deleting one does.
        stopSync();
        if (supabase) await supabase.auth.signOut().catch(() => {});
        set({ session: null, isGuest: false });
      },

      /**
       * The stores require in-app deletion (Apple 5.1.1(v)), and the privacy
       * policy promised it before it existed (launch review, 2026-10-08,
       * proposal P-015). Not the whole of Apple's rule yet: a Sign in with
       * Apple account's tokens must also be revoked with Apple (TN3194), which
       * needs a server holding Apple's key (BACKLOG Q-024). `delete_my_account`
       * lives in supabase/schema.sql and deletes only the caller; the progress
       * row goes with the account.
       * Sync stops only once the delete has worked: stopped before, a failed
       * delete would leave a signed-in learner quietly no longer saving. An
       * upload already queued cannot bring the row back, because it
       * references a user that no longer exists.
       */
      deleteAccount: async () => {
        if (!supabase) return { ok: false, message: 'There is no account to delete on this device.' };
        const userId = get().session?.user.id ?? null;
        const { error } = await supabase.rpc('delete_my_account');
        if (error) {
          // A missing function (the owner has not yet re-run schema.sql) is
          // the one failure known to have changed nothing; anything else may
          // have reached the server, so it promises nothing about the account.
          const missing = error.code === 'PGRST202' || error.code === '42883';
          return {
            ok: false,
            message: missing
              ? 'Deleting accounts is not switched on yet, so your account is unchanged. Please try again later.'
              : 'Your account could not be deleted just now. Please try again later.',
          };
        }
        stopSync();
        set({ session: null, isGuest: false, deletedUserId: userId });
        await supabase.auth.signOut().catch(() => {});
        return { ok: true };
      },
    }),
    {
      name: 'qaaf-auth',
      storage: createJSONStorage(() => safeStorage),
      // the guest choice and a deleted account's id; the session is supabase's
      partialize: (s) => ({ isGuest: s.isGuest, deletedUserId: s.deletedUserId }),
    }
  )
);
