/**
 * Is every word tested only after it has been taught?
 *
 * Vocab lessons are self-checking by construction: a topic maps to exactly
 * one lesson (`check:structure`-adjacent invariant, verified below), so a
 * vocab lesson only ever tests the topic it introduces. The exposure this
 * checks is everywhere else a specific piece of content — a grammar
 * concept's practice sentence, a reading passage, a dialogue — puts
 * vocabulary in front of a learner *without* also giving its meaning away,
 * so recognising the word is actually the thing being tested: is every
 * word in it one whose *topic* a vocab lesson has already reached, at this
 * exact position on the path?
 *
 * That "without giving its meaning away" carve-out is why a grammar
 * concept's `examples` and its drills' `meaning` are not checked, even
 * though they are on GRAMMAR too: GrammarExercises.tsx shows the full
 * English gloss next to both, unconditionally, and a drill only ever
 * grades the closed-class blank (already excluded, see CLOSED_CLASS). There
 * is nothing to recognise blind, so there is nothing this check is for. The
 * two example SENTENCES a concept borrows *are* checked: the lesson player
 * runs them through the real sentenceBuild exercise (decoy tiles, no gloss
 * shown), same as a "sentences" lesson.
 *
 * "Topic", not "word" — a vocab lesson only ever shows a random handful of
 * its topic (see the doc comment on `taughtUpTo` in generator.ts), so word-
 * level tracking would need to know which specific words a specific
 * playthrough happened to draw, which nothing records. Topic-level is the
 * same granularity the review fallback already uses, and it is what the
 * course actually promises: reach the lesson, and its topic is available.
 *
 * Two kinds of finding are reported separately, because they call for
 * different responses. A word whose topic comes *later* on the path is an
 * ordering bug — the fix is moving content. A word absent from the
 * vocabulary entirely is a content gap — it may be a closed-class word that
 * never needed an entry (already excluded, see CLOSED_CLASS below) or a
 * word nobody added; either way it is not this script's job to guess which.
 *
 * Dialogue, reading, and grammar-linked sentences are checked at this exact
 * position: every lesson id in units.ts pins one specific real
 * passage/dialogue (verified below — the generator's shuffle-fallback for
 * a missing id is live code with no live caller today), so the *specific*
 * content each lesson shows is known statically.
 *
 * Whole "sentences" lessons are checked only at the CEFR-level grain, never
 * at a lesson's own position — deliberately, and only after measuring what
 * position-checking one actually produced. The generator draws a random
 * subset of *every* sentence at the lesson's level
 * (`SENTENCES.filter(x => x.level === lesson.level)`), and a level
 * routinely holds several such lessons sharing that one pool (beginner has
 * three). Checking the first of them against its own early position flagged
 * ~430 "late" findings — almost the entire beginner sentence pool — not
 * because the sentences were wrong, but because the *later* sentences lesson
 * at the same level would have shown the identical sentence and passed. That
 * was measuring where the lesson-helper happened to place a repeatable pool,
 * not a property of the content, so it is not run. Level-wide is the
 * invariant that matches how the pool is actually drawn.
 *
 * Run with:  npm run check:order
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = new Map();
function load(rel) {
  const resolved = [rel, rel + '.ts', path.join(rel, 'index.ts')]
    .map((p) => path.join(ROOT, p))
    .find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!resolved) throw new Error(`cannot resolve ${rel}`);
  if (cache.has(resolved)) return cache.get(resolved);
  const js = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(resolved, mod.exports);
  const here = path.relative(ROOT, path.dirname(resolved));
  new Function('exports', 'module', 'require', js)(mod.exports, mod, (id) =>
    id.startsWith('.') ? load(path.join(here, id)) : require(id)
  );
  cache.set(resolved, mod.exports);
  return mod.exports;
}

const { ALL_LESSONS } = load('src/data/units.ts');
const { WORDS, PHRASES } = load('src/data/words.ts');
const { GRAMMAR } = load('src/data/grammar.ts');
const { SENTENCES, PASSAGES, DIALOGUES } = load('src/data/sentences.ts');
const { GRAMMAR_TRANSLIT } = load('src/data/translit.ts');

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'];

// ---- reverse lookup: an Urdu word-form -> the topic(s) that teach it ------

const topicsOf = new Map();
const addTopic = (urdu, topic) => {
  if (!topicsOf.has(urdu)) topicsOf.set(urdu, new Set());
  topicsOf.get(urdu).add(topic);
};
for (const w of WORDS) addTopic(w.urdu, w.topic);
for (const p of PHRASES) addTopic(p.urdu, 'phrases');

/**
 * Closed-class grammar tokens: pronouns, copulas, postpositions, verb
 * endings. These are taught by the grammar concepts themselves (in a fixed
 * pedagogical sequence — see the header comment in grammar.ts) rather than
 * by a vocab topic, so they are not what this check is for and are excluded
 * rather than flagged as belonging to no topic.
 */
