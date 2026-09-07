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
 * ## Wired into check:all (URD-A02)
 *
 * This failed on purpose for most of this file's life, deliberately excluded
 * from `check:all` until it passed — it existed to state the target in a form
 * a machine can settle, so the queue item that fixed the curriculum had
 * something to be verified against. A gauntlet item whose definition of done
 * is "lessons feel right" is a drift generator; one whose definition of done
 * is "check:shape exits 0" is not. It passes now (0 problems, 350 lessons,
 * 41 units) and is wired into `.github/workflows/deploy-preview.yml`, so a
 * future regression here fails CI loudly instead of drifting back unnoticed.
 *
 * Run with:  npm run check:shape
 */

const fs = require('fs');
const path = require('path');
const { load } = require('./lib/load-ts');

const { ALL_LESSONS, UNITS } = load('src/data/units.ts');
const { WORDS, TOPICS } = load('src/data/words.ts');
const { buildLessonExercises: buildLessonExercisesUncached, LETTER_CONTEXT_WORD } = load('src/exercises/generator.ts');
const { getLetter } = load('src/data/letters.ts');

/**
 * URD-011: `buildLessonExercises` ran 5,070 times per check:shape run,
 * 2.5-3.4 seconds, because `variants()` below and the run/share loop
 * further down each generate the identical (lesson, refs, track) tuple
 * independently, and every other rule in this file calls through `emitted`
 * — itself calling `variants` — again. Memoised on that tuple it is about
 * 700, the number this item names.
 *
 * The generator is not pure — `shuffle()`/`Math.random()` pick option order
 * and, for some word exercises, which kind to ask (`generator.ts`'s
 * `wordExercise`) — so memoising changes more than speed: every rule in
 * this file that asks about "lesson L, due-state R, track T" now sees the
 * exact same generated instance, where before each call site silently drew
 * its own independent random sample under the same nominal scenario. That
 * is a correctness improvement, not a side effect to route around — two
 * checks that both claim to test "this lesson in this state" should not be
 * able to disagree because they happened to roll differently.
 *
 * Keyed on `refs`, not just lesson id and track, on purpose: a review
 * lesson's five due-queue states (`dueQueues` below) are meaningfully
 * different generations of the same lesson, and collapsing them together
 * would silently cache the empty-queue result over the ones the due-queue
 * rules exist to check — the opposite of "do not memoise across tracks by
 * accident" for a different axis of the same mistake.
 */
const exerciseCache = new Map();
function buildLessonExercises(lesson, refs, track) {
  const key = `${lesson.id}:${track}:${refs.map((r) => `${r.type}:${r.id}`).join(',')}`;
  if (!exerciseCache.has(key)) exerciseCache.set(key, buildLessonExercisesUncached(lesson, refs, track));
  return exerciseCache.get(key);
}

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
const emitted = (lesson) => Math.min(...variants(lesson).map((ex) => ex.length));

/** Which tracks a lesson's shape rules apply to. A letter lesson does not
 *  exist on the Roman track at all, so a floor that only holds on script is
 *  not a floor. */
function tracksFor(lesson) {
  return lesson.kind === 'letters' ? ['both'] : ['both', 'roman'];
}

/**
 * Every version of this lesson a learner could actually be handed.
 *
 * Both tracks, and for a review lesson every state its due queue can be in.
 * Measuring review with `reviewRefs = []` alone measured the one state a review
 * lesson is almost never in, and it hid a real defect: the generator preferred
 * the due queue when there was one, so a learner with a single item due opened
 * their unit review and got a one question lesson. `rev-first-faces` emitted 1
 * exercise against a queue of one and 9 against an empty queue. The check could
 * not see it because it only ever asked for the empty case.
 */
function variants(lesson) {
  const out = [];
  for (const track of tracksFor(lesson))
    for (const refs of dueQueues(lesson)) out.push(buildLessonExercises(lesson, refs, track));
  return out;
}

