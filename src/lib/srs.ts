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

export function newCard(id: string, now = Date.now()): SrsCard {
  return { id, ease: 2.5, interval: 0, reps: 0, due: now, lastSeen: now };
}

export function review(card: SrsCard, grade: SrsGrade, now = Date.now()): SrsCard {
  let { ease, interval, reps } = card;

  if (grade === 'again') {
    reps = 0;
    interval = 0; // due again this session / very soon
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);

    if (grade === 'easy') {
      ease += 0.15;
      interval = Math.round(interval * 1.3);
    } else {
      ease = Math.max(1.3, ease - 0.02);
    }
  }

  const due = grade === 'again' ? now + 60 * 1000 : now + interval * DAY;
  return { ...card, ease, interval, reps, due, lastSeen: now };
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
