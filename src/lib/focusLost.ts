/**
 * Whether keyboard focus has been lost: it is on the page itself, or on a
 * control that was just disabled and still holds focus for a moment before
 * the browser drops it. Web only; callers check the platform.
 */
export function focusLost(): boolean {
  const active = document.activeElement as HTMLElement | null;
  return !active || active === document.body || active.matches('[aria-disabled="true"], :disabled');
}

/**
 * Calls `restore` whenever focus is lost while this runs: two frames after it
 * starts, and after any later focusout that leaves nothing focused. Returns the
 * function that stops it.
 *
 * Two frames, because in the commit that disables a control the browser has
 * not yet dropped its focus, and what should receive it may still be sliding
 * in. Later drops too, because some do come later: after a wrong typed answer
 * focus fell to the page about one time in three, after the first check had
 * passed (QA, 2026-10-20).
 */
export function keepFocus(restore: () => void): () => void {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => focusLost() && restore());
  });
  const onFocusOut = () => {
    requestAnimationFrame(() => focusLost() && restore());
  };
  document.addEventListener('focusout', onFocusOut);
  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('focusout', onFocusOut);
  };
}
