/**
 * Spaced repetition — a compact SM-2 variant. Each learnable item (a letter or
 * a word) carries a memory record; correct answers push the next review further
 * out, misses reset it to soon. The review queue surfaces whatever is due, so
 * "the words you got wrong come back first" is a real mechanic, not a promise.
 */

export type SrsGrade = 'again' | 'good' | 'easy';

export type SrsCard = {
  id: string;
  /** ease factor (SM-2), starts at 2.5 */
  ease: number;
  /** current interval in days */
  interval: number;
  /** consecutive correct answers */
  reps: number;
  /** epoch ms when next due */
  due: number;
  /** epoch ms last seen */
  lastSeen: number;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * The longest gap the schedule sets: a year. SM-2 has no ceiling, and before
 * P-009 a word graded in every session climbed to intervals of billions of
 * days, so it would never come back (second check, 2026-10-09). A year still
 * reads as full strength on every meter.
 */
export const MAX_INTERVAL = 365;

export function newCard(id: string, now = Date.now()): SrsCard {
  return { id, ease: 2.5, interval: 0, reps: 0, due: now, lastSeen: now };
}

export function review(card: SrsCard, grade: SrsGrade, now = Date.now()): SrsCard {
  let { ease, interval, reps } = card;

  // Right before it was due: the answer shows the word is still there, not
  // that it survived the wait the schedule was testing. Without this, a word
  // taught in the morning and met again in the afternoon's lesson went from
  // 1 day to 3 before a single night had passed, and at ten lessons a day 38
  // words reached 3 days or more on the day they were taught (P-009,
  // 2026-10-07-learning.md). So the interval grows only by the time that
  // really passed (Anki's rule for early reviews), and reps and ease stay.
  //
  // When that time has not earned a longer gap, the card is left exactly as
  // it was, due date and all. Moving the due date on from now, as the first
  // draft did, meant a word met in every short session was always due
  // tomorrow and never came due at all: at three sessions a day it sat at
  // 1 day for four weeks of right answers (second check, 2026-10-09).
  //
  // Not for a card relearning after a miss (reps 0): it has no interval to
  // keep, and holding it at 0 would leave it due forever.
  if (grade !== 'again' && reps > 0 && now < card.due) {
    const earned = Math.round(((now - card.lastSeen) / DAY) * ease);
    if (earned <= interval) return card;
    const grown = Math.min(earned, MAX_INTERVAL);
    return { ...card, interval: grown, due: now + grown * DAY, lastSeen: now };
  }

  if (grade === 'again') {
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    // The first two steps are floors, not fixed values: a card that early
    // answers have already grown still grows from where it is, so answering
    // on time never earns less than answering a little early would have.
    const step = reps === 1 ? 1 : reps === 2 ? 3 : 0;
    interval = Math.max(step, Math.round(interval * ease));

    if (grade === 'easy') {
      ease += 0.15;
      interval = Math.round(interval * 1.3);
    } else {
      ease = Math.max(1.3, ease - 0.02);
    }
    interval = Math.min(interval, MAX_INTERVAL);
  }

  // A miss is due at once. It used to be due a minute later, which served
  // nothing, since grades are applied only when a lesson ends, and it made
  // the lesson's "the ones that slipped are already queued" false for that
  // minute: Review straight afterwards said "All caught up" (QA, 2026-10-09).
  const due = grade === 'again' ? now : now + interval * DAY;
  return { ...card, ease, interval, reps, due, lastSeen: now };
}

/**
 * Bring saved cards back inside the year: cards the old schedule pushed out
 * of reach, some so far that the number saved as null. Returns null when none
 * needs it, so saved progress is not rewritten for nothing.
 */
export function capIntervals(cards: Record<string, SrsCard>): Record<string, SrsCard> | null {
  let out: Record<string, SrsCard> | null = null;
  for (const [id, c] of Object.entries(cards)) {
    const interval = Number.isFinite(c.interval) ? Math.min(c.interval, MAX_INTERVAL) : MAX_INTERVAL;
    const latest = c.lastSeen + interval * DAY;
    if (interval === c.interval && Number.isFinite(c.due) && c.due <= latest) continue;
    out ??= { ...cards };
    out[id] = { ...c, interval, due: Number.isFinite(c.due) ? Math.min(c.due, latest) : latest };
  }
  return out;
}

export function isDue(card: SrsCard, now = Date.now()): boolean {
  return card.due <= now;
}

/** Ids of due cards, soonest-overdue first, capped to `limit`. */
export function dueQueue(cards: Record<string, SrsCard>, limit: number, now = Date.now()): string[] {
  return Object.values(cards)
    .filter((c) => isDue(c, now))
    .sort((a, b) => a.due - b.due)
    .slice(0, limit)
    .map((c) => c.id);
}

export function dueCount(cards: Record<string, SrsCard>, now = Date.now()): number {
  return Object.values(cards).filter((c) => isDue(c, now)).length;
}

/**
 * How many due items a lesson should ask for.
 *
 * Scheduling policy, so it lives with the scheduler rather than in the screen
 * that happens to call it — where it sat as a bare `4` for every kind of lesson
 * alike. That quietly defeated the whole mechanism: with forty items due, a
 * fifteen-question review revisited four of them and filled the remaining eleven
 * from the general pool of everything taught so far, so the items closest to
 * being forgotten — the only ones the schedule cares about — were mostly left
 * out.
 *
 * A review lesson is *for* this, so it takes as many as it has room for.
 * Anything else is teaching something new and takes a handful alongside.
 */
export function dueBudget(kind: string, size: number): number {
  return kind === 'review' ? size : 4;
}

/** A cheap 0..1 "strength" for UI meters. */
export function strength(card: SrsCard): number {
  return Math.min(1, card.interval / 21);
}
