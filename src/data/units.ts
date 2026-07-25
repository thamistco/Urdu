/**
 * The learning path — a linear, unlockable course in four stages
 * (Beginner → Elementary → Intermediate → Advanced).
 *
 * A lesson only *names* the content it draws from; the exercise generator turns
 * that into a varied set at runtime, so replays stay fresh and spaced repetition
 * can weave in past misses. Lessons interleave script, vocabulary, grammar,
 * sentence building and reading, which is what keeps a long course from feeling
 * like flashcards.
 */

import { LETTERS } from './letters';
import { GRAMMAR } from './grammar';
import { PASSAGES } from './sentences';
import type { Level } from './words';

export type LessonKind =
  | 'letters'
  | 'vocab'
  | 'phrases'
  | 'grammar'
  | 'sentences'
  | 'reading'
  | 'review';

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
  /** grammar concept id */
  conceptId?: string;
  /** reading passage id */
  passageId?: string;
  /** level filter for sentence lessons */
  level?: Level;
  xp: number;
  size: number;
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  level: Level;
  lessons: Lesson[];
};

const lettersOfGroup = (g: number) => LETTERS.filter((l) => l.group === g).map((l) => l.id);

// ---- small builders keep the path declarative and readable ----------------
let n = 0;
const uid = (p: string) => `${p}-${++n}`;

const V = (topic: string, title: string, subtitle: string, xp = 15, size = 7): Lesson => ({
  id: uid('v'), title, subtitle, icon: '✨', kind: 'vocab', topic, xp, size,
});
const L = (group: number, title: string, subtitle: string, xp = 20, size = 7): Lesson => ({
  id: uid('l'), title, subtitle, icon: '🔤', kind: 'letters', letterIds: lettersOfGroup(group), xp, size,
});
const G = (conceptId: string, title: string, subtitle: string, xp = 25, size = 6): Lesson => ({
  id: uid('g'), title, subtitle, icon: '📐', kind: 'grammar', conceptId, xp, size,
});
const S = (level: Level, title: string, subtitle: string, xp = 20, size = 5): Lesson => ({
  id: uid('s'), title, subtitle, icon: '🧩', kind: 'sentences', level, xp, size,
});
const R = (passageId: string, title: string, subtitle: string, xp = 25, size = 1): Lesson => ({
  id: uid('r'), title, subtitle, icon: '📖', kind: 'reading', passageId, xp, size,
});
const P = (title: string, subtitle: string, xp = 20, size = 6): Lesson => ({
  id: uid('p'), title, subtitle, icon: '💬', kind: 'phrases', xp, size,
});
const REV = (title = 'Unit review', subtitle = 'Mixed practice', xp = 30, size = 9): Lesson => ({
  id: uid('rev'), title, subtitle, icon: '🌙', kind: 'review', xp, size,
});

const GOLD = '#E8A33D', JADE = '#2E8B75', ROSE = '#C4456B', BLUE = '#5B93C7';

