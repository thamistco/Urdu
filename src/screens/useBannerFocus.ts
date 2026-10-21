import { useEffect, useRef } from 'react';
import { Platform, type View } from 'react-native';
import { keepFocus } from '../lib/focusLost';

/**
 * Where focus goes when the answer banner opens.
 *
 * Answering disables the tile or button that had focus, so the browser drops
 * focus to the page: a keyboard user's next Tab started again from the top of
 * the lesson, and a screen-reader user was left nowhere (design review,
 * 2026-10-19). Focus moves to the banner itself, not to Continue, so a held or
 * repeated Enter cannot skip past the answer; the next Tab reaches "Hear" and
 * Continue. Only when focus was lost: a learner whose focus is still on
 * something live is left where they are.
 */
export function useBannerFocus(open: boolean, step: number) {
  const ref = useRef<View>(null);
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    return keepFocus(() => (ref.current as unknown as HTMLElement | null)?.focus({ preventScroll: true }));
  }, [open, step]);
  return ref;
}
