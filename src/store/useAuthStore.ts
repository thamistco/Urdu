import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';

import { supabase, isAuthConfigured } from '../lib/supabase';
import { safeStorage } from './storage';
import { pullThenMerge } from '../lib/sync';

WebBrowser.maybeCompleteAuthSession();

type Provider = 'google' | 'apple';

type AuthState = {
  initialized: boolean;
  session: Session | null;
  isGuest: boolean;
  authConfigured: boolean;
  busy: null | Provider;
  init: () => Promise<void>;
  continueAsGuest: () => void;
  signIn: (provider: Provider) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
};

/** True once the user is past the gate — either signed in or chose guest. */
export const isAuthed = (s: AuthState) => !!s.session || s.isGuest;

async function nativeOAuth(provider: Provider): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: 'Backend not connected' };
  const redirectTo = makeRedirectUri({ scheme: 'harf', path: 'auth' });
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
    (set) => ({
      initialized: false,
      session: null,
      isGuest: false,
      authConfigured: isAuthConfigured,
      busy: null,

      init: async () => {
        if (!supabase) {
          set({ initialized: true, authConfigured: false });
          return;
        }
        const { data } = await supabase.auth.getSession();
        set({ session: data.session ?? null, initialized: true, authConfigured: true });
        if (data.session) pullThenMerge(data.session.user.id);

        supabase.auth.onAuthStateChange((_event, session) => {
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
          return {
            ok: false,
            message:
              'Sign-in isn’t connected yet. Add your Supabase keys (see SUPABASE_SETUP.md) to enable Google & Apple. You can continue as a guest for now.',
          };
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
        if (supabase) await supabase.auth.signOut().catch(() => {});
        set({ session: null, isGuest: false });
      },
    }),
    {
      name: 'harf-auth',
      storage: createJSONStorage(() => safeStorage),
      // only persist the guest choice; the session is owned by supabase
      partialize: (s) => ({ isGuest: s.isGuest }),
    }
  )
);