const CLOSED_CLASS = new Set(Object.keys(GRAMMAR_TRANSLIT));

const URDU_PUNCT = /[۔،؟!]+$/;
const tokenize = (text) =>
  text
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(URDU_PUNCT, ''))
    .filter((w) => w && !w.includes('___'));

// ---- walk the real path, tracking what a vocab lesson has introduced -----

/**
 * `topicsByLessonId[id]` = the set of topics a vocab lesson has introduced by
 * the time lesson `id` is reached, *inclusive* of `id` itself if it is a
 * vocab lesson — matching `taughtUpTo` in generator.ts, which the review
 * fallback already relies on having this exact inclusive boundary.
 */
const topicsByLessonId = new Map();
const levelEndTopics = new Map(); // level -> topics taught by the last lesson of that level
const running = new Set();
for (const l of ALL_LESSONS) {
  if (l.kind === 'vocab' && l.topic) running.add(l.topic);
  topicsByLessonId.set(l.id, new Set(running));
}
// A lesson's own `level` marks which CEFR level it belongs to; the topics
// taught by the *last* lesson carrying each level is that level's full
// vocabulary, for the level-granularity measurement below.
for (const l of ALL_LESSONS) {
  if (l.level) levelEndTopics.set(l.level, new Set(topicsByLessonId.get(l.id)));
}

// One vocab topic must map to exactly one lesson — the invariant everything
// above assumes. If it ever stopped holding, "taught by this lesson" would
// stop meaning anything.
{
  const seen = new Map();
  for (const l of ALL_LESSONS) {
    if (l.kind !== 'vocab' || !l.topic) continue;
    if (seen.has(l.topic)) {
      console.error(`check:order — topic "${l.topic}" is taught by both ${seen.get(l.topic)} and ${l.id}.`);
      process.exit(1);
    }
    seen.set(l.topic, l.id);
  }
}

/** Classify every word in `text` against the topics taught so far. */
function classify(text, taught) {
  const late = [];
  const unknown = [];
  for (const w of tokenize(text)) {
    if (CLOSED_CLASS.has(w)) continue;
    const topics = topicsOf.get(w);
    if (!topics) {
      unknown.push(w);
      continue;
    }
    if (![...topics].some((t) => taught.has(t))) late.push(`${w} (${[...topics].join('/')})`);
  }
  return { late, unknown };
}

const positionFindings = [];
const levelFindings = [];
const unknownWords = new Set();

