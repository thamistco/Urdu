import { useEffect, useRef } from 'react';
import { Platform, type View } from 'react-native';
import { keepFocus } from '../lib/focusLost';

/** The lesson's "12 of 42" counter, the fallback when a step has no heading. */
export const STEP_COUNTER_ID = 'lesson-step-counter';

/**
 * Where focus goes when a lesson step opens.
 *
 * Continue and Got it unmount the button that had focus, so the browser
 * dropped focus to the page on every step: 12 of 12 transitions in l-1 left a
 * keyboard user starting again from the top, and a screen-reader user hearing
 * nothing about the new question (design review, 2026-10-29, Q-113). Focus
 * moves to the step's heading — the question, or a teaching card's title — so
 * the next thing read is what the step asks. A step with no heading falls back
 * to the "12 of 42" counter.
 *
 * Only while the step is open and only when focus was lost: once it is
 * answered, `useBannerFocus` owns focus, and a learner whose focus is on
 * something live is left where they are.
 */
export function useStepFocus(open: boolean, step: string) {
  const bodyRef = useRef<View>(null);
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    return keepFocus(() => {
      const body = bodyRef.current as unknown as HTMLElement | null;
      const target = body?.querySelector<HTMLElement>('[role="heading"]') ?? document.getElementById(STEP_COUNTER_ID);
      if (!target) return;
      // Headings are not focusable on their own; -1 lets a script focus them
      // without adding a Tab stop.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }, [open, step]);
  return bodyRef;
}
