/* eslint-disable */
/**
 * Does a unit hold things that belong together?
 *
 * `check:unit-names` proves a unit says what is inside it. This one asks the
 * prior question: whether what is inside it should be. Both were prompted by
 * the same reader's complaint about "Numbers & Clothes", a unit whose name was
 * perfectly accurate and whose contents were arbitrary. Naming a grab bag
 * honestly does not stop it being one.
 *
 * Measured before this existed: of 40 units that teach vocabulary, 18 held a
 * single theme and 22 mixed two or more, three of them holding three at once.
 * Whole themes were scattered — "describing" across seven units, "nature"
 * across seven, "counting" across six — so a learner met numbers in unit 2,
 * again in unit 3, again in unit 19 and again in unit 22, with four unrelated
 * units in between each time.
 *
 * The rule: a unit's vocabulary may span at most two themes. Two rather than
 * one because some units honestly pair — the house and what you wear in it,
 * the senses and the seasons you feel with them — and forcing those apart
 * would make the course worse, not better. Three is where a unit stops having
 * a subject.
 *
 * ## Where the themes come from
 *
 * The table below is a judgement, not a measurement, and it is the only part
 * of this check that is. It groups the course's own topics the way CEFR groups
 * language use, by the domain a learner is in: personal life, the public
 * world, work and study. Writing it out corrected two of my own mistakes —
 * `sports` is "game, ball, cricket, to swim, hobby", which is leisure and not
 * an object, and `tastes` is "salty, bitter, stale, dry", which is the senses
 * and not food. Both had been filed by their names rather than their contents.
 *
 * ## What this is not
 *
 * It is not a claim that thematic grouping teaches vocabulary better. The
 * multilevel meta-analysis of semantic clustering (21 studies, 37 effect
 * sizes) puts the difference at g = 0.01, which is nothing. The case for it is
 * Drops' case for their own units: a learner should be able to find the part
 * of a course that matches what they want, and know what they have just
 * finished. That is a claim about navigation, and this check is about
 * navigation.
 *
 * Run with:  npm run check:unit-themes
 */

const { load } = require('./lib/load-ts');
const { UNITS } = load('src/data/units.ts');

/** How many themes one unit's vocabulary may span. See the header. */
const MAX_THEMES = Number(process.argv.includes('--max') ? process.argv[process.argv.indexOf('--max') + 1] : 2);

const THEME = {
  'First words': 'everyday',
  Greetings: 'everyday',
  // Both split out of topics that had stopped describing themselves; see the
  // notes on `courtesy` and `voices` in src/data/words.ts. Themed by what the
  // words are: short replies are everyday speech, and talk/news/stories are
  // what everyday speech is about.
  'Yes, no and thank you': 'everyday',
  'Voices & stories': 'everyday',
  'Everyday phrases': 'everyday',
  'Useful expressions': 'everyday',
  'Saying no': 'everyday',
  Family: 'people',
  'More family': 'people',
  Appearance: 'people',
  Personality: 'people',
  Relationships: 'people',
  'Social life': 'people',
  'Weddings & guests': 'people',
  'Respect & address': 'people',
  'Play & childhood': 'people',
  'Life events': 'people',
  Rooms: 'home',
  'Around the home': 'home',
  Furniture: 'home',
  'Household items': 'home',
  'In the kitchen': 'home',
  Bathroom: 'home',
  'Food & drink': 'food',
  Fruits: 'food',
  Vegetables: 'food',
  Drinks: 'food',
  'Meals & dishes': 'food',
  'Grains & staples': 'food',
  Cooking: 'food',
  'At a restaurant': 'food',
  'Tastes & textures': 'senses',
  'The body': 'body',
  'More body parts': 'body',
  'Inside the body': 'body',
  Health: 'body',
  'Illness & symptoms': 'body',
  Medicine: 'body',
  Emergencies: 'body',
  Feelings: 'mind',
  'Emotions & mind': 'mind',
  'Ideas & values': 'mind',
  'Thought & philosophy': 'mind',
  'Faith & worship': 'mind',
  Nature: 'nature',
  Animals: 'nature',
  Birds: 'nature',
  'Wild animals': 'nature',
  'The garden': 'nature',
  'The natural world': 'nature',
  Landscape: 'nature',
  'Sky & space': 'nature',
  Environment: 'nature',
  'Weather & seasons': 'nature',
  Weather: 'nature',
  'Sea & insects': 'nature',
  'Farm & field': 'nature',
  'Time & day': 'time',
  'Days & months': 'time',
  'Time words': 'time',
  Numbers: 'counting',
  'How much': 'counting',
  'Bigger numbers': 'counting',
  'Money & shopping': 'counting',
  'At the bank': 'counting',
  Bargaining: 'counting',
  'Measures & order': 'counting',
  Jobs: 'work',
  School: 'work',
  'More professions': 'work',
  Education: 'work',
  'The office': 'work',
  'Working life': 'work',
  'Fields of study': 'work',
  Places: 'travel',
  'In the city': 'travel',
  Directions: 'travel',
  'Getting around': 'travel',
  'On the road': 'travel',
  Travel: 'travel',
  'At the airport': 'travel',
  'At a hotel': 'travel',
  'Countries & peoples': 'travel',
  'Asking the way': 'travel',
  'On the phone': 'travel',
  Journeys: 'travel',
  Clothing: 'things',
  'More clothing': 'things',
  Tools: 'things',
  Materials: 'things',
  Appliances: 'things',
  Containers: 'things',
  'Shapes & sizes': 'things',
  'Sports & leisure': 'people',
  'Sounds & senses': 'senses',
  Describing: 'describing',
  Colours: 'describing',
  Opposites: 'describing',
  'Question words': 'describing',
  'Fine description': 'describing',
  'Judgement words': 'describing',
  'Linking words': 'describing',
  'Idioms & sayings': 'describing',
  'Formal & written': 'society',
  Actions: 'actions',
  'Daily routine': 'actions',
  'More actions': 'actions',
  'Essential verbs': 'actions',
  'Verbs of motion': 'actions',
  'Verbs of mind': 'actions',
  'Verbs of speech': 'actions',
  'Modern life': 'society',
  'Digital life': 'society',
  'Media & news': 'society',
  'Business & trade': 'society',
  Science: 'society',
  Politics: 'society',
  'Law & justice': 'society',
  Economy: 'society',
  History: 'society',
  'Public services': 'society',
  'Culture & faith': 'society',
  Festivals: 'society',
  Literature: 'society',
  'Music & art': 'society',
  'Poetry & music': 'society',
};
const problems = [];
const unplaced = new Set();
const spread = new Map();
let withVocab = 0;
let single = 0;

