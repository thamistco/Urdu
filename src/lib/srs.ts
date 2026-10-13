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
 *
 * Also drops an entry that is not a card at all (`3`, `[1, 2]`, or one with
 * neither a due time nor a last-seen time) and fills a missing ease, step
 * count or last-seen time. Such an entry was counted as a card that could
 * never come due, so Practice said "All caught up" over an empty queue (QA,
 * 2026-10-13); the save's other fields are already checked one level deep
 * (`keepWellTypedFields`).
 */
export function capIntervals(cards: Record<string, SrsCard>, now = Date.now()): Record<string, SrsCard> | null {
  let out: Record<string, SrsCard> | null = null;
  for (const [id, raw] of Object.entries(cards)) {
    const c = raw as Partial<SrsCard> | null;
    if (!c || typeof c !== 'object' || Array.isArray(c) || (!Number.isFinite(c.due) && !Number.isFinite(c.lastSeen))) {
      out ??= { ...cards };
      delete out[id];
      continue;
    }
    const lastSeen = Number.isFinite(c.lastSeen) ? (c.lastSeen as number) : now;
    const interval = Number.isFinite(c.interval) ? Math.min(c.interval as number, MAX_INTERVAL) : MAX_INTERVAL;
    const latest = lastSeen + interval * DAY;
    const whole = Number.isFinite(c.ease) && Number.isFinite(c.reps) && lastSeen === c.lastSeen && c.id === id;
    if (whole && interval === c.interval && Number.isFinite(c.due) && (c.due as number) <= latest) continue;
    out ??= { ...cards };
    out[id] = {
      ...(c as SrsCard),
      id,
      ease: Number.isFinite(c.ease) ? (c.ease as number) : 2.5,
      reps: Number.isFinite(c.reps) ? (c.reps as number) : 0,
      lastSeen,
      interval,
      due: Number.isFinite(c.due) ? Math.min(c.due as number, latest) : latest,
    };
  }
  return out;
}

export function isDue(card: SrsCard, now = Date.now()): boolean {
  return card.due <= now;
}

/**
 * Ids of due cards, the most fragile first, capped to `limit`.
 *
 * Shortest interval first, then longest overdue. Forgetting is steepest soon
 * after learning, so a word met yesterday for the first time loses most by
 * waiting, and a word last seen a month ago loses least. Sorting by how long
 * overdue alone put the newest words last: at three lessons a day, 286 words
 * taught by day 24 were never met again on a later day; fragile first cut
 * that to 174 on its own (learning review, 2026-10-10, P-026).
 */
export function dueQueue(cards: Record<string, SrsCard>, limit: number, now = Date.now()): string[] {
  return Object.values(cards)
    .filter((c) => isDue(c, now))
    .sort((a, b) => a.interval - b.interval || a.due - b.due)
    .slice(0, limit)
    .map((c) => c.id);
}

/**
 * The cards a learner's track can show.
 *
 * The Roman track teaches no letters, so letters graded before a switch to it
 * can never come back there. Counted anyway, they made Home offer a review of
 * them, and that review had nothing it could show: a white screen, and a card
 * that never cleared, since nothing could grade those letters (second check of
 * P-026, 2026-10-10). Everything that counts or queues due items goes through
 * here, so what Home promises is what a lesson can deliver.
 */
export function cardsOnTrack(
  cards: Record<string, SrsCard>,
  types: Record<string, string>,
  track: string
): Record<string, SrsCard> {
  if (track !== 'roman') return cards;
  return Object.fromEntries(Object.entries(cards).filter(([id]) => types[id] !== 'letter'));
}

/**
 * Past this many due items, the next thing Home offers is a catch-up review
 * rather than a new lesson (P-026). New lessons stay open on the path.
 *
 * The backlog never cleared: woven into new lessons, four due items a lesson
 * cannot keep up with the words each lesson adds, so at three lessons a day
 * 580 items were overdue after 30 days and half the words taught were never
 * met again on a later day. Offering a 20-item review first whenever more
 * than 30 are due measured 26 overdue after 30 days, every word met again,
 * most within a day, for about 40% fewer new words a day (simulated, every
 * answer right; learning review, 2026-10-10).
 *
 * Only if learners take the review. The gate is soft, and the same simulation
 * with the learner taking the catch-up half the time measured 53 overdue; a
 * fifth of the time, 426; never, 607, as without it (second check, 2026-10-10).
 * What it promises is the offer, not the result.
 */
export const REVIEW_FIRST_AT = 30;
/** The catch-up review's length: what the measured policy used. */
export const CATCH_UP_SIZE = 20;

export function reviewFirst(cards: Record<string, SrsCard>, now = Date.now()): boolean {
  return dueCount(cards, now) > REVIEW_FIRST_AT;
}

export function dueCount(cards: Record<string, SrsCard>, now = Date.now()): number {
  return Object.values(cards).filter((c) => isDue(c, now)).length;
}

/** The share of a unit review that due items may take (QA, 2026-10-13, H8). */
export const UNIT_REVIEW_DUE_SHARE = 0.3;

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
 * The Daily Review and the catch-up review are *for* this, so they take as
 * many as they have room for. A unit review is a review of its unit: filled
 * from the due queue first, the B2 reviews opened on beginner letter drills
 * and rev-land-and-sky on other units' words (QA, 2026-10-13, H8). It takes
 * due items for at most 30% of its slots, and fills the rest from its own
 * unit (`reviewWordPool` puts the unit's words first). Anything else is
 * teaching something new and takes a handful alongside.
 */
export function dueBudget(kind: string, size: number, lessonId?: string): number {
  if (kind !== 'review') return 4;
  const unitReview = !!lessonId && !lessonId.startsWith('practice-');
  return unitReview ? Math.round(size * UNIT_REVIEW_DUE_SHARE) : size;
}

/** A cheap 0..1 "strength" for UI meters. */
export function strength(card: SrsCard): number {
  return Math.min(1, card.interval / 21);
}
