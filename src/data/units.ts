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

// A vocabulary lesson needs room for its closing run — recall, build, type and
// the matching board — on top of the words it introduces; see the generator.
const V = (topic: string, title: string, subtitle: string, xp = 18, size = 9): Lesson => ({
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

const GOLD = '#FFC72C', JADE = '#5FDC96', ROSE = '#FF7A72', BLUE = '#5AA9FF';

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
  {
    id: 'u6', level: 'beginner', color: ROSE,
    title: 'Unit 6 · Your First Readings',
    subtitle: 'Whole sentences, and your first pages of Urdu',
    lessons: [
      G('g-plurals', 'Making plurals', 'One book, two books'),
      R('r-5', 'Reading: My family', 'Five lines you already know'),
      R('r-6', 'Reading: Tea time', 'A small everyday scene'),
      S('beginner', 'Sentence practice', 'Order the words yourself'),
      R('r-7', 'Reading: Colours around me', 'Naming what you see'),
      REV('Beginner review', 'Script, words and sentences', 40, 12),
    ],
  },

  // ══════════════ ELEMENTARY ══════════════
  {
    id: 'u7', level: 'elementary', color: JADE,
    title: 'Unit 7 · You & Your Body',
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
    id: 'u8', level: 'elementary', color: GOLD,
    title: 'Unit 8 · Home & Family',
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
    id: 'u9', level: 'elementary', color: BLUE,
    title: 'Unit 9 · Kitchen & Bath',
    subtitle: 'The working rooms of the house',
    lessons: [
      V('kitchen', 'In the kitchen', 'Utensils and cookware'),
      V('bathroom', 'Bathroom', 'Washing and grooming'),
      V('shapes', 'Shapes & sizes', 'Form, measure and dimension'),
      V('weather', 'Weather', 'Sun, rain, heat and cold'),
      G('g-negation', 'Saying no', 'نہیں · نہ · مت'),
      R('r-8', 'Reading: At school', 'A morning and an afternoon'),
      REV(),
    ],
  },
  {
    id: 'u10', level: 'elementary', color: ROSE,
    title: 'Unit 10 · The Living World',
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
    id: 'u11', level: 'elementary', color: JADE,
    title: 'Unit 11 · At the Table',
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
    id: 'u12', level: 'elementary', color: GOLD,
    title: 'Unit 12 · Days & Things',
    subtitle: 'Time, clothes, school and numbers',
    lessons: [
      V('time', 'Time & day', 'Morning, night, today'),
      V('numbers-more', 'Bigger numbers', 'Eleven to a hundred'),
      V('clothing', 'Clothing', 'Shirt, cap, shoes'),
      V('school', 'School', 'Teacher, pen, book'),
      V('quantity', 'Quantity', 'How much and how many'),
      V('adjectives', 'Describing', 'Big, small, good, new'),
      V('questions', 'Question words', 'Who, what, where, when'),
      G('g-questions', 'Asking questions', 'who · what · where · when'),
      REV(),
    ],
  },
  {
    id: 'u13', level: 'elementary', color: BLUE,
    title: 'Unit 13 · People & Play',
    subtitle: 'Friends, childhood and joining ideas',
    lessons: [
      V('toys', 'Play & childhood', 'Games and growing up'),
      G('g-conjunctions', 'Joining ideas', 'and · but · or · because'),
      R('r-9', 'Reading: The garden behind the house', 'A quiet place'),
      R('r-10', 'Reading: My friend Sara', 'Talking about someone'),
      S('elementary', 'Sentence practice', 'Longer, joined-up sentences'),
      REV('Elementary review', 'Everything so far', 40, 12),
    ],
  },

  // ══════════════ INTERMEDIATE ══════════════
  {
    id: 'u14', level: 'intermediate', color: ROSE,
    title: 'Unit 14 · Every Day',
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
    id: 'u15', level: 'intermediate', color: GOLD,
    title: 'Unit 15 · The Verbs You Need',
    subtitle: 'The engine room of the language',
    lessons: [
      V('verbs3', 'Essential verbs', 'The ones you cannot do without'),
      V('motion-verbs', 'Verbs of motion', 'Coming, going, moving things'),
      V('mind-verbs', 'Verbs of mind', 'Knowing, wanting, believing'),
      V('speech-verbs', 'Verbs of speech', 'Saying, asking, arguing'),
      S('intermediate', 'Sentence building', 'Put verbs to work'),
      REV(),
    ],
  },
  {
    id: 'u16', level: 'intermediate', color: JADE,
    title: 'Unit 16 · Out & About',
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
    id: 'u17', level: 'intermediate', color: BLUE,
    title: 'Unit 17 · Finding Your Way',
    subtitle: 'Asking, phoning and the مجھے feeling',
    lessons: [
      V('directions-more', 'Asking the way', 'Finding your way around'),
      V('phone', 'On the phone', 'Calling and messaging'),
      G('g-dative', 'The مجھے feeling', 'Liking, knowing, being hungry'),
      V('expressions', 'Useful expressions', 'The glue of real conversation'),
      R('r-11', 'Reading: A trip to Lahore', 'Telling a story in the past'),
      REV(),
    ],
  },
  {
    id: 'u18', level: 'intermediate', color: ROSE,
    title: 'Unit 18 · Money & Shopping',
    subtitle: 'Buying, selling and the past tense',
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
    id: 'u19', level: 'intermediate', color: GOLD,
    title: 'Unit 19 · Bank & Bargain',
    subtitle: 'Handling money and comparing prices',
    lessons: [
      V('bank', 'At the bank', 'Accounts and transactions'),
      V('shopping-talk', 'Bargaining', 'Haggling in the bazaar'),
      V('hotel', 'At a hotel', 'Staying somewhere'),
      G('g-comparative', 'Comparing things', 'Bigger than, the biggest'),
      S('intermediate', 'Sentence practice', 'Weigh one thing against another'),
      REV(),
    ],
  },
  {
    id: 'u20', level: 'intermediate', color: JADE,
    title: 'Unit 20 · Health & Work',
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
    id: 'u21', level: 'intermediate', color: BLUE,
    title: 'Unit 21 · Working Life',
    subtitle: 'Careers, study and what you must do',
    lessons: [
      V('work-life', 'Working life', 'Colleagues, tasks and time off'),
      V('jobs-more', 'More professions', 'Trades and callings'),
      V('education', 'Education', 'Study, exams and learning'),
      G('g-obligation', 'Have to & should', 'چاہیے · ہے · پڑنا'),
      R('r-13', 'Reading: At the doctor', 'Describing what is wrong'),
      REV(),
    ],
  },
  {
    id: 'u22', level: 'intermediate', color: ROSE,
    title: 'Unit 22 · Travel & Time',
    subtitle: 'Journeys, countries and the calendar',
    lessons: [
      V('travel', 'Travel', 'Tickets, hotels, luggage'),
      V('airport', 'At the airport', 'Flights and checks'),
      V('countries', 'Countries & peoples', 'Places on the map'),
      V('days', 'Days & months', 'The week and the year'),
      V('timewords', 'Time words', 'Before, after, often'),
      G('g-ability', 'Can & could', 'سکنا — being able to'),
      REV(),
    ],
  },
  {
    id: 'u23', level: 'intermediate', color: GOLD,
    title: 'Unit 23 · House & Field',
    subtitle: 'Tools, materials and the land',
    lessons: [
      V('tools', 'Tools', 'Building and mending'),
      V('materials', 'Materials', 'What things are made of'),
      V('appliances', 'Appliances', 'Machines around the house'),
      V('containers', 'Containers', 'Holding and carrying'),
      V('farm', 'Farm & field', 'Agriculture and livestock'),
      V('cooking', 'Cooking', 'In the kitchen, making food'),
      R('r-12', 'Reading: The rainy day', 'When the weather decides'),
      REV(),
    ],
  },
  {
    id: 'u24', level: 'intermediate', color: JADE,
    title: 'Unit 24 · Senses & Seasons',
    subtitle: 'What you taste, hear and wear',
    lessons: [
      V('senses', 'Sounds & senses', 'What you perceive'),
      V('tastes', 'Tastes & textures', 'Sweet, sour, hot and soft'),
      V('weather-more', 'Weather & seasons', 'The turning year'),
      V('sealife', 'Sea & insects', 'Water creatures and small crawlers'),
      V('sports', 'Sports & leisure', 'Games, hobbies and free time'),
      V('clothing-more', 'More clothing', 'Garments and adornment'),
      REV(),
    ],
  },
  {
    id: 'u25', level: 'intermediate', color: BLUE,
    title: 'Unit 25 · Together',
    subtitle: 'Guests, weddings and showing respect',
    lessons: [
      V('social', 'Social life', 'People together'),
      V('celebrations', 'Weddings & guests', 'Hosting and being hosted'),
      V('honorifics', 'Respect & address', 'How Urdu shows deference'),
      R('r-14', 'Reading: Eid at home', 'A festival morning'),
      S('intermediate', 'Sentence practice', 'Speak about people politely'),
      REV('Intermediate review', 'Everything so far', 45, 12),
    ],
  },

  // ══════════════ ADVANCED ══════════════
  {
    id: 'u26', level: 'advanced', color: ROSE,
    title: 'Unit 26 · Describing People',
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
    id: 'u27', level: 'advanced', color: GOLD,
    title: 'Unit 27 · Fine Description',
    subtitle: 'Precision, judgement and degree',
    lessons: [
      V('describing-more', 'Fine description', 'Precise and expressive adjectives'),
      V('quality', 'Judgement words', 'Evaluating and comparing'),
      V('measure-time', 'Measures & order', 'Sequence, rank and amount'),
      S('advanced', 'Complex sentences', 'Shade your meaning'),
      REV(),
    ],
  },
  {
    id: 'u28', level: 'advanced', color: JADE,
    title: 'Unit 28 · Mind & Feeling',
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
    id: 'u29', level: 'advanced', color: BLUE,
    title: 'Unit 29 · Thought & Belief',
    subtitle: 'Philosophy, faith and the sentences that pair up',
    lessons: [
      V('philosophy', 'Thought & philosophy', 'Reason, ethics and meaning'),
      V('faith', 'Faith & worship', 'Belief and practice'),
      G('g-relative', 'Relative clauses', 'جو … وہ — matched pairs'),
      V('idioms', 'Idioms & sayings', 'Phrases that mean more than their words'),
      R('r-16', 'Reading: Work and rest', 'An argument, gently made'),
      REV(),
    ],
  },
  {
    id: 'u30', level: 'advanced', color: ROSE,
    title: 'Unit 30 · Culture & Faith',
    subtitle: 'Festivals, poetry and belief',
    lessons: [
      V('culture', 'Culture & faith', 'Festivals and tradition'),
      V('festivals', 'Festivals', 'Eid, fairs and celebration'),
      V('literature', 'Literature', 'Poets, verse and story'),
      V('music-art', 'Music & art', 'Sound, colour and craft'),
      R('r-4', 'Reading: A letter to a friend', 'Formal written Urdu'),
      REV(),
    ],
  },
  {
    id: 'u31', level: 'advanced', color: GOLD,
    title: 'Unit 31 · Poetry & Story',
    subtitle: 'The literary heart of Urdu',
    lessons: [
      V('poetry', 'Poetry & music', 'The Urdu literary tradition'),
      V('subjects', 'Fields of study', 'What you can study'),
      G('g-compound', 'Compound verbs', 'The little verb that adds colour'),
      R('r-17', 'Reading: An evening of poetry', 'Why one couplet silences a room'),
      S('advanced', 'Complex sentences', 'Write the way Urdu writes'),
      REV(),
    ],
  },
  {
    id: 'u32', level: 'advanced', color: JADE,
    title: 'Unit 32 · The Modern World',
    subtitle: 'Technology, media and enterprise',
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
    id: 'u33', level: 'advanced', color: BLUE,
    title: 'Unit 33 · State & Society',
    subtitle: 'Politics, law, economy and history',
    lessons: [
      V('politics', 'Politics', 'Power, parties and the state'),
      V('law', 'Law & justice', 'Courts, crime and rights'),
      V('economy', 'Economy', 'Wealth, work and markets'),
      V('history', 'History', 'The past and its record'),
      G('g-passive', 'The passive', 'When the doer disappears'),
      R('r-15', 'Reading: The old bookseller', 'A character sketch'),
      REV(),
    ],
  },
  {
    id: 'u34', level: 'advanced', color: ROSE,
    title: 'Unit 34 · Body & Medicine',
    subtitle: 'Clinical language and public help',
    lessons: [
      V('organs', 'Inside the body', 'Organs and inner workings'),
      V('medicine', 'Medicine', 'Clinical and specialist terms'),
      V('emergency', 'Emergencies', 'Urgent help and safety'),
      V('services', 'Public services', 'Government and law'),
      G('g-causative', 'Causatives', 'Do it · make someone do it'),
      REV(),
    ],
  },
  {
    id: 'u35', level: 'advanced', color: GOLD,
    title: 'Unit 35 · The Wider World',
    subtitle: 'Land, sky, formal Urdu and mastery',
    lessons: [
      V('nature2', 'The natural world', 'Rivers, deserts, seasons'),
      V('landscape', 'Landscape', 'The shape of the land'),
      V('sky', 'Sky & space', 'Above the horizon'),
      V('environment', 'Environment', 'Climate and conservation'),
      V('travel-more', 'Journeys', 'Planning and describing trips'),
      V('lifeevents', 'Life events', 'Birth, success, destiny'),
      V('formal', 'Formal & written', 'Letters, notices and officialese'),
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
    return { id, title: 'Topic practice', subtitle: topic, icon: '🎯', kind: 'vocab', topic, xp: 18, size: 9 };
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
