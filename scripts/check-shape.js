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

const fs = require('fs');
const path = require('path');
const { load } = require('./lib/load-ts');

const { ALL_LESSONS, UNITS } = load('src/data/units.ts');
const { WORDS, TOPICS } = load('src/data/words.ts');
const { buildLessonExercises } = load('src/exercises/generator.ts');

/**
 * How many exercises a lesson really produces.
 *
 * Not `lesson.size`, which is the budget the path author wrote down. A budget is
 * a claim, and a check that reads it proves only that somebody typed a number:
 * the generator could emit half of them and this would still pass. So every
 * lesson is generated and counted, the way `check:answerable` already drives the
 * real generator rather than reasoning about it.
 *
 * Measured on the tracks the lesson is actually on, and the shorter one wins. A
 * Roman track learner is shown neither letter tracing nor word building, so
 * their lesson is the shorter of the two and a floor that only holds for the
 * script track is not a floor.
 *
 * Letter lessons are the exception, and getting this wrong reported `l-1` at
 * zero exercises: the Roman track does not contain them at all, `unitsForTrack`
 * filters them out, and a lesson nobody on that track can open has no length to
 * be short. It is measured on the script track only.
 */
const emitted = (lesson) => {
  const script = buildLessonExercises(lesson, [], 'both').length;
  if (lesson.kind === 'letters') return script;
  return Math.min(script, buildLessonExercises(lesson, [], 'roman').length);
};

/**
 * Which lessons a session length even applies to.
 *
 * A reading lesson is one passage and a dialogue is one conversation. Both are a
 * single long-form piece, and nine seconds per exercise does not model them:
 * counted that way a passage is 0.15 minutes, which says nothing about how long
 * a learner spends on it. Timing those honestly needs a reading speed for
 * Nastaliq and a word count, which is a different measurement and not this one.
 *
 * Exempted rather than fudged, and named here so the exemption is visible rather
 * than hidden inside a threshold.
 */
const HAS_SESSION_LENGTH = (l) => l.kind !== 'reading' && l.kind !== 'dialogue';

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
const mins = (lesson) => (emitted(lesson) * SECS_PER_EXERCISE) / 60;

const vocab = ALL_LESSONS.filter((l) => l.kind === 'vocab');

// ------------------------------------------------------- 1. is it a sitting?

const timed = ALL_LESSONS.filter(HAS_SESSION_LENGTH);
const tooShort = timed.filter((l) => mins(l) < MIN_MINUTES);
const tooLong = timed.filter((l) => mins(l) > MAX_MINUTES);

if (tooShort.length) {
  const worst = [...tooShort].sort((a, b) => mins(a) - mins(b))[0];
  bad(
    `${tooShort.length} of ${timed.length} timed lessons are under ${MIN_MINUTES} minutes.\n` +
      `      shortest: ${worst.id} at ${mins(worst).toFixed(1)} min (${emitted(worst)} exercises)\n` +
      `      Drops caps a session at 5 minutes and Duolingo runs 5 to 10. A lesson\n` +
      `      this short is an interruption rather than a sitting.`
  );
}
if (tooLong.length) {
  const worst = [...tooLong].sort((a, b) => mins(b) - mins(a))[0];
  bad(
    `${tooLong.length} lessons are over ${MAX_MINUTES} minutes.\n` +
      `      longest: ${worst.id} at ${mins(worst).toFixed(1)} min (${emitted(worst)} exercises)`
  );
}

// -------------------------------------------- 2. is each word actually drilled?
//
// The dial that matters. A longer lesson built by adding words rather than
// repetitions teaches worse than the short one it replaced.

for (const l of vocab) {
  const n = (l.wordIds || []).length;
  if (!n) continue;
  const sightings = emitted(l) / n;
  if (sightings < MIN_SIGHTINGS) {
    bad(
      `${l.id} shows each of its ${n} words about ${sightings.toFixed(1)} times; the floor is ${MIN_SIGHTINGS}.\n` +
        `      Drops repeats a word several times inside one 5 minute session, which is\n` +
        `      how it gets to 5 minutes without teaching 30 words at once.`
    );
    break; // one is enough to make the point; the count follows below
  }
}
const underDrilled = vocab.filter((l) => (l.wordIds || []).length && emitted(l) / l.wordIds.length < MIN_SIGHTINGS);
if (underDrilled.length > 1) {
  bad(`${underDrilled.length} of ${vocab.length} vocabulary lessons are under the ${MIN_SIGHTINGS} sightings floor.`);
}

