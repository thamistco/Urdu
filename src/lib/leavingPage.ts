import { AppState, Platform } from 'react-native';

/**
 * Calls `cb` when the app is about to stop being seen: sent to the background,
 * the tab hidden, closed or reloaded. Returns the function that stops it.
 *
 * React's unmount does not run when a tab is reloaded or a phone discards it,
 * so anything held in memory until a screen closes is lost then: a lesson's
 * review grades were, and once a lesson could be picked up where it was left
 * that loss became permanent (second check, 2026-10-31, Q-038). react-native-web
 * reports a hidden tab as `background`; `pagehide` covers a reload or close.
 */
export function onLeavingPage(cb: () => void): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') cb();
  });
  const web = Platform.OS === 'web' && typeof window !== 'undefined';
  if (web) window.addEventListener('pagehide', cb);
  return () => {
    sub.remove();
    if (web) window.removeEventListener('pagehide', cb);
  };
}
