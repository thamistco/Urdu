/* eslint-disable */
/**
 * Does the course actually teach the words it contains?
 *
 * It did not, for a long time, and nothing noticed. A vocabulary lesson named a
 * topic; the generator took `Math.max(3, size - 4 - woven)` of that topic's
 * words at random, marked the lesson complete, and moved on. First words showed
 * three of its thirty two. Measured across the whole path, a learner who
 * finished every lesson in the course was introduced to **608 of 2,281 words**.
 * The other three quarters had been written, translated, given pictures and
 * recorded, and there was no route through the app that reached them.
 *
 * A learner found it before any check did, which is the part worth sitting with.
 * They finished a lesson, came back, and were shown words they had never seen in
 * a lesson the app had already ticked off. From inside the app there was no way
 * to tell "here is more of what you learned" from "here is what you were never
 * taught", because the app could not tell either.
 *
 * Every existing check was green throughout, and one of them was green *because*
 * of the bug: `taughtUpTo` counted a whole topic as taught the moment any lesson
 * touched it, so `check:order` was told the learner knew nineteen words when
 * they had been shown three. The model that should have caught this was the
 * thing hiding it.
 *
 * So this checks the property directly, on the real content, with no model in
 * between:
 *
 *  1. **Every word is taught.** Each word in the corpus belongs to exactly one
 *     path lesson's `wordIds`. Not "its topic appears somewhere" — the word
 *     itself, in a specific lesson a learner can open.
 *  2. **No word is taught twice.** Two lessons owning one word means a third is
 *     missing something, and it is the second sighting that hides it: the
 *     duplicate looks like revision.
 *  3. **Every vocabulary lesson teaches something.** An empty lesson is a
 *     tappable row that costs a learner a session and returns nothing.
 *  4. **Lesson ids are unique.** Progress is persisted by id, so a collision
 *     silently marks one lesson complete when the learner finishes the other.
 *  5. **Nothing is shown before it is taught.** No sentence or grammar lesson
 *     puts a word on screen ahead of the lesson that introduces it. Measured on
 *     what the generator emits, not on the pools it draws from.
 *
 * Point 1 is the one that would have caught the original bug on the day it was
 * written, and it is deliberately stated over the corpus rather than over the
 * lessons. A check that walks the lessons and asks "did this teach anything?"
 * passes perfectly on a course that skips three quarters of its vocabulary. The
 * question has to start from the words.
 *
 * Run with:  npm run check:coverage
 */

const { load } = require('./lib/load-ts');

const { ALL_LESSONS } = load('src/data/units.ts');
const { WORDS, getTopic } = load('src/data/words.ts');
const { buildLessonExercises } = load('src/exercises/generator.ts');

const problems = [];
const bad = (msg) => problems.push(msg);

const vocab = ALL_LESSONS.filter((l) => l.kind === 'vocab');

// ---------------------------------------------- 1 + 2. every word, exactly once

/** word id -> the lessons claiming to teach it */
const owners = new Map();
for (const l of vocab) {
  for (const id of l.wordIds ?? []) {
    if (!owners.has(id)) owners.set(id, []);
    owners.get(id).push(l.id);
  }
}

const untaught = WORDS.filter((w) => !owners.has(w.id));
if (untaught.length) {
  // Group by topic: one topic missing entirely is one mistake, and listing
  // thirty words hides that it is one mistake.
  const byTopic = new Map();
  for (const w of untaught) byTopic.set(w.topic, (byTopic.get(w.topic) ?? 0) + 1);
  const worst = [...byTopic].sort((a, b) => b[1] - a[1]).slice(0, 8);
  bad(
    `${untaught.length} word${untaught.length === 1 ? '' : 's'} of ${WORDS.length} are in the app but taught by no lesson.\n` +
      worst
        .map(([t, n]) => {
          const topic = getTopic(t);
          return `      ${String(n).padStart(4)} in "${(topic && topic.title) || t}"`;
        })
        .join('\n') +
      (byTopic.size > worst.length ? `\n      … and ${byTopic.size - worst.length} more topics` : '')
  );
}

const twice = [...owners].filter(([, ls]) => ls.length > 1);
if (twice.length) {
  bad(
    `${twice.length} word${twice.length === 1 ? ' is' : 's are'} taught by more than one lesson:\n` +
      twice
        .slice(0, 8)
        .map(([id, ls]) => `      ${id} — ${ls.join(', ')}`)
        .join('\n')
  );
}

// ------------------------------------------------ 3. no lesson teaches nothing

