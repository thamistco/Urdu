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
      { id: 'u6-r1', title: 'Script review', subtitle: 'Everything so far', icon: '🏆', kind: 'review', xp: 40, size: 10 },
    ],
  },
  {
    id: 'u7',
    title: 'Unit 7 · People & Feelings',
    subtitle: 'Yourself, head to toe — and how you feel',
    color: '#C4456B',
    lessons: [
      { id: 'u7-l1', title: 'The body', subtitle: 'Head, eye, hand, foot', icon: '🖐️', kind: 'vocab', topic: 'body', xp: 15, size: 6 },
      { id: 'u7-l2', title: 'Feelings', subtitle: 'Happy, sad, tired, hungry', icon: '😊', kind: 'vocab', topic: 'feelings', xp: 15, size: 6 },
      { id: 'u7-l3', title: 'Everyday phrases', subtitle: 'Say how you are', icon: '💬', kind: 'phrases', xp: 20, size: 6 },
      { id: 'u7-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u8',
    title: 'Unit 8 · The Living World',
    subtitle: 'Animals and the natural world',
    color: '#2E8B75',
    lessons: [
      { id: 'u8-l1', title: 'Animals', subtitle: 'Dog, cat, horse, lion', icon: '🐐', kind: 'vocab', topic: 'animals', xp: 15, size: 6 },
      { id: 'u8-l2', title: 'Nature', subtitle: 'Moon, sun, tree, sea', icon: '🌙', kind: 'vocab', topic: 'nature', xp: 15, size: 6 },
      { id: 'u8-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u9',
    title: 'Unit 9 · At the Table',
    subtitle: 'The fruit stall and the sabzi shop',
    color: '#E8A33D',
    lessons: [
      { id: 'u9-l1', title: 'Fruits', subtitle: 'Mango, banana, grapes', icon: '🥭', kind: 'vocab', topic: 'fruits', xp: 15, size: 6 },
      { id: 'u9-l2', title: 'Vegetables', subtitle: 'Potato, onion, tomato', icon: '🥕', kind: 'vocab', topic: 'vegetables', xp: 15, size: 6 },
      { id: 'u9-l3', title: 'Food & drink', subtitle: 'From chai to roti', icon: '🍲', kind: 'vocab', topic: 'food', xp: 15, size: 6 },
      { id: 'u9-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 9 },
    ],
  },
  {
    id: 'u10',
    title: 'Unit 10 · Everyday Things',
    subtitle: 'What you wear and use',
    color: '#3FA88F',
    lessons: [
      { id: 'u10-l1', title: 'Clothing', subtitle: 'Shirt, cap, shoes', icon: '👕', kind: 'vocab', topic: 'clothing', xp: 15, size: 6 },
      { id: 'u10-l2', title: 'School', subtitle: 'Teacher, pen, book', icon: '🏫', kind: 'vocab', topic: 'school', xp: 15, size: 6 },
      { id: 'u10-l3', title: 'Around the home', subtitle: 'Everyday objects', icon: '🏠', kind: 'vocab', topic: 'home', xp: 15, size: 6 },
      { id: 'u10-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u11',
    title: 'Unit 11 · Time & Weather',
    subtitle: 'The day, the week, the sky',
    color: '#2E8B75',
    lessons: [
      { id: 'u11-l1', title: 'Time & day', subtitle: 'Morning, night, today', icon: '⏰', kind: 'vocab', topic: 'time', xp: 15, size: 6 },
      { id: 'u11-l2', title: 'Weather', subtitle: 'Cloud, wind, heat, cold', icon: '🌦️', kind: 'vocab', topic: 'weather', xp: 15, size: 6 },
      { id: 'u11-l3', title: 'Numbers', subtitle: 'Zero to ten', icon: '🔢', kind: 'vocab', topic: 'numbers', xp: 15, size: 6 },
      { id: 'u11-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u12',
    title: 'Unit 12 · Out & About',
    subtitle: 'Around town and getting there',
    color: '#C4456B',
    lessons: [
      { id: 'u12-l1', title: 'Places', subtitle: 'City, market, mosque', icon: '🏙️', kind: 'vocab', topic: 'places', xp: 15, size: 6 },
      { id: 'u12-l2', title: 'Getting around', subtitle: 'Car, bus, train, boat', icon: '🚗', kind: 'vocab', topic: 'transport', xp: 15, size: 6 },
      { id: 'u12-l3', title: 'Colours', subtitle: 'Describe your world', icon: '🎨', kind: 'vocab', topic: 'colours', xp: 15, size: 6 },
      { id: 'u12-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u13',
    title: 'Unit 13 · Actions & Describing',
    subtitle: 'Verbs and adjectives',
    color: '#E8A33D',
    lessons: [
      { id: 'u13-l1', title: 'Actions', subtitle: 'Eat, drink, go, come', icon: '🏃', kind: 'vocab', topic: 'verbs', xp: 15, size: 6 },
      { id: 'u13-l2', title: 'Describing', subtitle: 'Big, small, good, new', icon: '📏', kind: 'vocab', topic: 'adjectives', xp: 15, size: 6 },
      { id: 'u13-r1', title: 'Unit review', subtitle: 'Mixed practice', icon: '🌙', kind: 'review', xp: 25, size: 8 },
    ],
  },
  {
    id: 'u14',
    title: 'Unit 14 · Speak Up',
    subtitle: 'Ask questions and hold a conversation',
    color: '#2E8B75',
    lessons: [
      { id: 'u14-l1', title: 'Question words', subtitle: 'Who, what, where, when', icon: '❓', kind: 'vocab', topic: 'questions', xp: 15, size: 6 },
      { id: 'u14-l2', title: 'Family', subtitle: 'People you love', icon: '👨‍👩‍👧', kind: 'vocab', topic: 'family', xp: 15, size: 6 },
      { id: 'u14-l3', title: 'Conversation', subtitle: 'Greetings & introductions', icon: '💬', kind: 'phrases', xp: 25, size: 7 },
      { id: 'u14-r1', title: 'Grand review', subtitle: 'Everything you know', icon: '🏆', kind: 'review', xp: 50, size: 12 },
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
