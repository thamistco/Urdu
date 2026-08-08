/* eslint-disable */
/**
 * Is a lesson the right size to be a sitting?
 *
 * Every other check in this repo asks whether the course is *correct*. This one
 * asks whether it is *shaped like a course*, which is a different question and
 * the one nobody was asking. A curriculum can be perfectly correct — every word
 * taught, nothing tested early, every question answerable — and still be
 * unusable because its lessons are the wrong size.
 *
 * That is what happened here. Spreading topics across enough lessons to cover
 * their vocabulary fixed a real bug (a full playthrough reached 608 of 2,281
 * words) and introduced a different one nobody measured: 493 vocabulary lessons
 * of 4.6 words each, about 8.6 exercises, roughly 1.3 minutes. A learner does
 * not have a session, they have an interruption.
 *
 * ## What the numbers are measured against
 *
 * Two products that have solved this in public, and are the obvious comparison
 * for a vocabulary-first course:
 *
 *   Drops     caps a session at 5 minutes by design. Topic lists hold about 20
 *             words, and a session drills roughly 15 of them, repeatedly.
 *   Duolingo  lessons run 5 to 10 minutes. Units are chunked into smaller
 *             pieces for intermediate learners, which is the same instinct as
 *             splitting a topic, applied at a coarser grain.
 *
 * Both land in the same place: a session is about five minutes. Harf is at 1.3.
 *
 * ## The dial that matters is not the one it looks like
 *
 * The obvious fix is more words per lesson, and taken alone it is the wrong one.
 * Neither product gets to five minutes by front-loading vocabulary — Duolingo
 * introduces only a handful of new words in a ten minute lesson. They get there
 * by *repetition*: each new word is met four to six times inside the session
 * that introduces it, in different shapes.
 *
 * A Harf word is currently seen about twice. So this check measures both dials
 * and holds both, because moving only the word count produces a longer lesson
 * that teaches worse.
 *
 * ## This check fails today, on purpose
 *
 * It is not wired into `check:all` and it must not be until it passes. It exists
 * to state the target in a form that a machine can settle, so the queue item
 * that fixes the curriculum has something to be verified against. A gauntlet
 * item whose definition of done is "lessons feel right" is a drift generator;
 * one whose definition of done is "check:shape exits 0" is not.
 *
 * Run with:  npm run check:shape
 */

const { load } = require('./lib/load-ts');

const { ALL_LESSONS, UNITS } = load('src/data/units.ts');
const { WORDS, TOPICS } = load('src/data/words.ts');

/**
 * Seconds per exercise.
 *
 * Nine is the honest middle for this app rather than a round guess: tapping one
 * of four options with a feedback banner and a Continue runs six to eight,
 * typing a word from memory runs fifteen or more, tracing a letter longer
 * still, and a matching board resolves four pairs in one screen. It is the
 * number to revisit first if these thresholds ever feel wrong.
 */
const SECS_PER_EXERCISE = 9;

/** A session, in minutes. Drops caps at 5; Duolingo runs 5 to 10. */
const MIN_MINUTES = 3.0;
const MAX_MINUTES = 8.0;

/** How many times a new word must be met inside the lesson that introduces it. */
const MIN_SIGHTINGS = 3;

/** How many pieces one topic may be broken into before it stops reading as one. */
const MAX_PARTS_PER_TOPIC = 3;

/** A unit is a chapter. Below this it is a heading; above it, a wall. */
const MIN_LESSONS_PER_UNIT = 4;
const MAX_LESSONS_PER_UNIT = 12;

const problems = [];
const bad = (msg) => problems.push(msg);
const mins = (lesson) => (lesson.size * SECS_PER_EXERCISE) / 60;

const vocab = ALL_LESSONS.filter((l) => l.kind === 'vocab');

// ------------------------------------------------------- 1. is it a sitting?

const tooShort = ALL_LESSONS.filter((l) => mins(l) < MIN_MINUTES);
const tooLong = ALL_LESSONS.filter((l) => mins(l) > MAX_MINUTES);

if (tooShort.length) {
  const worst = [...tooShort].sort((a, b) => mins(a) - mins(b))[0];
  bad(
    `${tooShort.length} of ${ALL_LESSONS.length} lessons are under ${MIN_MINUTES} minutes.\n` +
      `      shortest: ${worst.id} at ${mins(worst).toFixed(1)} min (${worst.size} exercises)\n` +
      `      Drops caps a session at 5 minutes and Duolingo runs 5 to 10. A lesson\n` +
      `      this short is an interruption rather than a sitting.`
  );
}
if (tooLong.length) {
  const worst = [...tooLong].sort((a, b) => mins(b) - mins(a))[0];
  bad(
    `${tooLong.length} lessons are over ${MAX_MINUTES} minutes.\n` +
      `      longest: ${worst.id} at ${mins(worst).toFixed(1)} min (${worst.size} exercises)`
  );
}

// -------------------------------------------- 2. is each word actually drilled?
//
// The dial that matters. A longer lesson built by adding words rather than
// repetitions teaches worse than the short one it replaced.