const empty = vocab.filter((l) => !l.wordIds || l.wordIds.length === 0);
if (empty.length) {
  bad(
    `${empty.length} vocabulary lesson${empty.length === 1 ? ' has' : 's have'} no words to teach:\n` +
      empty
        .slice(0, 8)
        .map((l) => `      ${l.id} (topic ${l.topic})`)
        .join('\n')
  );
}

// A word id that does not resolve is worse than a missing one: the lesson claims
// coverage the corpus cannot honour, so the count looks right and the lesson is
// short.
const known = new Set(WORDS.map((w) => w.id));
const dangling = [...owners.keys()].filter((id) => !known.has(id));
if (dangling.length) {
  bad(
    `${dangling.length} lesson word id${dangling.length === 1 ? '' : 's'} match no word in the corpus:\n` +
      dangling
        .slice(0, 8)
        .map((id) => `      ${id} — claimed by ${owners.get(id).join(', ')}`)
        .join('\n')
  );
}

// ------------------------------------------------------------ 4. unique ids

const idSeen = new Map();
for (const l of ALL_LESSONS) idSeen.set(l.id, (idSeen.get(l.id) ?? 0) + 1);
const collisions = [...idSeen].filter(([, n]) => n > 1);
if (collisions.length) {
  bad(
    `${collisions.length} lesson id${collisions.length === 1 ? ' is' : 's are'} used more than once, so progress saved against one lands on another:\n` +
      collisions
        .slice(0, 8)
        .map(([id, n]) => `      ${id} × ${n}`)
        .join('\n')
  );
}

// -------------------------------------- 5. nothing is shown before it is taught
//
/**
 * A sentence lesson may not put a word on screen before the lesson that teaches
 * it.
 *
 * This was measurable only once coverage was exhaustive. While a vocabulary
 * lesson showed a random handful of its topic, "has the learner met this word"
 * had no answer — so a beginner sentence lesson drew on words the learner had
 * roughly a one in five chance of ever having been shown, and nothing could say
 * so. Making every word belong to exactly one lesson turned that into 116 word
 * forms of 1,665 appearing before they were taught.
 *
 * Measured on what the generator actually emits rather than on the pools it
 * draws from, because the filter that fixes this lives in the generator, and a
 * check that reads the pools would pass whether or not that filter still works.
 */
{
  const pos = new Map();
  ALL_LESSONS.forEach((l, i) => {
    for (const id of l.wordIds ?? []) if (!pos.has(id)) pos.set(id, i);
  });
  const formPos = new Map();
  for (const w of WORDS) {
    const p = pos.get(w.id);
    if (p === undefined) continue;
    const c = formPos.get(w.urdu);
    if (c === undefined || p < c) formPos.set(w.urdu, p);
  }
  const early = [];
  ALL_LESSONS.forEach((l, i) => {
    if (l.kind !== 'sentences' && l.kind !== 'grammar') return;
    for (const track of ['both', 'roman']) {
      for (const ex of buildLessonExercises(l, [], track)) {
        for (const form of (ex.sentence && ex.sentence.words) || []) {
          const p = formPos.get(form);
          if (p !== undefined && p > i) early.push({ form, at: i, lesson: l.id, taught: p });
        }
      }
    }
  });
  if (early.length) {
    const uniq = [...new Map(early.map((e) => [`${e.lesson}|${e.form}`, e])).values()];
    bad(
      `${uniq.length} word form${uniq.length === 1 ? ' is' : 's are'} shown before the lesson that teaches them:\n` +
        uniq
          .slice(0, 8)
          .map((e) => `      "${e.form}" in ${e.lesson} (position ${e.at}) but taught at ${e.taught}`)
          .join('\n')
    );
  }
}

// ------------------------------------------------------------------- report

if (problems.length) {
  console.error(`check:coverage — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  console.error(
    `  A lesson has to name the words it teaches, and the path has to name every\n` +
      `  word. Vocabulary lessons get their \`wordIds\` from \`coverTopics\` in\n` +
      `  src/data/units.ts, which spreads each topic across enough lessons to cover\n` +
      `  it. If a word is unreachable, that is where it went missing.`
  );
  process.exit(1);
}

const perLesson = vocab.map((l) => l.wordIds.length);
console.log(
  `check:coverage — all ${WORDS.length} words are taught, each by exactly one of ${vocab.length} vocabulary lessons ` +
    `(${Math.min(...perLesson)} to ${Math.max(...perLesson)} words each). ${ALL_LESSONS.length} lessons, no id used twice, ` +
    `and no sentence puts a word on screen before the lesson that teaches it.`
);
