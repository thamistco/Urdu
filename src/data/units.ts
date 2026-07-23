/**
 * The learning path — a linear, unlockable sequence of units, each holding a
 * handful of short lessons (Duolingo's "path" model). A lesson names the
 * content it draws from (letters or a vocabulary topic); the lesson player
 * turns that pool into a varied set of exercises at runtime, so replays stay
 * fresh (Drops/Memrise style) and spaced repetition can weave in past misses.
 */

import { LETTERS } from './letters';

export type LessonKind = 'letters' | 'vocab' | 'phrases' | 'review';

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  kind: LessonKind;
  /** letter ids for script lessons */
  letterIds?: string[];
  /** vocabulary topic for word lessons */
  topic?: string;
  /** base XP for completing */
  xp: number;
  /** number of exercises to serve */
  size: number;
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  lessons: Lesson[];
};

const lettersOfGroup = (g: number) => LETTERS.filter((l) => l.group === g).map((l) => l.id);

export const UNITS: Unit[] = [
  {
    id: 'u1',
    title: 'Unit 1 · First Faces',
    subtitle: 'Your first letters and their positions',
    color: '#E8A33D',
    lessons: [
      { id: 'u1-l1', title: 'Meet the letters', subtitle: 'alif · be · pe · te · Te', icon: '🔤', kind: 'letters', letterIds: lettersOfGroup(1), xp: 15, size: 6 },
      { id: 'u1-l2', title: 'First words', subtitle: 'Everyday vocabulary', icon: '✨', kind: 'vocab', topic: 'first-words', xp: 15, size: 6 },
      { id: 'u1-l3', title: 'Position practice', subtitle: 'Alone · start · middle · end', icon: '🎯', kind: 'letters', letterIds: lettersOfGroup(1), xp: 20, size: 7 },
      { id: 'u1-r1', title: 'Unit review', subtitle: 'Bring it together', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u2',
    title: 'Unit 2 · Hooks & Throats',
    subtitle: 'The jeem family and soft sounds',
    color: '#2E8B75',
    lessons: [
      { id: 'u2-l1', title: 'The jeem family', subtitle: 'jeem · che · he · khe', icon: '🪝', kind: 'letters', letterIds: lettersOfGroup(2), xp: 15, size: 6 },
      { id: 'u2-l2', title: 'Family words', subtitle: 'People you love', icon: '👨‍👩‍👧', kind: 'vocab', topic: 'family', xp: 15, size: 6 },
      { id: 'u2-l3', title: 'Greetings', subtitle: 'Open a conversation', icon: '🤝', kind: 'vocab', topic: 'greetings', xp: 15, size: 6 },
      { id: 'u2-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u3',
    title: 'Unit 3 · The Non-Joiners',
    subtitle: 'Letters that break the flow',
    color: '#C4456B',
    lessons: [
      { id: 'u3-l1', title: 'Standing alone', subtitle: 'daal · re · ze and friends', icon: '✂️', kind: 'letters', letterIds: lettersOfGroup(3), xp: 20, size: 7 },
      { id: 'u3-l2', title: 'Food & drink', subtitle: 'From chai to roti', icon: '🍲', kind: 'vocab', topic: 'food', xp: 15, size: 6 },
      { id: 'u3-l3', title: 'Colours', subtitle: 'Describe your world', icon: '🎨', kind: 'vocab', topic: 'colours', xp: 15, size: 6 },
      { id: 'u3-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u4',
    title: 'Unit 4 · Teeth & Emphasis',
    subtitle: 'seen, sheen and the heavy letters',
    color: '#3FA88F',
    lessons: [
      { id: 'u4-l1', title: 'The teeth', subtitle: 'seen · sheen · swaad · zwaad', icon: '🦷', kind: 'letters', letterIds: lettersOfGroup(4), xp: 20, size: 7 },
      { id: 'u4-l2', title: 'Around the home', subtitle: 'Everyday objects', icon: '🏠', kind: 'vocab', topic: 'home', xp: 15, size: 6 },
      { id: 'u4-l3', title: 'Emphatic sounds', subtitle: 'to’e · zo’e · ain · ghain', icon: '🎙️', kind: 'letters', letterIds: lettersOfGroup(5), xp: 20, size: 7 },
      { id: 'u4-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u5',
    title: 'Unit 5 · Building Words',
    subtitle: 'kaaf, gaaf and the finishers',
    color: '#E8A33D',
    lessons: [
      { id: 'u5-l1', title: 'k, q, g', subtitle: 'fe · qaaf · kaaf · gaaf', icon: '🧱', kind: 'letters', letterIds: lettersOfGroup(6), xp: 20, size: 7 },
      { id: 'u5-l2', title: 'Nature', subtitle: 'Sky, water and earth', icon: '🌙', kind: 'vocab', topic: 'nature', xp: 15, size: 6 },
      { id: 'u5-l3', title: 'The finishers', subtitle: 'laam · meem · noon · waaw', icon: '🏁', kind: 'letters', letterIds: lettersOfGroup(7), xp: 20, size: 7 },
      { id: 'u5-l4', title: 'Numbers', subtitle: 'One to eight', icon: '🔢', kind: 'vocab', topic: 'numbers', xp: 15, size: 6 },
      { id: 'u5-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 30, size: 9 },
    ],
  },
  {
    id: 'u6',
    title: 'Unit 6 · The H Family',
    subtitle: 'Aspiration, hamza and the yes',
    color: '#2E8B75',
    lessons: [
      { id: 'u6-l1', title: 'The two h’s', subtitle: 'choṭī he · do-chashmī he · hamza · ye', icon: '💨', kind: 'letters', letterIds: lettersOfGroup(8), xp: 20, size: 7 },
      { id: 'u6-l2', title: 'Everyday phrases', subtitle: 'Speak, don’t just read', icon: '💬', kind: 'phrases', xp: 20, size: 5 },
      { id: 'u6-r1', title: 'Grand review', subtitle: 'Everything so far', icon: '🏆', kind: 'review', xp: 40, size: 10 },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);

/**
 * Resolve any lesson id — including the synthetic "practice" lessons that live
 * outside the path (daily review, and per-topic drills launched from Practice).
 */
export function resolveLesson(id: string): Lesson | undefined {
  const onPath = findLesson(id);
  if (onPath) return onPath;

  if (id === 'practice-review') {
    return {
      id,
      title: 'Daily Review',
      subtitle: 'Your due words & letters',
      icon: '🔁',
      kind: 'review',
      xp: 20,
      size: 10,
    };
  }
  if (id.startsWith('practice-topic-')) {
    const topic = id.slice('practice-topic-'.length);
    return {
      id,
      title: 'Topic practice',
      subtitle: topic,
      icon: '🎯',
      kind: 'vocab',
      topic,
      xp: 15,
      size: 7,
    };
  }
  return undefined;
}

/** Ordered lesson ids — used to compute unlock state along the path. */
export const LESSON_ORDER: string[] = ALL_LESSONS.map((l) => l.id);