// --------------------------------- 3. does a lesson vary, on the track you are on?
//
// The rule that was missing, and the reason it is here rather than in a comment:
// the first attempt at making a lesson a sitting emitted its three passes as
// three whole-lesson blocks, and every check in the repo passed. Every word was
// taught once, nothing was shown early, every question was answerable, the
// lengths were in band. What a learner actually got was eleven identical
// questions in a row.
//
// Two thresholds, both measured on the real generated output of both tracks.

/**
 * The most identical exercise kinds a lesson may emit back to back.
 *
 * Three, because three is what the pipeline's drain costs and no more. The
 * staggered passes in `generator.ts` take the script track to a longest run of
 * two with no lesson above it; the Roman track hits three in 59 lessons, at the
 * very end, where only the produce pass is still running and produce is
 * `typeWord` for nearly every word on a track that does not build Nastaliq. Set
 * to 3 so that residual passes and a fourth in a row does not.
 *
 * Before the pipeline the longest run was 14, and 199 of 233 vocabulary lessons
 * had a run of 9 or more.
 */
const MAX_RUN = 3;

/**
 * The largest share of one lesson any single exercise kind may take.
 *
 * A second net under MAX_RUN, for the failure that spaces itself out: a kind
 * that is half the lesson is still a lesson about that kind, however evenly it
 * is spread. Worst today is 32.6% (`wordFromMeaning` in v-motion-verbs), so 40
 * is headroom rather than a line drawn around the current number.
 */
const MAX_SHARE = 0.4;

/**
 * Both tracks, separately, and that is the whole point of this section.
 *
 * The check used to compare the tracks by exercise *count* only — via `emitted`
 * taking the minimum — and the counts are identical for all 233 vocabulary
 * lessons, so it was structurally blind to what the tracks actually differ on.
 * A fix that landed only on the script track measured as no change at all: the
 * Roman track kept 14 consecutive `typeWord` in 162 lessons and nothing said so.
 */
const TRACKS = ['both', 'roman'];

const longestRun = (ex) => {
  let run = 0,
    prev = null,
    max = 0,
    at = null;
  for (const e of ex) {
    run = e.kind === prev ? run + 1 : 1;
    prev = e.kind;
    if (run > max) {
      max = run;
      at = e.kind;
    }
  }
  return { n: max, kind: at };
};