for (const l of vocab) {
  const n = (l.wordIds || []).length;
  if (!n) continue;
  const sightings = l.size / n;
  if (sightings < MIN_SIGHTINGS) {
    bad(
      `${l.id} shows each of its ${n} words about ${sightings.toFixed(1)} times; the floor is ${MIN_SIGHTINGS}.\n` +
        `      Drops repeats a word several times inside one 5 minute session, which is\n` +
        `      how it gets to 5 minutes without teaching 30 words at once.`
    );
    break; // one is enough to make the point; the count follows below
  }
}
const underDrilled = vocab.filter((l) => (l.wordIds || []).length && l.size / l.wordIds.length < MIN_SIGHTINGS);
if (underDrilled.length > 1) {
  bad(`${underDrilled.length} of ${vocab.length} vocabulary lessons are under the ${MIN_SIGHTINGS} sightings floor.`);
}

// ------------------------------------------------- 3. does a topic stay a topic?

const parts = new Map();
for (const l of vocab) parts.set(l.topic, (parts.get(l.topic) || 0) + 1);
const shattered = [...parts].filter(([, n]) => n > MAX_PARTS_PER_TOPIC).sort((a, b) => b[1] - a[1]);
if (shattered.length) {
  bad(
    `${shattered.length} topics are split into more than ${MAX_PARTS_PER_TOPIC} lessons.\n` +
      shattered
        .slice(0, 5)
        .map(([t, n]) => `      ${t} — ${n} parts`)
        .join('\n') +
      `\n      Past three, "First words 6 of 7" stops reading as one topic taken in\n` +
      `      sittings and starts reading as the app padding its lesson count.`
  );
}

// ------------------------------------------------------ 4. is a unit a chapter?

const oddUnits = UNITS.filter(
  (u) => u.lessons.length < MIN_LESSONS_PER_UNIT || u.lessons.length > MAX_LESSONS_PER_UNIT
);
if (oddUnits.length) {
  bad(
    `${oddUnits.length} of ${UNITS.length} units are outside ${MIN_LESSONS_PER_UNIT} to ${MAX_LESSONS_PER_UNIT} lessons.\n` +
      oddUnits
        .slice(0, 5)
        .map((u) => `      ${u.id} — ${u.lessons.length} lessons`)
        .join('\n')
  );
}

// ---------------------------------------------- 5. does every topic have a home?
//
// The organisation question: a learner opening the app should be able to say
// what kind of thing each topic is. `Topic` carries id, title, icon, blurb and
// level, and nothing that groups "Food & drink" with "At the restaurant" and
// apart from "Grammar of the oblique". Until that axis exists this reports
// rather than fails, because there is nothing yet to be wrong.

// Read from the source of truth rather than restated here, so the taxonomy
// cannot drift between the type and the check that enforces it.
const { TOPIC_CATEGORIES } = load('src/data/words.ts');
const CATEGORIES = [...TOPIC_CATEGORIES];
const uncategorised = TOPICS.filter((t) => !t.category);
if (uncategorised.length === TOPICS.length) {
  bad(
    `no topic carries a category. All ${TOPICS.length} of them have a title, an icon and a\n` +
      `      level, and nothing that says what kind of thing they are. A learner cannot\n` +
      `      see why "Food & drink" and "At the restaurant" belong together, and neither\n` +
      `      can the path. Add \`category\` to \`Topic\` from: ${CATEGORIES.join(', ')}.`
  );
} else if (uncategorised.length) {
  bad(
    `${uncategorised.length} topics have no category: ${uncategorised
      .slice(0, 6)
      .map((t) => t.id)
      .join(', ')}`
  );
} else {
  const wrong = TOPICS.filter((t) => !CATEGORIES.includes(t.category));
  if (wrong.length)
    bad(
      `${wrong.length} topics carry a category outside the taxonomy: ${wrong
        .map((t) => `${t.id}=${t.category}`)
        .slice(0, 6)
        .join(', ')}`
    );
}

// ------------------------------------------------------------------- report

const totalMin = ALL_LESSONS.reduce((s, l) => s + mins(l), 0);
const avgWords = vocab.reduce((s, l) => s + (l.wordIds || []).length, 0) / (vocab.length || 1);

console.log(
  `check:shape — ${ALL_LESSONS.length} lessons, ${vocab.length} of them vocabulary.\n` +
    `  mean lesson ${(totalMin / ALL_LESSONS.length).toFixed(1)} min · ${avgWords.toFixed(1)} new words · ` +
    `${(ALL_LESSONS.reduce((s, l) => s + l.size, 0) / ALL_LESSONS.length).toFixed(1)} exercises\n` +
    `  whole course ${(totalMin / 60).toFixed(1)} hours\n` +
    `  targets: ${MIN_MINUTES} to ${MAX_MINUTES} min per lesson, ${MIN_SIGHTINGS}+ sightings per new word,\n` +
    `           at most ${MAX_PARTS_PER_TOPIC} parts per topic, ${MIN_LESSONS_PER_UNIT} to ${MAX_LESSONS_PER_UNIT} lessons per unit\n`
);

if (problems.length) {
  console.error(`check:shape — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  console.error(
    `  This check is not in check:all and must not be added until it passes.\n` +
      `  It exists to state the target in a form a machine can settle, so the\n` +
      `  curriculum work has something to be verified against rather than a feeling.`
  );
  process.exit(1);
}
console.log('  Every lesson is a sitting, every word is drilled, every topic has a home.');
