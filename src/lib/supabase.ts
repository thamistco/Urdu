import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client — created only when the project keys are configured via env.
 * This keeps the app fully runnable with NO backend (guest mode); sign-in and
 * cloud save light up automatically once EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY are provided (see SUPABASE_SETUP.md).
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isAuthConfigured = !!(url && anonKey);

export const supabase: SupabaseClient | null = isAuthConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        // On native we persist the session in AsyncStorage; on web the client
        // uses localStorage automatically.
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        // Native sign-in exchanges a `code` from the redirect (nativeOAuth in
        // useAuthStore.ts), which only the PKCE flow returns; this client's
        // default is the implicit flow, which returns a token in the URL
        // fragment and no code, so every native Google or Apple sign-in would
        // have ended "No auth code returned" (second check of P-036,
        // 2026-10-11). The web keeps the flow it has always used.
        flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
      },
    })
  : null;