/**
 * Nothing due, one item due, more due than the lesson holds — plus two states
 * added after THE CRITIC found the first three were not enough.
 *
 * `srs` is not per track: a learner can do letter lessons on the script track,
 * switch to Roman, and open a review with letters still in their due queue. On
 * Roman a due letter renders nothing, and a fixed-size `refs` array capped
 * before generation spent a slot on it anyway, truncating the lesson below its
 * own floor — reproduced directly: five due letters on Roman rendered 17 of 22
 * exercises. A due queue naming an id the current content no longer has is the
 * same failure by a different door — a stale `srs` key from a content rename —
 * and rendered 0 of 22. Both are queue shapes a learner can actually reach, and
 * neither is a word taken in order from the taught pool, which is all the first
 * three states were.
 *
 * All five are built from real path data or a single unresolvable id, taken in
 * order rather than sampled, so they are representative and deterministic — a
 * check that samples randomly reports a different number every run and cannot
 * be trusted to have failed for the reason it says.
 */
function dueQueues(lesson) {
  if (lesson.kind !== 'review') return [[]];
  const words = [];
  const letters = [];
  for (const l of ALL_LESSONS) {
    if (l.id === lesson.id) break;
    for (const id of l.wordIds || []) words.push({ id, type: 'word' });
    for (const id of l.letterIds || []) letters.push({ id, type: 'letter' });
  }
  const wordQueue = words.slice(-(lesson.size + 5));
  // Falls back to a handful of words if the alphabet unit is behind this
  // review already, so the state still exercises *a* due queue rather than
  // reducing to the empty-queue case it is meant to be distinct from.
  const allLetters = (letters.length ? letters : words.slice(0, 5)).slice(0, lesson.size);
  const staleId = [{ id: '__id-a-rename-left-behind__', type: 'word' }];
  return [[], wordQueue.slice(0, 1), wordQueue, allLetters, staleId];
}

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

/**
 * Which lesson kinds this run judges.
 *
 * `--kind=review` narrows the length, run and share rules to review lessons, so
 * an item that owns one kind can be verified on its own while the rest of the
 * course is still failing. The unfiltered run is the gate and the only thing
 * that may ever be wired into check:all; a filtered run is a working tool and
 * says so in its output, so a green filtered run can never be mistaken for a
 * green check.
 */
const ONLY = (process.argv.find((a) => a.startsWith('--kind=')) || '').split('=')[1] || null;
const judged = (l) => !ONLY || l.kind === ONLY;

const problems = [];
const bad = (msg) => problems.push(msg);
const mins = (lesson) => (emitted(lesson) * SECS_PER_EXERCISE) / 60;

const vocab = ALL_LESSONS.filter((l) => l.kind === 'vocab').filter(judged);

// ------------------------------------------------------- 1. is it a sitting?

