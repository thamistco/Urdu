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
import { PASSAGES, DIALOGUES } from './sentences';
import type { Level } from './words';
import type { LearnTrack } from '../store/useSettingsStore';
import { palette } from '../theme';

export type LessonKind = 'letters' | 'vocab' | 'phrases' | 'grammar' | 'sentences' | 'reading' | 'dialogue' | 'review';

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
  /** dialogue id */
  dialogueId?: string;
  /** level filter for sentence lessons */
  level?: Level;
  xp: number;
  size: number;
  /** what this lesson is called on the Roman track — see `Unit.romanTitle` */
  romanTitle?: string;
  romanSubtitle?: string;
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  level: Level;
  lessons: Lesson[];
  /**
   * What this unit is called on the Roman track.
   *
   * The first five units are named after the letter groups they teach, because
   * that is the spine of a script-first course: "First Faces", "The
   * Non-Joiners", "Teeth & Emphasis". Take the letters out for a learner who
   * asked not to be taught them and the names describe nothing that is left in
   * the unit. These name what actually remains.
   */
  romanTitle?: string;
  romanSubtitle?: string;
};

const lettersOfGroup = (g: number) => LETTERS.filter((l) => l.group === g).map((l) => l.id);

// ---- small builders keep the path declarative and readable ----------------

/**
 * A lesson's id is derived from what it teaches, never from where it sits.
 *
 * `completedLessons` in useProgressStore is persisted keyed by lesson id, so a
 * positional id (`v-12`, counted along the path) means that inserting one
 * lesson silently reassigns every later lesson's progress to different
 * content: a learner who finished "Colours" comes back to find "Numbers"
 * ticked instead. The course is going to be re-sequenced more than once, and
 * every one of those edits would corrupt saved progress.
 *
 * Keying on the topic, concept or passage the lesson draws from makes the id
 * survive re-ordering, because it names the content rather than the position.
 * The counter below is only a tie-break for the few lessons that legitimately
 * share a key — two letter lessons drilling the same group, several sentence
 * lessons at one level — and it is stable as long as those stay in the same
 * relative order, which re-sequencing whole topics does not disturb.
 */
const seen = new Map<string, number>();
const uid = (key: string) => {
  const n = (seen.get(key) ?? 0) + 1;
  seen.set(key, n);
  return n === 1 ? key : `${key}-${n}`;
};

// A vocabulary lesson needs room for its closing run — recall, build, type and
// the matching board — on top of the words it introduces; see the generator.
const V = (topic: string, title: string, subtitle: string, xp = 18, size = 9): Lesson => ({
  id: uid(`v-${topic}`),
  title,
  subtitle,
  icon: '✨',
  kind: 'vocab',
  topic,
  xp,
  size,
});
const L = (group: number, title: string, subtitle: string, xp = 20, size = 7): Lesson => ({
  id: uid(`l-${group}`),
  title,
  subtitle,
  icon: '🔤',
  kind: 'letters',
  letterIds: lettersOfGroup(group),
  xp,
  size,
});
const G = (conceptId: string, title: string, subtitle: string, xp = 25, size = 6): Lesson => ({
  id: uid(conceptId),
  title,
  subtitle,
  icon: '📐',
  kind: 'grammar',
  conceptId,
  xp,
  size,
});
const S = (level: Level, title: string, subtitle: string, xp = 20, size = 5): Lesson => ({
  id: uid(`s-${level}`),
  title,
  subtitle,
  icon: '🧩',
  kind: 'sentences',
  level,
  xp,
  size,
});
const R = (passageId: string, title: string, subtitle: string, xp = 25, size = 1): Lesson => ({
  id: uid(passageId),
  title,
  subtitle,
  icon: '📖',
  kind: 'reading',
  passageId,
  xp,
  size,
});
const D = (dialogueId: string, title: string, subtitle: string, xp = 25, size = 1): Lesson => ({
  id: uid(dialogueId),
  title,
  subtitle,
  icon: '💬',
  kind: 'dialogue',
  dialogueId,
  xp,
  size,
});
const P = (title: string, subtitle: string, xp = 20, size = 6): Lesson => ({
  id: uid('phrases'),
  title,
  subtitle,
  icon: '💬',
  kind: 'phrases',
  xp,
  size,
});
/**
 * A review closes a unit and draws on everything up to it, so unlike every
 * other lesson it has no content of its own to be named after. It takes the
 * unit's slug instead — the one id here that has to be written out rather
 * than derived.
 */