for (const unit of UNITS) {
  const topics = [...new Set(unit.lessons.filter((l) => l.kind === 'vocab').map((l) => l.title))];
  if (!topics.length) continue;
  withVocab++;

  const counts = new Map();
  for (const topic of topics) {
    const theme = THEME[topic];
    if (!theme) {
      unplaced.add(topic);
      continue;
    }
    counts.set(theme, (counts.get(theme) ?? 0) + 1);
    if (!spread.has(theme)) spread.set(theme, new Set());
    spread.get(theme).add(unit.id);
  }

  if (counts.size === 1) single++;
  if (counts.size > MAX_THEMES) {
    const shape = [...counts].map(([t, n]) => `${t}×${n}`).join(', ');
    problems.push(`${unit.id} "${unit.title}" spans ${counts.size} themes (${shape}): ${topics.join(', ')}`);
  }
}

console.log(`check:unit-themes — ${withVocab} units teach vocabulary; ${single} hold a single theme.`);
const widest = [...spread].sort((a, b) => b[1].size - a[1].size).slice(0, 3);
console.log(`  most spread out: ${widest.map(([t, s]) => `${t} across ${s.size} units`).join(', ')}.`);

if (unplaced.size) {
  console.error(`\n${unplaced.size} topic(s) this check has no theme for:`);
  for (const t of unplaced) console.error(`  ${t}`);
  console.error(`\nAdd each to THEME in this file, choosing by what the topic's words are rather than its name.`);
  process.exit(1);
}

if (problems.length) {
  console.error(`\n${problems.length} unit(s) hold more than ${MAX_THEMES} themes of vocabulary:`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\nMove the odd topic to a unit whose subject it shares, keeping it inside its own CEFR stage.`);
  process.exit(1);
}

/**
 * A floor on how many units hold one theme, not just a cap on the worst unit.
 *
 * The two-theme cap says no unit may be a grab bag. It says nothing about the
 * course drifting back, one unit at a time, from mostly-single-theme to
 * mostly-paired — and that drift is what actually happened: this
 * reorganisation has now been done twice, and the second time began with a
 * reader saying the units still did not feel cohesive.
 *
 * So the count is a ratchet. It was 24 when the pairs were first split apart
 * and is `SINGLE_THEME_FLOOR` now; moving a stray topic to a unit that shares
 * its subject raises it, and nothing is allowed to lower it. Raise the floor
 * when it rises. Never lower it to make a change pass — that is the whole
 * point of it being here.
 *
 * It is deliberately not "every unit must hold one theme". Six units pair two
 * subjects their own titles name, and six more hold a stray that has nowhere
 * to go: a topic can only move within its CEFR stage, and for those there is
 * no unit in the same stage that shares their theme. Demanding perfection here
 * would mean either moving a topic to the wrong level or inventing a unit for
 * it, and both are worse than an honest pairing.
 */
const SINGLE_THEME_FLOOR = 26;
if (single < SINGLE_THEME_FLOOR) {
  console.error(
    `\nOnly ${single} units hold a single theme, down from ${SINGLE_THEME_FLOOR}. ` +
      `A unit that gained a topic from somewhere else has made the course less cohesive, not more.`
  );
  process.exit(1);
}

console.log('  No unit holds more than two themes of vocabulary.');
console.log(`  ${single} of ${withVocab} hold exactly one, which is the floor and may only rise.`);