for (const track of TRACKS) {
  const runs = [];
  const hogs = [];
  for (const l of ALL_LESSONS) {
    const ex = buildLessonExercises(l, [], track);
    if (ex.length < 6) continue; // a dialogue is one exercise; a run is not a concept there
    const r = longestRun(ex);
    if (r.n > MAX_RUN) runs.push({ id: l.id, ...r });
    const counts = {};
    for (const e of ex) counts[e.kind] = (counts[e.kind] || 0) + 1;
    const [kind, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (n / ex.length > MAX_SHARE) hogs.push({ id: l.id, kind, share: n / ex.length });
  }
  if (runs.length) {
    const worst = [...runs].sort((a, b) => b.n - a.n)[0];
    bad(
      `${runs.length} lessons emit more than ${MAX_RUN} identical exercises in a row on the ${track} track.\n` +
        `      worst: ${worst.id} — ${worst.n} consecutive ${worst.kind}\n` +
        `      A learner does not experience a lesson as a set of passes, they\n` +
        `      experience it as a sequence. Nine of the same question in a row is\n` +
        `      the same content and a different lesson.`
    );
  }
  if (hogs.length) {
    const worst = [...hogs].sort((a, b) => b.share - a.share)[0];
    bad(
      `${hogs.length} lessons are more than ${(MAX_SHARE * 100).toFixed(0)}% one exercise kind on the ${track} track.\n` +
        `      worst: ${worst.id} — ${(worst.share * 100).toFixed(0)}% ${worst.kind}`
    );
  }
}

// ------------------------------------------------- 4. does a topic stay a topic?

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

// ------------------------------------------------------ 5. is a unit a chapter?

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

// ---------------------------------------------- 6. does every topic have a home?
//
// The organisation question: a learner opening the app should be able to say
// what kind of thing each topic is.
//
// This is the ONLY enforcement of the category axis. Review established that
// there is no type-level guarantee behind it: `noUncheckedIndexedAccess` is not
// set, so a topic missing from `TOPIC_CATEGORY` is `undefined` at runtime while
// `tsc` exits 0, and `data/vocab/types.ts` declares a second `Topic` without the
// field at all. So this section carries the whole weight, and it is written to
// catch the ways the map actually rots rather than only the obvious one.
//
// It also proved it: the first delivery commit of URD-A01 was missing
// `festivals` and nothing but this said so.

const { TOPIC_CATEGORIES } = load('src/data/words.ts');
const CATEGORIES = [...TOPIC_CATEGORIES];

const uncategorised = TOPICS.filter((t) => !t.category);
if (uncategorised.length) {
  bad(
    `${uncategorised.length} topic${uncategorised.length === 1 ? ' has' : 's have'} no category: ` +
      uncategorised
        .slice(0, 8)
        .map((t) => t.id)
        .join(', ') +
      `\n      Every topic needs one of: ${CATEGORIES.join(', ')}.` +
      `\n      Nothing but this check will tell you. See the note in words.ts.`
  );
}

// A key naming a topic that no longer exists. Rename a topic id and you get a
// dead key *and* an uncategorised topic; without this, only the second half is
// reported and the stale key sits there looking like coverage.
const topicIds = new Set(TOPICS.map((t) => t.id));
const dead = Object.keys(categoryMapKeys()).filter((k) => !topicIds.has(k));
if (dead.length) {
  bad(
    `${dead.length} categor${dead.length === 1 ? 'y names a topic that does' : 'ies name topics that do'} not exist: ${dead.join(', ')}\n` +
      `      A dead key is not coverage. It usually means a topic was renamed and\n` +
      `      its new id was never categorised.`
  );
}

// A category declared but never used is either a gap in the course or a
// category that should not exist. Either way somebody should say which.
const used = new Set(TOPICS.map((t) => t.category).filter(Boolean));
const unused = CATEGORIES.filter((c) => !used.has(c));
if (unused.length) {
  bad(`${unused.length} declared categories are used by no topic: ${unused.join(', ')}`);
}

/**
 * The map is not exported, so read its keys off the source.
 *
 * Exporting it purely to be checked would widen the module's surface for the
 * benefit of one script. Parsing is the smaller cost, and it fails loudly if the
 * shape of the literal ever changes rather than silently reporting zero keys.
 */
function categoryMapKeys() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/data/words.ts'), 'utf8');
  const m = src.match(/const TOPIC_CATEGORY: Record<string, TopicCategory> = \{([\s\S]*?)\n\};/);
  if (!m) {
    bad('could not find TOPIC_CATEGORY in words.ts — this check has stopped checking anything');
    return {};
  }
  const keys = {};
  for (const km of m[1].matchAll(/(?:^|[,{]\s*)'?([a-zA-Z][\w-]*)'?\s*:/g)) keys[km[1]] = true;
  return keys;
}

// ------------------------------------------------------------------- report

const totalMin = ALL_LESSONS.reduce((s, l) => s + mins(l), 0);
const avgWords = vocab.reduce((s, l) => s + (l.wordIds || []).length, 0) / (vocab.length || 1);

console.log(
  `check:shape — ${ALL_LESSONS.length} lessons, ${vocab.length} of them vocabulary.\n` +
    `  mean lesson ${(totalMin / ALL_LESSONS.length).toFixed(1)} min · ${avgWords.toFixed(1)} new words · ` +
    `${(ALL_LESSONS.reduce((s, l) => s + emitted(l), 0) / ALL_LESSONS.length).toFixed(1)} exercises emitted\n` +
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
