import { WORDS, type Word } from '../data/words';
import { LETTERS, type Letter } from '../data/letters';
import type { Exercise } from '../exercises/types';
import type { Miss } from '../exercises/generator';

/**
 * A lesson left partway, kept so it can be picked up where it was left (Q-038).
 *
 * Leaving a lesson threw away where the learner was, and lessons run to 49
 * steps: a learner called away at step 30 started again from the first card
 * (learning review, 2026-10-13; testers since). The answers' review grades
 * were already kept; the place, the questions and the lesson's own tallies
 * were not. The generator is random, so the questions themselves are kept,
 * not rebuilt: a rebuilt lesson asks different things.
 *
 * Words and letters are kept as references and looked up again on the way
 * back, so the copy stays small and a corrected gloss or picture shows. A
 * reference that no longer resolves throws the copy away rather than show a
 * question about something the course no longer has.
 *
 * Kept in the existing progress store, never a new storage key.
 */
export type LessonSnapshot = {
  /** `SNAPSHOT_VERSION` when saved; a copy from another shape is not offered. */
  v: number;
  lessonId: string;
  track: string;
  /** The day it was saved; a copy older than a week is not offered. */
  savedDay: string;
  /** The step to open on: the next one, when the step left was answered. */
  at: number;
  exercises: unknown[];
  correct: number;
  skipped: number;
  charged: string[];
  firstTry: [string, boolean][];
  misses: [string, unknown][];
  pretested: string[];
};

/**
 * The shape of a saved copy. A copy keeps its questions whole, so one saved
 * before an exercise's shape changed would be handed to a component that reads
 * the new shape, and crash the lesson on every open until it expired (second
 * check, 2026-10-31). Bump this whenever `exerciseShape` in the test changes;
 * the test pins both, so a change to an exercise cannot ship without it.
 */
export const SNAPSHOT_VERSION = 1;

/** How many lessons can be held part-done at once, most recent kept. */
export const SNAPSHOTS_KEPT = 3;
/** Days a part-done lesson is offered for. */
export const SNAPSHOT_DAYS = 7;

const WORD_BY_ID = new Map<string, Word>(WORDS.map((w) => [w.id, w]));
const LETTER_BY_ID = new Map<string, Letter>(LETTERS.map((l) => [l.id, l]));
const getWord = (id: string) => WORD_BY_ID.get(id);
const getLetter = (id: string) => LETTER_BY_ID.get(id);
// The course's own objects, by identity: a copy with the same id is kept whole.
const isWord = (v: Record<string, unknown>): v is Word =>
  typeof v.id === 'string' && getWord(v.id) === (v as unknown as Word);
const isLetter = (v: Record<string, unknown>): v is Letter =>
  typeof v.id === 'string' && getLetter(v.id) === (v as unknown as Letter);

/** Exercises (and anything holding them) with words and letters as references. */
export function encode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (isWord(o)) return { $w: o.id };
    if (isLetter(o)) return { $l: o.id };
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, encode(v)]));
  }
  return value;
}

class Unresolved extends Error {}

/** The reverse of `encode`; throws when a reference no longer resolves. */
export function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.$w === 'string') {
      const w = getWord(o.$w);
      if (!w) throw new Unresolved(o.$w);
      return w;
    }
    if (typeof o.$l === 'string') {
      const l = getLetter(o.$l);
      if (!l) throw new Unresolved(o.$l);
      return l;
    }
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, decode(v)]));
  }
  return value;
}

export type Restored = {
  exercises: Exercise[];
  at: number;
  correct: number;
  skipped: number;
  charged: Set<string>;
  firstTry: Map<string, boolean>;
  misses: Map<string, Miss>;
  pretested: Set<string>;
};

const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000);

/**
 * The part-done copy of this lesson on this track, if there is a usable one:
 * saved within `SNAPSHOT_DAYS`, every reference still in the course, and a
 * step inside the lesson. Otherwise null, and the lesson starts afresh.
 */
export function restoreSnapshot(
  snap: LessonSnapshot | undefined,
  lessonId: string,
  track: string,
  today: string
): Restored | null {
  if (!snap || snap.v !== SNAPSHOT_VERSION || snap.lessonId !== lessonId || snap.track !== track) return null;
  if (expired(snap, today)) return null;
  // Anything it cannot read starts the lesson afresh: a copy is a convenience,
  // and it is read during render, where a throw takes the screen down.
  try {
    const exercises = decode(snap.exercises) as Exercise[];
    if (!Array.isArray(exercises) || snap.at < 1 || snap.at >= exercises.length) return null;
    return {
      exercises,
      at: snap.at,
      correct: snap.correct,
      skipped: snap.skipped,
      charged: new Set(snap.charged),
      firstTry: new Map(snap.firstTry),
      misses: new Map(snap.misses.map(([k, m]) => [k, decode(m) as Miss])),
      pretested: new Set(snap.pretested),
    };
  } catch {
    return null;
  }
}

const expired = (snap: LessonSnapshot, today: string) => dayNumber(today) - dayNumber(snap.savedDay) > SNAPSHOT_DAYS;

/** The copy to keep, from the lesson's live state. */
export function takeSnapshot(
  lessonId: string,
  track: string,
  today: string,
  live: Omit<Restored, 'exercises'> & { exercises: readonly Exercise[] }
): LessonSnapshot {
  return {
    v: SNAPSHOT_VERSION,
    lessonId,
    track,
    savedDay: today,
    at: live.at,
    exercises: encode(live.exercises) as unknown[],
    correct: live.correct,
    skipped: live.skipped,
    charged: [...live.charged],
    firstTry: [...live.firstTry],
    misses: [...live.misses].map(([k, m]) => [k, encode(m)]),
    pretested: [...live.pretested],
  };
}

/**
 * The held copies with this one first, at most `SNAPSHOTS_KEPT`. Expired ones
 * go, so a copy no one can open does not hold a place.
 */
export function keepSnapshot(held: readonly LessonSnapshot[], snap: LessonSnapshot): LessonSnapshot[] {
  const others = held.filter(
    (s) => !(s.lessonId === snap.lessonId && s.track === snap.track) && !expired(s, snap.savedDay)
  );
  return [snap, ...others].slice(0, SNAPSHOTS_KEPT);
}