const timed = ALL_LESSONS.filter(HAS_SESSION_LENGTH).filter(judged);
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
  // Keyed by lesson id and kept at its worst instance, not pushed once per
  // due-queue state: a review lesson has five states on this track and a
  // finding should count the lesson once, at whichever state is worst, not
  // once per state it happens to fail in.
  const runs = new Map();
  const hogs = new Map();
  for (const l of ALL_LESSONS.filter(judged)) {
    if (!tracksFor(l).includes(track)) continue;
    for (const refs of dueQueues(l)) {
      const ex = buildLessonExercises(l, refs, track);
      if (ex.length < 6) continue; // a dialogue is one exercise; a run is not a concept there
      const r = longestRun(ex);
      if (r.n > MAX_RUN && (!runs.has(l.id) || r.n > runs.get(l.id).n)) runs.set(l.id, { id: l.id, ...r });
      const counts = {};
      for (const e of ex) counts[e.kind] = (counts[e.kind] || 0) + 1;
      const [kind, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const share = n / ex.length;
      if (share > MAX_SHARE && (!hogs.has(l.id) || share > hogs.get(l.id).share))
        hogs.set(l.id, { id: l.id, kind, share });
    }
  }
  if (runs.size) {
    const worst = [...runs.values()].sort((a, b) => b.n - a.n)[0];
    bad(
      `${runs.size} lessons emit more than ${MAX_RUN} identical exercises in a row on the ${track} track,\n` +
        `      in at least one due-queue state.\n` +
        `      worst: ${worst.id} — ${worst.n} consecutive ${worst.kind}\n` +
        `      A learner does not experience a lesson as a set of passes, they\n` +
        `      experience it as a sequence. Nine of the same question in a row is\n` +
        `      the same content and a different lesson.`
    );
  }
  if (hogs.size) {
    const worst = [...hogs.values()].sort((a, b) => b.share - a.share)[0];
    bad(
      `${hogs.size} lessons are more than ${(MAX_SHARE * 100).toFixed(0)}% one exercise kind on the ${track} track,\n` +
        `      in at least one due-queue state.\n` +
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

const oddUnits = (ONLY ? [] : UNITS).filter(
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

const uncategorised = (ONLY ? [] : TOPICS).filter((t) => !t.category);
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
const dead = (ONLY ? [] : Object.keys(categoryMapKeys())).filter((k) => !topicIds.has(k));
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
const unused = (ONLY ? [] : CATEGORIES).filter((c) => !used.has(c));
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

// ------------------------------ 7. does a letter lesson show letters in context?
//
// URD-020: a learner meeting a completely new script used to spend nearly all
// their first hours on isolated glyphs — `letterTrace`/`letterForm`/
// `letterPick` never show a letter inside a real word. Measured before the
// fix: 276 of 285 exercises across all 9 letter lessons (96.8%) were
// isolated, and the lesson added exactly one context-word exercise no matter
// how many letters it taught, so a 7-letter lesson's one context word
// reinforced exactly 1 of the 7 (URD-021).

/**
 * The smallest share of a letter lesson's exercises that may show a letter
 * inside a real word rather than alone.
 *
 * The fix gives every letter its own context sighting, one of its six —
 * 16.7% — measured on real generated output today. Floored well under that,
 * at 10%: comfortably below what the fix achieves so it has headroom to
 * shift without tripping this, comfortably above the old ~3.2% (9 shared
 * context words across 285 exercises) so a regression back toward "one
 * context word for the whole lesson" fails loudly.
 */
const MIN_LETTER_CONTEXT_SHARE = 0.1;
// `letterContrast` (URD-047) belongs here even though it is not a single
// isolated glyph: it shows a letter against its confusable bucket, still
// script-in-isolation rather than a letter inside a real word, which is the
// distinction this set actually draws. Leaving it out would have counted it
// toward the context share below and let that rule pass for the wrong
// reason, and would have made `letterIdOfExercise` return undefined for it,
// silently shrinking the sequence the confusable-adjacency rule walks.
const ISOLATED_LETTER_KINDS = new Set(['letterTrace', 'letterForm', 'letterPick', 'letterContrast']);

const thinContext = ALL_LESSONS.filter((l) => l.kind === 'letters')
  .filter(judged)
  .filter((l) => {
    const ex = buildLessonExercises(l, [], 'both');
    const isolated = ex.filter((e) => ISOLATED_LETTER_KINDS.has(e.kind)).length;
    const contextShare = (ex.length - isolated) / ex.length;
    return contextShare < MIN_LETTER_CONTEXT_SHARE;
  });
if (thinContext.length) {
  bad(
    `${thinContext.length} of ${ALL_LESSONS.filter((l) => l.kind === 'letters').length} letter lessons show a letter ` +
      `in a real word less than ${(MIN_LETTER_CONTEXT_SHARE * 100).toFixed(0)}% of the time.\n` +
      `      A learner meeting a new script should read its letters inside words, not\n` +
      `      only trace, name and pick them in isolation.`
  );
}

/**
 * THE CRITIC, reviewing URD-020: the aggregate share above is a lesson-wide
 * average, not a per-letter guarantee — dropping context coverage for one
 * letter of a large group barely moves the share (one of `l-3`'s seven
 * dropped still lands at 11.9%, comfortably over the 10% floor). Checked
 * directly instead: every letter a lesson teaches must have its OWN
 * assigned context word (`LETTER_CONTEXT_WORD`, `generator.ts`) actually
 * appear in that lesson's real output.
 *
 * Matched by word id, not by checking whether the letter's glyph merely
 * appears somewhere in *some* context word shown in the lesson — a first
 * draft of this rule did that and passed even with a letter's own context
 * sighting entirely missing, because common letters (alif, among the most
 * frequent in the script) turn up incidentally inside *other* letters'
 * context words too (e.g. کتاب, "book," contains alif's glyph but is te's
 * assigned word, not alif's) — the loose check couldn't tell "this letter's
 * own sighting happened" from "some unrelated word happened to contain the
 * same glyph."
 */
const missingContext = [];
for (const l of ALL_LESSONS.filter((x) => x.kind === 'letters').filter(judged)) {
  const ex = buildLessonExercises(l, [], 'both');
  const contextWordIds = new Set(ex.filter((e) => !ISOLATED_LETTER_KINDS.has(e.kind) && e.word).map((e) => e.word.id));
  for (const id of l.letterIds || []) {
    const assigned = LETTER_CONTEXT_WORD.get(id);
    if (assigned && !contextWordIds.has(assigned.id)) missingContext.push({ lesson: l.id, letter: id });
  }
}
if (missingContext.length) {
  bad(
    `${missingContext.length} letter${missingContext.length === 1 ? '' : 's'} in letter lessons never show their ` +
      `own assigned context word:\n` +
      missingContext
        .slice(0, 8)
        .map((m) => `      ${m.letter} in ${m.lesson}`)
        .join('\n')
  );
}

// ------------------------- 8. are visually confusable letters kept apart?
//
// URD-022: `l-3` teaches `daal`/`Daal`/`zaal` and `re`/`Re`/`ze`/`zhe` — two
// families distinguished only by a dot or a diacritic — and the round-major
// loop used to drill a lesson's letters in raw `letterIds` order, every
// round, so the whole `daal`/`Daal`/`zaal` family landed back to back before
// `re`'s family ever appeared. Drilling visually confusable letters with no
// separation risks teaching the confusion rather than resolving it.
//
// `generator.ts`'s `separateConfusables` now reorders each lesson's letters
// so members of one `confusableWith` bucket are spread apart. Checked here
// against the real generated sequence, not the reordering function in
// isolation, the same way rule 7 above checks the real output rather than
// `LETTER_CONTEXT_WORD` alone.
//
// A context-word exercise carries a word, not a letter id directly, so which
// letter it stands in for is recovered via `LETTER_CONTEXT_WORD` — the same
// map the generator used to assign it.
function bucketKeyOf(letterId) {
  const letter = getLetter(letterId);
  return (letter && letter.confusableWith) || letterId;
}

function letterIdOfExercise(exercise, lesson) {
  if (ISOLATED_LETTER_KINDS.has(exercise.kind)) return exercise.letter.id;
  return (lesson.letterIds || []).find((lid) => {
    const assigned = LETTER_CONTEXT_WORD.get(lid);
    return assigned && exercise.word && assigned.id === exercise.word.id;
  });
}

/**
 * THE CRITIC / CURRICULUM CRITIC, reviewing this rule's first draft: it
 * looped `i < n - 1` where `n` was the lesson's *letter count* (7 for
 * `l-3`), not its *exercise count* (42 for `l-3`, `SIGHTINGS_PER_LETTER`
 * rounds of `n` each) — so it only ever scanned round 0 and compared a
 * fixed `ids[n-1]` against `ids[0]` for the "wrap," silently never looking
 * past the first 7 of 42 exercises. It reported "Clear" while the real
 * generated `l-3` actually drilled `zhe` immediately before `re` five
 * times, at every one of the lesson's 5 round transitions — the same
 * "check that cannot fail" shape as the tools this project has been burned
 * by before. Fixed to walk every adjacent pair in the full generated
 * sequence.
 *
 * Because every round repeats the identical order (see `separateConfusables`
 * in `generator.ts` for why), whatever adjacency exists at the round wrap
 * recurs at *every* round transition, not once. For a group whose largest
 * confusable bucket is more than half the group, at least
 * `2 * bucketSize - groupSize` such wrap adjacencies are forced per
 * transition (a known bound for circular arrangements): `l-3`'s `re` family
 * (4 of 7 letters) forces exactly one, `2*4 - 7 = 1`, recurring across all
 * `rounds - 1` transitions. Every other real lesson's largest bucket is at
 * most half its group, so nothing is forced there and any adjacency is a
 * real regression. The expected count is computed, not assumed, and
 * checked for an exact match — too few would mean this rule regressed
 * (silently stopped seeing violations it should), too many would mean the
 * generator did.
 */
const confusableAdjacent = [];
for (const l of ALL_LESSONS.filter((x) => x.kind === 'letters').filter(judged)) {
  const ex = buildLessonExercises(l, [], 'both');
  const ids = ex.map((e) => letterIdOfExercise(e, l));
  const n = (l.letterIds || []).length;
  /**
   * URD-043: `rounds` used to be `ex.length / n`, assuming the whole
   * sequence is round-major throughout — the same assumption
   * `generator.test.ts`'s identical rule made, and the same fix applies
   * here: forcing every letter's true final sighting to `letterTrace`
   * pairs each letter's last two sightings back-to-back, letter by letter,
   * rather than round-major, for that tail — real, deliberate, and no
   * longer uniform. Counting fresh, non-consecutive occurrences of the
   * sequence's own first letter measures how many times a full pass
   * through the group actually restarts, directly from the real sequence,
   * rather than assuming a shape that no longer always holds. Reduces to
   * the old `ex.length / n` count whenever the sequence really is uniform
   * round-major throughout, so this is a generalization, not a special
   * case for one design.
   */
  const firstId = ids[0];
  let rounds = 0;
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === firstId && (i === 0 || ids[i - 1] !== firstId)) rounds++;
  }

  const found = [];
  for (let i = 0; i < ids.length - 1; i++) {
    const a = ids[i];
    const b = ids[i + 1];
    if (a && b && a !== b && bucketKeyOf(a) === bucketKeyOf(b)) found.push({ a, b, at: i });
  }

  const bucketSizes = new Map();
  for (const id of l.letterIds || []) {
    const key = bucketKeyOf(id);
    bucketSizes.set(key, (bucketSizes.get(key) || 0) + 1);
  }
  const largest = bucketSizes.size ? Math.max(...bucketSizes.values()) : 0;
  const perTransitionForced = Math.max(0, 2 * largest - n);
  const expected = perTransitionForced * Math.max(0, rounds - 1);

  if (found.length !== expected) {
    for (const f of found) confusableAdjacent.push({ lesson: l.id, a: f.a, b: f.b, at: `${f.at}` });
    if (found.length < expected) {
      confusableAdjacent.push({
        lesson: l.id,
        a: `(expected ${expected} forced adjacencies, found only ${found.length} —`,
        b: `this rule may be under-scanning again)`,
        at: '?',
      });
    }
  }
}
if (confusableAdjacent.length) {
  bad(
    `${confusableAdjacent.length} pair${confusableAdjacent.length === 1 ? '' : 's'} of visually confusable letters ` +
      `are drilled back to back:\n` +
      confusableAdjacent
        .slice(0, 8)
        .map((m) => `      ${m.a} next to ${m.b} in ${m.lesson} (position ${m.at})`)
        .join('\n')
  );
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

if (ONLY) console.log(`  scoped to --kind=${ONLY}. This is a working tool, not the gate.\n`);

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