export const UNITS: Unit[] = [
  // ══════════════ BEGINNER ══════════════
  {
    id: 'u1', level: 'beginner', color: GOLD,
    title: 'Unit 1 · First Faces',
    subtitle: 'Your first letters and their four positions',
    lessons: [
      L(1, 'Meet the letters', 'alif · be · pe · te · Te'),
      V('first-words', 'First words', 'Everyday vocabulary', 15, 7),
      L(1, 'Position practice', 'Alone · start · middle · end'),
      V('greetings', 'Greetings', 'Say hello and thank you'),
      REV(),
    ],
  },
  {
    id: 'u2', level: 'beginner', color: JADE,
    title: 'Unit 2 · Hooks & Throats',
    subtitle: 'The jeem family, and saying who you are',
    lessons: [
      L(2, 'The jeem family', 'jeem · che · he · khe'),
      V('family', 'Family', 'The people you love'),
      G('g-pronouns', 'Pronouns', 'I, you, he, we, they'),
      G('g-to-be', 'Am, is, are', 'The verb "to be"'),
      S('beginner', 'Build a sentence', 'Put the words in order'),
      REV(),
    ],
  },
  {
    id: 'u3', level: 'beginner', color: ROSE,
    title: 'Unit 3 · The Non-Joiners',
    subtitle: 'Letters that break the flow',
    lessons: [
      L(3, 'Standing alone', 'daal · re · ze and friends'),
      V('food', 'Food & drink', 'From chai to roti'),
      V('colours', 'Colours', 'Describe what you see'),
      G('g-gender', 'Gender & number', 'Masculine and feminine'),
      S('beginner', 'More sentences', 'Say what something is'),
      REV(),
    ],
  },
  {
    id: 'u4', level: 'beginner', color: GOLD,
    title: 'Unit 4 · Teeth & Emphasis',
    subtitle: 'seen, sheen and the heavy letters',
    lessons: [
      L(4, 'The teeth', 'seen · sheen · swaad · zwaad'),
      V('numbers', 'Numbers', 'Zero to ten'),
      L(5, 'Deep sounds', 'to’e · zo’e · ain · ghain'),
      V('home', 'Around the home', 'Everyday objects'),
      REV(),
    ],
  },
  {
    id: 'u5', level: 'beginner', color: JADE,
    title: 'Unit 5 · Building Words',
    subtitle: 'kaaf, gaaf and the finishers',
    lessons: [
      L(6, 'k, q and g', 'fe · qaaf · kaaf · gaaf'),
      V('nature', 'Nature', 'Sky, water and earth'),
      L(7, 'The finishers', 'laam · meem · noon · waaw'),
      L(8, 'The h family', 'the two he’s, hamza and ye'),
      P('Everyday phrases', 'Speak, don’t just read'),
      REV('Script review', 'Every letter so far', 40, 12),
    ],
  },

  // ══════════════ ELEMENTARY ══════════════
  {
    id: 'u6', level: 'elementary', color: JADE,
    title: 'Unit 6 · You & Your Body',
    subtitle: 'Describe yourself and how you feel',
    lessons: [
      V('body', 'The body', 'Head, eye, hand, foot'),
      V('body-more', 'More body parts', 'Neck, arm, knee, skin'),
      V('feelings', 'Feelings', 'Happy, tired, hungry'),
      G('g-possess', 'Possession', 'کا، کی، کے — my, your, his'),
      S('elementary', 'Sentence building', 'Say where things are'),
      REV(),
    ],
  },
  {
    id: 'u7', level: 'elementary', color: GOLD,
    title: 'Unit 7 · Home & Family',
    subtitle: 'Your household and relatives',
    lessons: [
      V('rooms', 'Rooms', 'Every room in the house'),
      V('furniture', 'Furniture', 'What fills the rooms'),
      V('family-more', 'More family', 'Uncles, aunts, in-laws'),
      V('household', 'Household items', 'Broom, bucket, key'),
      G('g-postpositions', 'Postpositions', 'in, on, from — after the noun'),
      REV(),
    ],
  },
  {
    id: 'u8', level: 'elementary', color: ROSE,
    title: 'Unit 8 · The Living World',
    subtitle: 'Animals, birds and growing things',
    lessons: [
      V('animals', 'Animals', 'Dog, cat, horse, lion'),
      V('birds', 'Birds', 'Crow, parrot, peacock'),
      V('wildlife', 'Wild animals', 'Bear, deer, camel'),
      V('garden', 'The garden', 'Plants, seeds and leaves'),
      G('g-oblique', 'The oblique case', 'Nouns change before postpositions'),
      REV(),
    ],
  },
  {
    id: 'u9', level: 'elementary', color: BLUE,
    title: 'Unit 9 · At the Table',
    subtitle: 'Food, drink and the market',
    lessons: [
      V('fruits', 'Fruits', 'Mango, banana, grapes'),
      V('vegetables', 'Vegetables', 'Potato, onion, tomato'),
      V('drinks', 'Drinks', 'Chai, lassi, juice'),
      V('meals', 'Meals & dishes', 'Biryani, daal, naan'),
      R('r-1', 'Reading: My house', 'Your first passage'),
      REV(),
    ],
  },
  {
    id: 'u10', level: 'elementary', color: JADE,
    title: 'Unit 10 · Days & Things',
    subtitle: 'Time, clothes, school and numbers',
    lessons: [
      V('time', 'Time & day', 'Morning, night, today'),
      V('numbers-more', 'Bigger numbers', 'Eleven to a hundred'),
      V('clothing', 'Clothing', 'Shirt, cap, shoes'),
      V('school', 'School', 'Teacher, pen, book'),
      V('quantity', 'Quantity', 'How much and how many'),
      REV('Elementary review', 'Everything so far', 40, 12),
    ],
  },

  // ══════════════ INTERMEDIATE ══════════════
  {
    id: 'u11', level: 'intermediate', color: ROSE,
    title: 'Unit 11 · Every Day',
    subtitle: 'Routines and the present tense',
    lessons: [
      V('routine', 'Daily routine', 'Wake, wash, work, rest'),
      G('g-present', 'Present habitual', 'What you do every day'),
      V('verbs', 'Actions', 'Eat, drink, go, come'),
      V('verbs2', 'More actions', 'Hear, think, give, take'),
      G('g-continuous', 'Present continuous', 'What you are doing now'),
      R('r-3', 'Reading: My daily routine', 'A day from start to end'),
      REV(),
    ],
  },
  {
    id: 'u12', level: 'intermediate', color: GOLD,
    title: 'Unit 12 · Out & About',
    subtitle: 'The city, directions and transport',
    lessons: [
      V('places', 'Places', 'City, market, mosque'),
      V('city', 'In the city', 'Buildings and services'),
      V('directions', 'Directions', 'Left, right, near, far'),
      V('transport', 'Getting around', 'Car, bus, train, boat'),
      V('road', 'On the road', 'Traffic and driving'),
      S('intermediate', 'Sentence building', 'Say what you did and will do'),
      REV(),
    ],
  },
  {
    id: 'u13', level: 'intermediate', color: BLUE,
    title: 'Unit 13 · Money & Shopping',
    subtitle: 'Buying, selling and bargaining',
    lessons: [
      V('money', 'Money & shopping', 'Price, cheap, expensive'),
      V('restaurant', 'At a restaurant', 'Ordering and the bill'),
      G('g-past', 'Past tense', 'تھا، تھی — was and were'),
      V('grains', 'Grains & staples', 'The pantry basics'),
      R('r-2', 'Reading: A day at the market', 'Shopping in Urdu'),
      REV(),
    ],
  },
  {
    id: 'u14', level: 'intermediate', color: JADE,
    title: 'Unit 14 · Health & Work',
    subtitle: 'The doctor, the office and the future',
    lessons: [
      V('health', 'Health', 'Feeling unwell'),
      V('illness', 'Illness & symptoms', 'Fever, cough, pain'),
      V('jobs', 'Work & jobs', 'Professions'),
      V('office', 'The office', 'Working life'),
      G('g-future', 'Future tense', 'What you will do'),
      REV(),
    ],
  },
  {
    id: 'u15', level: 'intermediate', color: ROSE,
    title: 'Unit 15 · Travel & Time',
    subtitle: 'Journeys, countries and the calendar',
    lessons: [
      V('travel', 'Travel', 'Tickets, hotels, luggage'),
      V('airport', 'At the airport', 'Flights and checks'),
      V('countries', 'Countries & peoples', 'Places on the map'),
      V('days', 'Days & months', 'The week and the year'),
      V('timewords', 'Time words', 'Before, after, often'),
      REV('Intermediate review', 'Everything so far', 45, 12),
    ],
  },

  // ══════════════ ADVANCED ══════════════
  {
    id: 'u16', level: 'advanced', color: BLUE,
    title: 'Unit 16 · Describing People',
    subtitle: 'Character, appearance and relationships',
    lessons: [
      V('appearance', 'Appearance', 'How someone looks'),
      V('personality', 'Personality', 'Character and temperament'),
      V('relationships', 'Relationships', 'Friends, trust, marriage'),
      V('opposites', 'Opposites', 'Pairs that define each other'),
      G('g-imperative', 'Requests & commands', 'Asking politely'),
      REV(),
    ],
  },
  {
    id: 'u17', level: 'advanced', color: GOLD,
    title: 'Unit 17 · Mind & Feeling',
    subtitle: 'Subtler emotions and ideas',
    lessons: [
      V('emotions', 'Emotions & mind', 'Hope, patience, longing'),
      V('abstract', 'Ideas & values', 'Truth, justice, freedom'),
      G('g-subjunctive', 'The subjunctive', 'Maybe, should, if'),
      V('connectors', 'Linking words', 'But, because, although'),
      S('advanced', 'Complex sentences', 'Join ideas together'),
      REV(),
    ],
  },
  {
    id: 'u18', level: 'advanced', color: JADE,
    title: 'Unit 18 · Culture & Faith',
    subtitle: 'Festivals, poetry and belief',
    lessons: [
      V('culture', 'Culture & faith', 'Festivals and tradition'),
      V('festivals', 'Festivals', 'Eid, fairs and celebration'),
      V('faith', 'Faith & worship', 'Belief and practice'),
      V('literature', 'Literature', 'Poets, verse and story'),
      V('music-art', 'Music & art', 'Sound, colour and craft'),
      R('r-4', 'Reading: A letter to a friend', 'Formal written Urdu'),
      REV(),
    ],
  },
  {
    id: 'u19', level: 'advanced', color: ROSE,
    title: 'Unit 19 · The Modern World',
    subtitle: 'Technology, media and society',
    lessons: [
      V('tech', 'Modern life', 'Technology and news'),
      V('digital', 'Digital life', 'Screens, apps and online'),
      V('media', 'Media & news', 'Journalism and broadcast'),
      V('business', 'Business & trade', 'Commerce and money'),
      V('science', 'Science', 'Enquiry and discovery'),
      G('g-perfect', 'Completed actions', 'The نے construction'),
      REV(),
    ],
  },
  {
    id: 'u20', level: 'advanced', color: BLUE,
    title: 'Unit 20 · The Wider World',
    subtitle: 'Nature, services and mastery',
    lessons: [
      V('nature2', 'The natural world', 'Rivers, deserts, seasons'),
      V('landscape', 'Landscape', 'The shape of the land'),
      V('sky', 'Sky & space', 'Above the horizon'),
      V('services', 'Public services', 'Government and law'),
      V('emergency', 'Emergencies', 'Urgent help and safety'),
      V('lifeevents', 'Life events', 'Birth, success, destiny'),
      REV('Grand review', 'Everything you know', 60, 15),
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);
export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);
export const LESSON_ORDER: string[] = ALL_LESSONS.map((l) => l.id);
export const unitsByLevel = (level: Level) => UNITS.filter((u) => u.level === level);

/** Lessons the user must finish before this one unlocks (the preceding lesson). */
export function previousLessonId(id: string): string | undefined {
  const i = LESSON_ORDER.indexOf(id);
  return i > 0 ? LESSON_ORDER[i - 1] : undefined;
}

/**
 * Resolve any lesson id — including synthetic "practice" lessons that live
 * outside the path (daily review, per-topic drills, grammar and reading picked
 * from the Practice tab).
 */
export function resolveLesson(id: string): Lesson | undefined {
  const onPath = findLesson(id);
  if (onPath) return onPath;

  if (id === 'practice-review') {
    return { id, title: 'Daily Review', subtitle: 'Your due words & letters', icon: '🔁', kind: 'review', xp: 20, size: 10 };
  }
  if (id.startsWith('practice-topic-')) {
    const topic = id.slice('practice-topic-'.length);
    return { id, title: 'Topic practice', subtitle: topic, icon: '🎯', kind: 'vocab', topic, xp: 15, size: 8 };
  }
  if (id.startsWith('practice-grammar-')) {
    const conceptId = id.slice('practice-grammar-'.length);
    const c = GRAMMAR.find((g) => g.id === conceptId);
    return { id, title: c?.title ?? 'Grammar', subtitle: c?.summary ?? '', icon: '📐', kind: 'grammar', conceptId, xp: 20, size: 8 };
  }
  if (id.startsWith('practice-reading-')) {
    const passageId = id.slice('practice-reading-'.length);
    const p = PASSAGES.find((x) => x.id === passageId);
    return { id, title: p?.title ?? 'Reading', subtitle: 'Read and answer', icon: '📖', kind: 'reading', passageId, xp: 25, size: 1 };
  }
  return undefined;
}