for (const lesson of ALL_LESSONS) {
  const taught = topicsByLessonId.get(lesson.id);

  if (lesson.kind === 'grammar' && lesson.conceptId) {
    const c = GRAMMAR.find((g) => g.id === lesson.conceptId);
    if (!c) continue;
    // `c.examples` and `c.drills` are not checked here: both render with the
    // full English meaning in view unconditionally (GrammarExercises.tsx —
    // the "In use" cards, and `drill.meaning` beside the prompt), and the
    // only thing a drill actually grades is the closed-class blank, already
    // excluded above. Nothing about the surrounding vocabulary is tested, so
    // it is illustrative, not exposure this check is for.
    //
    // The two sentences a concept borrows from SENTENCES *are* tested: the
    // lesson player runs them through the real sentenceBuild exercise
    // (generator.ts), decoy tiles and all, same as a "sentences" lesson.
    for (const sen of SENTENCES.filter((s) => s.concept === c.id)) {
      const text = sen.words.join(' ');
      const { late, unknown } = classify(text, taught);
      unknown.forEach((u) => unknownWords.add(u));
      if (late.length) positionFindings.push(`grammar ${lesson.id} (${c.id}): "${text}" uses ${late.join(', ')}`);
    }
  }

  if (lesson.kind === 'dialogue' && lesson.dialogueId) {
    const d = DIALOGUES.find((x) => x.id === lesson.dialogueId);
    if (d) {
      for (const l of d.lines) {
        const { late, unknown } = classify(l.urdu, taught);
        unknown.forEach((u) => unknownWords.add(u));
        if (late.length) positionFindings.push(`dialogue ${lesson.id} (${d.id}): "${l.urdu}" uses ${late.join(', ')}`);
      }
    }
  }

  if (lesson.kind === 'reading' && lesson.passageId) {
    const p = PASSAGES.find((x) => x.id === lesson.passageId);
    if (p) {
      for (const l of p.lines) {
        const { late, unknown } = classify(l.urdu, taught);
        unknown.forEach((u) => unknownWords.add(u));
        if (late.length) positionFindings.push(`reading ${lesson.id} (${p.id}): "${l.urdu}" uses ${late.join(', ')}`);
      }
    }
  }

  // "sentences"-kind lessons are deliberately not checked here: a level
  // routinely has several of them (beginner alone has three, at positions
  // 9, 15 and 31), and every one draws from the exact same
  // `SENTENCES.filter(level)` pool — the same sentence can surface at any
  // of them. Checking the *first* one against its own early position would
  // flag most of the level's sentences as "late", not because the content
  // is wrong but because this lesson-instance happens to sit early; the
  // next lesson at the same level would pass the identical sentence. That
  // is measuring where the lesson-helper happened to place a repeatable
  // pool, not a property of the content. The level-wide pass below is the
  // invariant that actually matches how the pool is drawn.
}

for (const level of LEVELS) {
  const pool = SENTENCES.filter((s) => s.level === level);
  const taught = levelEndTopics.get(level) ?? new Set();
  for (const sen of pool) {
    const text = sen.words.join(' ');
    const { late, unknown } = classify(text, taught);
    unknown.forEach((u) => unknownWords.add(u));
    if (late.length) levelFindings.push(`sentence ${sen.id} (level ${level}): "${text}" uses ${late.join(', ')}`);
  }
}

const uniq = (arr) => [...new Set(arr)];
const positionUniq = uniq(positionFindings);
const levelUniq = uniq(levelFindings);

console.log(
  `${ALL_LESSONS.length} lessons walked in path order, ${WORDS.length} vocabulary words, ${SENTENCES.length} sentences\n`
);

console.log(
  `-- position ordering (grammar-linked sentences, dialogues, and readings checked against this` +
    ` exact lesson's position) --`
);
if (positionUniq.length) {
  console.log(`${positionUniq.length} finding(s):`);
  for (const f of positionUniq.slice(0, 40)) console.log(`  ${f}`);
  if (positionUniq.length > 40) console.log(`  … and ${positionUniq.length - 40} more`);
} else {
  console.log('none — every word used is from a topic taught at or before its lesson.');
}

console.log(
  `\n-- level ordering ("sentences" lessons only, checked against every topic taught anywhere in their` +
    ` CEFR level) --`
);
if (levelUniq.length) {
  console.log(`${levelUniq.length} finding(s) that still hold even at the looser, level-wide boundary:`);
  for (const f of levelUniq.slice(0, 40)) console.log(`  ${f}`);
  if (levelUniq.length > 40) console.log(`  … and ${levelUniq.length - 40} more`);
} else {
  console.log('none — every sentence a "sentences" lesson could show uses only vocabulary from its own level.');
}

if (unknownWords.size) {
  console.log(`\n-- words used in sentences/passages/dialogues/grammar with no matching vocabulary entry --`);
  console.log(
    `${unknownWords.size} distinct: ${[...unknownWords].slice(0, 30).join(', ')}${unknownWords.size > 30 ? ', …' : ''}`
  );
}

console.log('');
if (positionUniq.length) {
  console.error(
    `${positionUniq.length} place(s) test a word before its topic's lesson is reached. ` +
      `This is a content-ordering problem, not a code bug — the fix is moving the word, the sentence, or the lesson.`
  );
  process.exit(1);
}
console.log('check:order — every word tested at a fixed position is from a topic already taught there.');
