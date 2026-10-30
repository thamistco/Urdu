import { Platform } from 'react-native';

/**
 * The keyboard for every radio group and tab bar on the web (Q-131, Q-140).
 *
 * react-native-web 0.19 answers Space only on a button, so on a radio or a
 * tab Space did nothing, arrows did nothing, and every item was its own Tab
 * stop: four on the goal step, three on the tab bar (design reviews,
 * 2026-10-26 and 30). One handler here works from the roles the groups
 * already carry, rather than a hook at each of eleven call sites, and so it
 * also covers the next group anyone writes:
 *
 * - Space chooses the focused item (Enter already did).
 * - Arrow keys move to the next or previous item, wrapping; Home and End go
 *   to the ends. In a radio group moving also chooses, as radios do. In a
 *   tab bar it only moves focus, so arrowing does not change screen. A group
 *   can say otherwise with `data-arrows` (`moveOnly` / `choose`): Settings'
 *   choices take effect at once, so there arrows only move.
 * - A group is one Tab stop. Tab from any item leaves the group, and Tab into
 *   one lands on its chosen item.
 *
 * Choosing is a click on the item, which is what a Pressable answers.
 */

const ITEM = '[role="radio"],[role="tab"]';
const GROUP = '[role="radiogroup"],[role="tablist"]';
const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]';

/** Mark a group's arrows: spread onto its View (web only; react-native-web writes `data-arrows`). */
export const arrowsOnly = (mode: 'moveOnly' | 'choose') => ({ dataSet: { arrows: mode } }) as object;

const shown = (el: HTMLElement) =>
  el.getClientRects().length > 0 &&
  getComputedStyle(el).visibility !== 'hidden' &&
  !el.closest('[aria-hidden="true"]') &&
  el.getAttribute('aria-disabled') !== 'true';

const itemsOf = (group: Element) => Array.from(group.querySelectorAll<HTMLElement>(ITEM)).filter(shown);
const isChosen = (el: Element) =>
  el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-selected') === 'true';
const focusables = () =>
  Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && shown(el));

/** Tab from inside a group goes to the first thing past it, either way. */
function leaveGroup(items: HTMLElement[], back: boolean, e: KeyboardEvent) {
  const all = focusables();
  const next = back ? all[all.indexOf(items[0]) - 1] : all[all.indexOf(items[items.length - 1]) + 1];
  tabbing = true;
  if (next) {
    e.preventDefault();
    next.focus();
  }
}

/** Where an arrow, Home or End goes from item `at` of `n`, or null for any other key. */
function arrowTo(key: string, at: number, n: number): number | null {
  const step: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  if (key in step) return (at + step[key] + n) % n;
  if (key === 'Home') return 0;
  if (key === 'End') return n - 1;
  return null;
}

function onKeyDown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const item = (e.target as HTMLElement | null)?.closest?.<HTMLElement>(ITEM);
  const group = item?.closest(GROUP);
  if (!item || !group) {
    if (e.key === 'Tab') tabbing = true;
    return;
  }
  const items = itemsOf(group);
  const at = items.indexOf(item);
  if (at < 0) return;
  if (e.key === ' ') {
    e.preventDefault();
    if (!isChosen(item)) item.click();
    return;
  }
  if (e.key === 'Tab') return leaveGroup(items, e.shiftKey, e);
  moveWithin(group, items, at, e);
}

/** An arrow, Home or End: focus moves, and in a radio group the choice follows unless the group says not. */
function moveWithin(group: Element, items: HTMLElement[], at: number, e: KeyboardEvent) {
  const to = arrowTo(e.key, at, items.length);
  if (to === null) return;
  e.preventDefault();
  const target = items[to];
  target.focus();
  const mode =
    group.getAttribute('data-arrows') ?? (items[at].getAttribute('role') === 'radio' ? 'choose' : 'moveOnly');
  if (mode === 'choose' && !isChosen(target)) target.click();
}

/** Set by a Tab press, so only keyboard entry into a group is redirected. */
let tabbing = false;

function onFocusIn(e: FocusEvent) {
  const wasTab = tabbing;
  tabbing = false;
  if (!wasTab) return;
  const item = (e.target as HTMLElement | null)?.closest?.<HTMLElement>(ITEM);
  const group = item?.closest(GROUP);
  if (!item || !group) return;
  const from = e.relatedTarget as Node | null;
  if (from && group.contains(from)) return;
  const chosen = itemsOf(group).find(isChosen);
  if (chosen && chosen !== item) chosen.focus();
}

/** Installs the handlers; returns the function that removes them. Web only. */
export function installGroupKeys(): () => void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return () => {};
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('focusin', onFocusIn);
  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('focusin', onFocusIn);
  };
}