const REV = (slug: string, title = 'Unit review', subtitle = 'Mixed practice', xp = 30, size = 9): Lesson => ({
  id: uid(`rev-${slug}`),
  title,
  subtitle,
  icon: '🌙',
  kind: 'review',
  xp,
  size,
});

// A rotating set of unit accent colours — warm sunset tones plus one dusty
// teal for contrast, so a long path of units doesn't read as one flat hue.
// Deliberately not a violet/lavender: that reads as the same purple the rest
// of the palette moved away from.
const GOLD = palette.gold,
  JADE = palette.jadeLight,
  ROSE = palette.roseLight,
  BLUE = palette.accentTeal;

export const UNITS: Unit[] = [
  // ══════════════ BEGINNER ══════════════
  {
    id: 'u1',
    level: 'beginner',
    color: GOLD,
    title: 'Unit 1 · First Faces',
    subtitle: 'Your first letters and their four positions',
    romanTitle: 'Unit 1 · First Words',
    romanSubtitle: 'Everyday words, and how to greet someone',
    lessons: [
      L(1, 'Meet the letters', 'alif · be · pe · te · Te'),
      V('first-words', 'First words', 'Everyday vocabulary', 15, 7),
      L(1, 'Position practice', 'Alone · start · middle · end'),
      V('greetings', 'Greetings', 'Say hello and thank you'),
      P('Everyday phrases', 'Speak, don’t just read'),
      REV('first-faces'),
    ],
  },
  {
    id: 'u2',
    level: 'beginner',
    color: JADE,
    title: 'Unit 2 · Hooks & Throats',
    subtitle: 'The jeem family, and the people around you',
    romanTitle: 'Unit 2 · You and Yours',
    romanSubtitle: 'Family, and counting the people in it',
    lessons: [
      L(2, 'The jeem family', 'jeem · che · he · khe'),
      V('family', 'Family', 'The people you love'),
      V('family-more', 'More family', 'Aunts, uncles and in-laws'),
      V('numbers', 'Numbers', 'Zero to ten'),
      REV('hooks-and-throats'),
    ],
  },
  {
    id: 'u3',
    level: 'beginner',
    color: ROSE,
    title: 'Unit 3 · The Letters That Never Join',
    subtitle: 'Letters that break the flow, and what people do',
    romanTitle: 'Unit 3 · Work & School',
    romanSubtitle: 'Jobs, the classroom, and how much of things',
    lessons: [
      L(3, 'Standing alone', 'daal · re · ze and friends'),
      V('jobs', 'Jobs', 'What people do all day'),
      V('school', 'School', 'The classroom and what is in it'),
      V('quantity', 'How much', 'Very, a little, all, some'),
      REV('the-non-joiners'),
    ],
  },
  {
    id: 'u4',
    level: 'beginner',
    color: GOLD,
    title: 'Unit 4 · Saying Who You Are',
    subtitle: 'Pronouns, the verb "to be", and your first sentences',
    lessons: [
      V('rooms', 'Rooms', 'Where you sit, sleep and cook'),
      V('adjectives', 'Describing', 'Big, small, hot, cold'),
      G('g-pronouns', 'Pronouns', 'I, you, he, we, they'),
      G('g-to-be', 'Am, is, are', 'The verb "to be"'),
      S('beginner', 'Build a sentence', 'Put the words in order'),
      REV('saying-who-you-are'),
    ],
  },
  {
    id: 'u5',
    level: 'beginner',
    color: JADE,
    title: 'Unit 5 · Teeth & Emphasis',
    subtitle: 'seen, sheen and the heavy letters',
    romanTitle: 'Unit 5 · Home & When',
    romanSubtitle: 'The things around you, and telling the time',
    lessons: [
      L(4, 'The teeth', 'seen · sheen · swaad · zwaad'),
      V('home', 'Around the home', 'Everyday objects'),
      V('time', 'Time & day', 'Morning, night, today, tomorrow'),
      V('places', 'Places', 'The market, the school, the park'),
      REV('teeth-and-emphasis'),
    ],
  },
  {
    id: 'u6',
    level: 'beginner',
    color: ROSE,
    title: 'Unit 6 · Gender & Number',
    subtitle: 'Deep sounds, colours, and how words agree',
    romanTitle: 'Unit 6 · Colour & Agreement',
    romanSubtitle: 'Colours, and how words agree',
    lessons: [
      L(5, 'Deep sounds', 'to’e · zo’e · ain · ghain'),
      V('colours', 'Colours', 'Describe what you see'),
      G('g-gender', 'Gender & number', 'Masculine and feminine'),
      G('g-plurals', 'Making plurals', 'One book, two books'),
      S('beginner', 'More sentences', 'Say what something is'),
      REV('gender-and-number'),
    ],
  },
  {
    id: 'u7',
    level: 'beginner',
    color: GOLD,
    title: 'Unit 7 · Food & Nature',
    subtitle: 'kaaf, gaaf, and the world outside',
    romanTitle: 'Unit 7 · Food & Nature',
    romanSubtitle: 'The table, the sky, and what you do',
    lessons: [
      L(6, 'k, q and g', 'fe · qaaf · kaaf · gaaf'),
      V('food', 'Food & drink', 'From chai to roti'),
      V('nature', 'Nature', 'Sky, water and earth'),
      V('verbs', 'Actions', 'Eat, drink, go, come'),
      REV('food-and-nature'),
    ],
  },
  {
    id: 'u8',
    level: 'beginner',
    color: JADE,
    title: 'Unit 8 · Body & Feeling',
    subtitle: 'The finishers, yourself, and how you feel',
    romanTitle: 'Unit 8 · Body & Feeling',
    romanSubtitle: 'Yourself head to toe, and how you feel',
    lessons: [
      L(7, 'The finishers', 'laam · meem · noon · waaw'),
      V('body', 'The body', 'Name yourself, head to toe'),
      V('feelings', 'Feelings', 'Happy, tired, hungry'),
      V('animals', 'Animals', 'At home and in the wild'),
      REV('body-and-feeling'),
    ],
  },
  {
    id: 'u9',
    level: 'beginner',
    color: ROSE,
    title: 'Unit 9 · Asking & Opposites',
    subtitle: 'The last letters, questions, and words that pair up',
    romanTitle: 'Unit 9 · Asking & Opposites',
    romanSubtitle: 'Questions, opposites, and phrases you will say',
    lessons: [
      L(8, 'The h family', 'the two he’s, hamza and ye'),
      V('questions', 'Question words', 'Who, what, where, when'),
      V('opposites', 'Opposites', 'Easy and hard, clean and dirty'),
      V('days', 'Days & months', 'Monday to Sunday, and the year'),
      {
        ...REV('asking-and-opposites', 'Script review', 'Every letter so far', 40, 12),
        romanTitle: 'Unit review',
        romanSubtitle: 'Everything so far',
      },
    ],
  },
  {
    id: 'u10',
    level: 'beginner',
    color: GOLD,
    title: 'Unit 10 · Your First Readings',
    subtitle: 'Whole sentences, and your first pages of Urdu',
    lessons: [
      R('r-5', 'Reading: My family', 'Five lines you already know'),
      R('r-6', 'Reading: Tea time', 'A small everyday scene'),
      S('beginner', 'Sentence practice', 'Order the words yourself'),
      D('d-1', 'Talk: Meeting someone', 'Hello, and your name?'),
      R('r-7', 'Reading: Colours around me', 'Naming what you see'),
      D('d-2', 'Talk: Tea or coffee?', 'Being offered something'),
      {
        ...REV('your-first-readings', 'Beginner review', 'Script, words and sentences', 40, 12),
        romanSubtitle: 'Words, grammar and sentences',
      },
    ],
  },

  // ══════════════ ELEMENTARY ══════════════
  {
    id: 'u11',
    level: 'elementary',
    color: ROSE,
    title: 'Unit 11 · Every Day',
    subtitle: 'Routines and the present tense',
    lessons: [
      V('routine', 'Daily routine', 'Wake, wash, work, rest'),
      V('verbs2', 'More actions', 'Hear, think, give, take'),
      G('g-present', 'Present habitual', 'What you do every day'),
      G('g-continuous', 'Present continuous', 'What you are doing now'),
      R('r-3', 'Reading: My daily routine', 'A day from start to end'),
      REV('every-day'),
    ],
  },
  {
    id: 'u12',
    level: 'elementary',
    color: GOLD,
    title: 'Unit 12 · The Verbs You Need',
    subtitle: 'The engine room of the language',
    lessons: [
      V('verbs3', 'Essential verbs', 'The ones you cannot do without'),
      V('motion-verbs', 'Verbs of motion', 'Coming, going, moving things'),
      V('mind-verbs', 'Verbs of mind', 'Knowing, wanting, believing'),
      V('speech-verbs', 'Verbs of speech', 'Saying, asking, arguing'),
      S('intermediate', 'Sentence building', 'Put verbs to work'),
      REV('the-verbs-you-need'),
    ],
  },
  {
    id: 'u13',
    level: 'elementary',
    color: JADE,
    title: 'Unit 13 · Out & About',
    subtitle: 'The city, directions and transport',
    lessons: [
      V('city', 'In the city', 'Buildings and services'),
      V('directions', 'Directions', 'Left, right, near, far'),
      V('transport', 'Getting around', 'Car, bus, train, boat'),
      V('road', 'On the road', 'Traffic and driving'),
      S('intermediate', 'Sentence building', 'Say what you did and will do'),
      REV('out-and-about', 'Elementary review', 'Everything so far', 40, 12),
    ],
  },
  {
    id: 'u14',
    level: 'elementary',
    color: JADE,
    title: 'Unit 14 · You & Your Body',
    subtitle: 'Describe yourself and how you feel',
    lessons: [
      V('body-more', 'More body parts', 'Neck, arm, knee, skin'),
      G('g-possess', 'Possession', 'کا، کی، کے, my, your, his'),
      S('elementary', 'Sentence building', 'Say where things are'),
      REV('you-and-your-body'),
    ],
  },
  {
    id: 'u15',
    level: 'elementary',
    color: GOLD,
    title: 'Unit 15 · Home & Family',
    subtitle: 'Your household and relatives',
    lessons: [
      V('furniture', 'Furniture', 'What fills the rooms'),
      V('household', 'Household items', 'Broom, bucket, key'),
      G('g-postpositions', 'Postpositions', 'in, on, from, after the noun'),
      REV('home-and-family'),
    ],
  },
  {
    id: 'u16',
    level: 'elementary',
    color: BLUE,
    title: 'Unit 16 · Kitchen & Bath',
    subtitle: 'The working rooms of the house',
    lessons: [
      V('kitchen', 'In the kitchen', 'Utensils and cookware'),
      V('bathroom', 'Bathroom', 'Washing and grooming'),
      V('shapes', 'Shapes & sizes', 'Form, measure and dimension'),
      V('weather', 'Weather', 'Sun, rain, heat and cold'),
      G('g-negation', 'Saying no', 'نہیں · نہ · مت'),
      D('d-3', 'Talk: Where do you live?', 'Small talk that goes somewhere'),
      R('r-8', 'Reading: At school', 'A morning and an afternoon'),
      REV('kitchen-and-bath'),
    ],
  },
  {
    id: 'u17',
    level: 'elementary',
    color: ROSE,
    title: 'Unit 17 · The Living World',
    subtitle: 'Animals, birds and growing things',
    lessons: [
      V('birds', 'Birds', 'Crow, parrot, peacock'),
      V('wildlife', 'Wild animals', 'Bear, deer, camel'),
      V('garden', 'The garden', 'Plants, seeds and leaves'),
      G('g-oblique', 'The oblique case', 'Nouns change before postpositions'),
      REV('the-living-world'),
    ],
  },
  {
    id: 'u18',
    level: 'elementary',
    color: JADE,
    title: 'Unit 18 · At the Table',
    subtitle: 'Food, drink and the market',
    lessons: [
      V('fruits', 'Fruits', 'Mango, banana, grapes'),
      V('vegetables', 'Vegetables', 'Potato, onion, tomato'),
      V('drinks', 'Drinks', 'Chai, lassi, juice'),
      V('meals', 'Meals & dishes', 'Biryani, daal, naan'),
      D('d-4', 'Talk: At the fruit stall', 'Asking a price, and haggling'),
      R('r-1', 'Reading: My house', 'Your first passage'),
      REV('at-the-table'),
    ],
  },
  {
    id: 'u19',
    level: 'elementary',
    color: GOLD,
    title: 'Unit 19 · Days & Things',
    subtitle: 'Time, clothes, school and numbers',
    lessons: [
      V('numbers-more', 'Bigger numbers', 'Eleven to a hundred'),
      V('clothing', 'Clothing', 'Shirt, cap, shoes'),
      G('g-questions', 'Asking questions', 'who · what · where · when'),
      REV('days-and-things'),
    ],
  },
  {
    id: 'u20',
    level: 'elementary',
    color: BLUE,
    title: 'Unit 20 · People & Play',
    subtitle: 'Friends, childhood and joining ideas',
    lessons: [
      V('toys', 'Play & childhood', 'Games and growing up'),
      V('connectors', 'Linking words', 'And, but, because, although'),
      G('g-conjunctions', 'Joining ideas', 'and · but · or · because'),
      D('d-5', 'Talk: Asking the way', 'Directions, given and understood'),
      R('r-9', 'Reading: The garden behind the house', 'A quiet place'),
      R('r-10', 'Reading: My friend Sara', 'Talking about someone'),
      S('elementary', 'Sentence practice', 'Longer, joined-up sentences'),
      REV('people-and-play'),
    ],
  },

  // ══════════════ INTERMEDIATE ══════════════
  {
    id: 'u21',
    level: 'intermediate',
    color: BLUE,
    title: 'Unit 21 · Finding Your Way',
    subtitle: 'Asking, phoning and the mujhe feeling',
    lessons: [
      V('directions-more', 'Asking the way', 'Finding your way around'),
      V('phone', 'On the phone', 'Calling and messaging'),
      G('g-dative', 'The مجھے feeling', 'Liking, knowing, being hungry'),
      V('expressions', 'Useful expressions', 'The glue of real conversation'),
      D('d-6', 'Talk: On the phone', 'Taking a message'),
      R('r-11', 'Reading: A trip to Lahore', 'Telling a story in the past'),
      REV('finding-your-way'),
    ],
  },
  {
    id: 'u22',
    level: 'intermediate',
    color: ROSE,
    title: 'Unit 22 · Money & Shopping',
    subtitle: 'Buying, selling and the past tense',
    lessons: [
      V('money', 'Money & shopping', 'Price, cheap, expensive'),
      V('restaurant', 'At a restaurant', 'Ordering and the bill'),
      G('g-past', 'Past tense', 'تھا، تھی, was and were'),
      V('grains', 'Grains & staples', 'The pantry basics'),
      R('r-2', 'Reading: A day at the market', 'Shopping in Urdu'),
      REV('money-and-shopping'),
    ],
  },
  {
    id: 'u23',
    level: 'intermediate',
    color: GOLD,
    title: 'Unit 23 · Bank & Bargain',
    subtitle: 'Handling money and comparing prices',
    lessons: [
      V('bank', 'At the bank', 'Accounts and transactions'),
      V('shopping-talk', 'Bargaining', 'Haggling in the bazaar'),
      V('hotel', 'At a hotel', 'Staying somewhere'),
      G('g-comparative', 'Comparing things', 'Bigger than, the biggest'),
      D('d-8', 'Talk: Booking a room', 'Checking in somewhere'),
      S('intermediate', 'Sentence practice', 'Weigh one thing against another'),
      REV('bank-and-bargain'),
    ],
  },
  {
    id: 'u24',
    level: 'intermediate',
    color: JADE,
    title: 'Unit 24 · Health & Work',
    subtitle: 'The doctor, the office and the future',
    lessons: [
      V('health', 'Health', 'Feeling unwell'),
      V('illness', 'Illness & symptoms', 'Fever, cough, pain'),
      V('office', 'The office', 'Working life'),
      D('d-7', 'Talk: At the doctor', 'Describing a symptom'),
      G('g-future', 'Future tense', 'What you will do'),
      REV('health-and-work'),
    ],
  },
  {
    id: 'u25',
    level: 'intermediate',
    color: BLUE,
    title: 'Unit 25 · Working Life',
    subtitle: 'Careers, study and what you must do',
    lessons: [
      V('work-life', 'Working life', 'Colleagues, tasks and time off'),
      V('jobs-more', 'More professions', 'Trades and callings'),
      V('education', 'Education', 'Study, exams and learning'),
      G('g-obligation', 'Have to & should', 'چاہیے · ہے · پڑنا'),
      R('r-13', 'Reading: At the doctor', 'Describing what is wrong'),
      REV('working-life'),
    ],
  },
  {
    id: 'u26',
    level: 'intermediate',
    color: ROSE,
    title: 'Unit 26 · Travel & Time',
    subtitle: 'Journeys, countries and the calendar',
    lessons: [
      V('travel', 'Travel', 'Tickets, hotels, luggage'),
      V('airport', 'At the airport', 'Flights and checks'),
      V('countries', 'Countries & peoples', 'Places on the map'),
      V('timewords', 'Time words', 'Before, after, often'),
      G('g-ability', 'Can & could', 'سکنا, being able to'),
      REV('travel-and-time'),
    ],
  },
  {
    id: 'u27',
    level: 'intermediate',
    color: GOLD,
    title: 'Unit 27 · House & Field',
    subtitle: 'Tools, materials and the land',
    lessons: [
      V('tools', 'Tools', 'Building and mending'),
      V('materials', 'Materials', 'What things are made of'),
      V('appliances', 'Appliances', 'Machines around the house'),
      V('containers', 'Containers', 'Holding and carrying'),
      V('farm', 'Farm & field', 'Agriculture and livestock'),
      V('cooking', 'Cooking', 'In the kitchen, making food'),
      R('r-12', 'Reading: The rainy day', 'When the weather decides'),
      REV('house-and-field'),
    ],
  },
  {
    id: 'u28',
    level: 'intermediate',
    color: JADE,
    title: 'Unit 28 · Senses & Seasons',
    subtitle: 'What you taste, hear and wear',
    lessons: [
      V('senses', 'Sounds & senses', 'What you perceive'),
      V('tastes', 'Tastes & textures', 'Sweet, sour, hot and soft'),
      V('weather-more', 'Weather & seasons', 'The turning year'),
      V('sealife', 'Sea & insects', 'Water creatures and small crawlers'),
      V('sports', 'Sports & leisure', 'Games, hobbies and free time'),
      V('clothing-more', 'More clothing', 'Garments and adornment'),
      REV('senses-and-seasons'),
    ],
  },
  {
    id: 'u29',
    level: 'intermediate',
    color: BLUE,
    title: 'Unit 29 · Together',
    subtitle: 'Guests, weddings and showing respect',
    lessons: [
      V('social', 'Social life', 'People together'),
      V('celebrations', 'Weddings & guests', 'Hosting and being hosted'),
      V('honorifics', 'Respect & address', 'How Urdu shows deference'),
      D('d-9', 'Talk: Weekend plans', 'Making and accepting a plan'),
      R('r-14', 'Reading: Eid at home', 'A festival morning'),
      S('intermediate', 'Sentence practice', 'Speak about people politely'),
      REV('together'),
    ],
  },

  // ══════════════ ADVANCED ══════════════
  {
    id: 'u30',
    level: 'intermediate',
    color: ROSE,
    title: 'Unit 30 · Describing People',
    subtitle: 'Character, appearance and relationships',
    lessons: [
      V('appearance', 'Appearance', 'How someone looks'),
      V('personality', 'Personality', 'Character and temperament'),
      V('relationships', 'Relationships', 'Friends, trust, marriage'),
      D('d-10', 'Talk: A late arrival', 'Apologising, and waving it off'),
      G('g-imperative', 'Requests & commands', 'Asking politely'),
      REV('describing-people', 'Intermediate review', 'Everything so far', 45, 12),
    ],
  },
  {
    id: 'u31',
    level: 'advanced',
    color: GOLD,
    title: 'Unit 31 · Fine Description',
    subtitle: 'Precision, judgement and degree',
    lessons: [
      V('describing-more', 'Fine description', 'Precise and expressive adjectives'),
      V('quality', 'Judgement words', 'Evaluating and comparing'),
      V('measure-time', 'Measures & order', 'Sequence, rank and amount'),
      S('advanced', 'Complex sentences', 'Shade your meaning'),
      REV('fine-description'),
    ],
  },
  {
    id: 'u32',
    level: 'advanced',
    color: JADE,
    title: 'Unit 32 · Mind & Feeling',
    subtitle: 'Subtler emotions and ideas',
    lessons: [
      V('emotions', 'Emotions & mind', 'Hope, patience, longing'),
      V('abstract', 'Ideas & values', 'Truth, justice, freedom'),
      G('g-subjunctive', 'The subjunctive', 'Maybe, should, if'),
      S('advanced', 'Complex sentences', 'Join ideas together'),
      REV('mind-and-feeling'),
    ],
  },
  {
    id: 'u33',
    level: 'advanced',
    color: BLUE,
    title: 'Unit 33 · Thought & Belief',
    subtitle: 'Philosophy, faith and the sentences that pair up',
    lessons: [
      V('philosophy', 'Thought & philosophy', 'Reason, ethics and meaning'),
      V('faith', 'Faith & worship', 'Belief and practice'),
      G('g-relative', 'Relative clauses', 'جو … وہ, matched pairs'),
      V('idioms', 'Idioms & sayings', 'Phrases that mean more than their words'),
      R('r-16', 'Reading: Work and rest', 'An argument, gently made'),
      REV('thought-and-belief'),
    ],
  },
  {
    id: 'u34',
    level: 'advanced',
    color: ROSE,
    title: 'Unit 34 · Culture & Faith',
    subtitle: 'Festivals, poetry and belief',
    lessons: [
      V('culture', 'Culture & faith', 'Festivals and tradition'),
      V('festivals', 'Festivals', 'Eid, fairs and celebration'),
      V('literature', 'Literature', 'Poets, verse and story'),
      V('music-art', 'Music & art', 'Sound, colour and craft'),
      R('r-4', 'Reading: A letter to a friend', 'Formal written Urdu'),
      REV('culture-and-faith'),
    ],
  },
  {
    id: 'u35',
    level: 'advanced',
    color: GOLD,
    title: 'Unit 35 · Poetry & Story',
    subtitle: 'The literary heart of Urdu',
    lessons: [
      V('poetry', 'Poetry & music', 'The Urdu literary tradition'),
      V('subjects', 'Fields of study', 'What you can study'),
      G('g-compound', 'Compound verbs', 'The little verb that adds colour'),
      D('d-11', 'Talk: About a book', 'Disagreeing gently'),
      R('r-17', 'Reading: An evening of poetry', 'Why one couplet silences a room'),
      REV('poetry-and-story'),
    ],
  },
  {
    id: 'u36',
    level: 'advanced',
    color: JADE,
    title: 'Unit 36 · The Modern World',
    subtitle: 'Technology, media and enterprise',
    lessons: [
      V('tech', 'Modern life', 'Technology and news'),
      V('digital', 'Digital life', 'Screens, apps and online'),
      V('media', 'Media & news', 'Journalism and broadcast'),
      V('business', 'Business & trade', 'Commerce and money'),
      V('science', 'Science', 'Enquiry and discovery'),
      D('d-12', 'Talk: Leaving a job', 'A difficult thing, said well'),
      G('g-perfect', 'Completed actions', 'The نے construction'),
      REV('the-modern-world'),
    ],
  },
  {
    id: 'u37',
    level: 'advanced',
    color: BLUE,
    title: 'Unit 37 · State & Society',
    subtitle: 'Politics, law, economy and history',
    lessons: [
      V('politics', 'Politics', 'Power, parties and the state'),
      V('law', 'Law & justice', 'Courts, crime and rights'),
      V('economy', 'Economy', 'Wealth, work and markets'),
      V('history', 'History', 'The past and its record'),
      G('g-passive', 'The passive', 'When the doer disappears'),
      R('r-15', 'Reading: The old bookseller', 'A character sketch'),
      REV('state-and-society'),
    ],
  },
  {
    id: 'u38',
    level: 'advanced',
    color: ROSE,
    title: 'Unit 38 · Body & Medicine',
    subtitle: 'Clinical language and public help',
    lessons: [
      V('organs', 'Inside the body', 'Organs and inner workings'),
      V('medicine', 'Medicine', 'Clinical and specialist terms'),
      V('emergency', 'Emergencies', 'Urgent help and safety'),
      V('services', 'Public services', 'Government and law'),
      G('g-causative', 'Causatives', 'Do it · make someone do it'),
      REV('body-and-medicine'),
    ],
  },
  {
    id: 'u39',
    level: 'advanced',
    color: GOLD,
    title: 'Unit 39 · The Wider World',
    subtitle: 'Land, sky, formal Urdu and mastery',
    lessons: [
      V('nature2', 'The natural world', 'Rivers, deserts, seasons'),
      V('landscape', 'Landscape', 'The shape of the land'),
      V('sky', 'Sky & space', 'Above the horizon'),
      V('environment', 'Environment', 'Climate and conservation'),
      V('travel-more', 'Journeys', 'Planning and describing trips'),
      V('lifeevents', 'Life events', 'Birth, success, destiny'),
      V('formal', 'Formal & written', 'Letters, notices and officialese'),
      S('advanced', 'Complex sentences', 'Write the way Urdu writes'),
      REV('the-wider-world', 'Grand review', 'Everything you know', 60, 15),
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);
export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);
export const LESSON_ORDER: string[] = ALL_LESSONS.map((l) => l.id);
export const unitsByLevel = (level: Level) => UNITS.filter((u) => u.level === level);

/**
 * The path as a given track sees it.
 *
 * Someone on the Roman track has said they are not learning the alphabet, so
 * showing them thirteen lessons of letterforms and tracing — and blocking the
 * vocabulary behind them, since the path unlocks in order — is the app
 * ignoring the only choice it asked them to make. Those lessons are dropped
 * from the path entirely rather than hidden, so the sequence stays contiguous
 * and the next lesson is always the next one they can actually do.
 *
 * Nothing is deleted: `UNITS` remains the whole course, so switching back to
 * Script or Both restores the letters with whatever progress was made on them.
 */
export const isScriptLesson = (l: Lesson) => l.kind === 'letters';

/** Counted from the path rather than written down, so the numbers the track
 *  chooser quotes to a learner cannot drift away from the course. */
export const TOTAL_LESSON_COUNT = UNITS.reduce((n, u) => n + u.lessons.length, 0);
export const SCRIPT_LESSON_COUNT = UNITS.reduce((n, u) => n + u.lessons.filter(isScriptLesson).length, 0);

export function unitsForTrack(track: LearnTrack): Unit[] {
  if (track !== 'roman') return UNITS;
  return UNITS.map((u) => ({
    ...u,
    title: u.romanTitle ?? u.title,
    subtitle: u.romanSubtitle ?? u.subtitle,
    lessons: u.lessons
      .filter((l) => !isScriptLesson(l))
      .map((l) => ({ ...l, title: l.romanTitle ?? l.title, subtitle: l.romanSubtitle ?? l.subtitle })),
  })).filter((u) => u.lessons.length > 0);
}

export function lessonOrderForTrack(track: LearnTrack): string[] {
  return unitsForTrack(track).flatMap((u) => u.lessons.map((l) => l.id));
}

/** Lessons the user must finish before this one unlocks (the preceding lesson). */
export function previousLessonId(id: string, track: LearnTrack = 'both'): string | undefined {
  const order = lessonOrderForTrack(track);
  const i = order.indexOf(id);
  return i > 0 ? order[i - 1] : undefined;
}

/**
 * Resolve any lesson id — including synthetic "practice" lessons that live
 * outside the path (daily review, per-topic drills, grammar and reading picked
 * from the Practice tab).
 */
export function resolveLesson(id: string): Lesson | undefined {
  const cached = synthetic.get(id);
  if (cached) return cached;
  const built = buildLesson(id);
  // Practice lessons are constructed rather than looked up, so without this
  // every call returned an equal-but-different object. Anything that memoises
  // on the lesson — the exercise generator does — then rebuilt itself on every
  // render, replacing the question a learner was part-way through answering.
  // Lessons are immutable and there are few of them, so caching is free.
  if (built && !findLesson(id)) synthetic.set(id, built);
  return built;
}

/** Resolved practice lessons, kept by id so their identity is stable. */
const synthetic = new Map<string, Lesson>();

function buildLesson(id: string): Lesson | undefined {
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
    return { id, title: 'Topic practice', subtitle: topic, icon: '🎯', kind: 'vocab', topic, xp: 18, size: 9 };
  }
  if (id.startsWith('practice-grammar-')) {
    const conceptId = id.slice('practice-grammar-'.length);
    const c = GRAMMAR.find((g) => g.id === conceptId);
    return {
      id,
      title: c?.title ?? 'Grammar',
      subtitle: c?.summary ?? '',
      icon: '📐',
      kind: 'grammar',
      conceptId,
      xp: 20,
      size: 8,
    };
  }
  if (id.startsWith('practice-dialogue-')) {
    const dialogueId = id.slice('practice-dialogue-'.length);
    const d = DIALOGUES.find((x) => x.id === dialogueId);
    return {
      id,
      title: d?.title ?? 'Conversation',
      subtitle: 'Read and answer',
      icon: '💬',
      kind: 'dialogue',
      dialogueId,
      xp: 25,
      size: 1,
    };
  }
  if (id.startsWith('practice-reading-')) {
    const passageId = id.slice('practice-reading-'.length);
    const p = PASSAGES.find((x) => x.id === passageId);
    return {
      id,
      title: p?.title ?? 'Reading',
      subtitle: 'Read and answer',
      icon: '📖',
      kind: 'reading',
      passageId,
      xp: 25,
      size: 1,
    };
  }
  return undefined;
}
