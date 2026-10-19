import { useEffect, useRef } from 'react';
import { Platform, type View } from 'react-native';

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
    // Two frames on: in the commit itself the banner is not yet there (it
    // slides in), and the browser drops focus from the disabled button only
    // at its next update. Done at once, it found nothing to focus and focus
    // still fell to the page (check:stability, 2026-10-19).
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null;
        const lost = !active || active === document.body || active.matches('[aria-disabled="true"], :disabled');
        if (lost) (ref.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, step]);
  return ref;
}
