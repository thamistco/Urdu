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
 * "Topic", not "word", and the reason has changed — so this says the real one
 * rather than the one that used to be true.
 *
 * It used to be that word-level was impossible: a vocab lesson showed a random
 * handful of its topic, and nothing recorded which handful a given playthrough
 * drew. That is no longer so. Lessons now carry `wordIds`, topics are spread
 * across enough lessons to cover them, and the exact word taught at each point
 * on the path is known.
 *
 * So word-level became possible, and measuring it found 116 of 1,665 word forms
 * appearing before the lesson that teaches them — "میز" used by the beginner
 * sentence lesson at path position 58 and taught at 61.
 *
 * That was never a regression. Before the split those same sentences drew on
 * words a learner had roughly a one in five chance of ever having been shown, so
 * the exposure was worse and simply unmeasurable; making coverage exhaustive is
 * what turned it into a number.
 *
 * It is fixed, in the generator rather than here: `readableSentences` filters a
 * sentence lesson's pool to sentences whose vocabulary the learner has met, and
 * `check:coverage` holds it at zero against what the generator actually emits.
 * All 37 sentence and grammar lessons have more readable sentences than they
 * need, so nothing was starved to achieve it.
 *
 * This check stays at topic level anyway, and now for a plain reason rather than
 * a limitation: word-level ordering is owned by `check:coverage`, and two checks
 * asserting one property is how they drift apart.
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

const { load } = require('./lib/load-ts');
const { classify: classifyWord } = require('./lib/urdu-morph');

const { ALL_LESSONS, UNITS } = load('src/data/units.ts');
const { WORDS, PHRASES, TOPICS } = load('src/data/words.ts');
const { GRAMMAR } = load('src/data/grammar.ts');
const { NUMERALS } = load('src/data/art.ts');
const { SENTENCES, PASSAGES, DIALOGUES } = load('src/data/sentences.ts');
const { GRAMMAR_TRANSLIT } = load('src/data/translit.ts');
const { buildLessonExercises } = load('src/exercises/generator.ts');
const { taughtConceptsUpTo } = load('src/lib/review.ts');

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
 *
 * GRAMMAR_TRANSLIT is one source of these — it exists to romanise drill
 * options, so it holds the forms drills actually offer — but it is maintained
 * for that purpose and is not a closed-class inventory. The rest come from
 * FUNCTION_WORDS in the morphology helper, which is.
 */
const CLOSED_CLASS = new Set(Object.keys(GRAMMAR_TRANSLIT));

/** The vocabulary, as surface forms, for the morphology helper to resolve against. */
const VOCAB = new Set([...WORDS.map((w) => w.urdu), ...PHRASES.map((p) => p.urdu)]);

/**
 * Multi-word vocabulary entries, longest first. 27 of the course's 28 phrases
 * contain a space, as do entries like گرم پانی and واپسی ٹکٹ, so splitting on
 * whitespace before looking anything up reports both halves of a taught phrase
 * as untaught words — السلام and علیکم were two of the loudest such findings.
 */
const MULTIWORD = [...VOCAB].filter((v) => v.includes(' ')).sort((a, b) => b.length - a.length);

const URDU_PUNCT = /[۔،؟!]+$/;

/**
 * Split `text` into vocabulary-sized units: multi-word entries stay whole,
 * everything else is a word.
 */
const tokenize = (text) => {
  let rest = ` ${text.trim().replace(/[۔،؟!]+/g, ' ')} `;
  const found = [];
  for (const phrase of MULTIWORD) {
    const padded = ` ${phrase} `;
    while (rest.includes(padded)) {
      found.push(phrase);
      rest = rest.replace(padded, ' ');
    }
  }
  return [
    ...found,
    ...rest
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(URDU_PUNCT, ''))
      .filter((w) => w && !w.includes('___')),
  ];
};

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
  // A phrases lesson carries no `topic` field — the generator hardcodes the
  // 'phrases' pool for it (see PHRASE_WORDS in generator.ts) — so it has to be
  // recorded by kind or every phrase reads as never taught.
  if (l.kind === 'phrases') running.add('phrases');
  topicsByLessonId.set(l.id, new Set(running));
}
// A lesson's own `level` marks which CEFR level it belongs to; the topics
// taught by the *last* lesson carrying each level is that level's full
// vocabulary, for the level-granularity measurement below.
for (const l of ALL_LESSONS) {
  if (l.level) levelEndTopics.set(l.level, new Set(topicsByLessonId.get(l.id)));
}

/**
 * A topic is taught by a run of consecutive lessons, and every word in it by
 * exactly one of them.
 *
 * This used to assert one topic, one lesson, and exit if it ever found two. That
 * held right up until topics were spread across enough lessons to cover their
 * vocabulary — First words is seven lessons now — so what is checked here is the
 * property that replaced it: the parts of a topic sit together, so "the learner
 * has reached this topic" still names a single place on the path rather than a
 * scattering.
 *
 * The stronger statement, that each word is taught exactly once by exactly one
 * lesson, is `check:coverage`, which owns it.
 */
{
  const firstAt = new Map();
  const lastAt = new Map();
  ALL_LESSONS.forEach((l, i) => {
    if (l.kind !== 'vocab' || !l.topic) return;
    if (!firstAt.has(l.topic)) firstAt.set(l.topic, i);
    lastAt.set(l.topic, i);
  });
  for (const [topic, first] of firstAt) {
    const span = lastAt.get(topic) - first + 1;
    const parts = ALL_LESSONS.filter((l) => l.topic === topic && l.kind === 'vocab').length;
    if (span !== parts) {
      console.error(
        `check:order — the ${parts} lessons teaching "${topic}" are spread over ${span} places on the path.\n` +
          `  A topic's parts have to stay together, or "taught by here" stops naming one point.`
      );
      process.exit(1);
    }
  }
}

/**
 * A word is taught once.
 *
 * 179 entries used to teach a word the learner had already met, under a second
 * topic — body and body-more shared eight, tech and digital nine, jobs and
 * jobs-more seven. The learner is shown it as new material twice and the
 * spaced-repetition scheduler tracks the two entries as unrelated cards, so
 * neither reinforces the other.
 *
 * Homographs are the exception and are common in Urdu: سونا is both "to sleep"
 * and "gold", کافی both "enough" and "coffee", کل both "tomorrow" and "total".
 * Those are two words sharing a spelling and both belong. So the rule is not
 * "no repeated spelling" but "no repeated spelling that also means the same
 * thing" — which is what makes it safe to enforce.
 */
{
  const byUrdu = new Map();
  for (const w of WORDS) {
    if (!byUrdu.has(w.urdu)) byUrdu.set(w.urdu, []);
    byUrdu.get(w.urdu).push(w);
  }
  // A meaning is a slash-separated list of glosses; two entries mean the same
  // thing if they share any gloss, ignoring parenthetical asides.
  const glosses = (m) =>
    new Set(
      m
        .toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  const repeats = [];
  for (const [urdu, ws] of byUrdu) {
    for (let i = 0; i < ws.length; i++) {
      for (let j = i + 1; j < ws.length; j++) {
        if (ws[i].topic === ws[j].topic) continue;
        const a = glosses(ws[i].meaning);
        if ([...glosses(ws[j].meaning)].some((g) => a.has(g))) {
          repeats.push(`${urdu} "${ws[i].meaning}" — taught in both ${ws[i].topic} and ${ws[j].topic}`);
        }
      }
    }
  }
  if (repeats.length) {
    console.error(`check:order — ${repeats.length} word(s) are taught twice under the same meaning:`);
    for (const r of repeats.slice(0, 25)) console.error(`  ${r}`);
    if (repeats.length > 25) console.error(`  … and ${repeats.length - 25} more`);
    console.error('  (A homograph — two words sharing a spelling — should differ in meaning, and is allowed.)');
    process.exit(1);
  }
}

/**
 * `Topic.level` must say the same thing as the path.
 *
 * A topic's CEFR level is written down twice: on the topic itself, where the
 * Practice screen reads it to group topics by level, and implicitly by which
 * unit teaches it, which is the level the learner actually meets it at. Nothing
 * kept the two in step, and they had silently drifted apart on 11 topics —
 * `places` and `verbs` calling themselves elementary while the path taught them
 * at intermediate, `opposites` calling itself intermediate while the path had
 * it at advanced. Practice offered a topic as A2 that the course would not
 * reach for another twenty units.
 *
 * The path wins, because it is what a learner walks. This proves the label
 * agrees with it, the same way check:theme proves colors.ts and the Tailwind
 * config agree rather than trying to merge them.
 */
{
  const pathLevel = new Map();
  for (const u of UNITS) for (const l of u.lessons) if (l.kind === 'vocab' && l.topic) pathLevel.set(l.topic, u.level);
  const drifted = TOPICS.filter((t) => pathLevel.has(t.id) && pathLevel.get(t.id) !== t.level);
  if (drifted.length) {
    console.error(
      `check:order — ${drifted.length} topic(s) label themselves with a different CEFR level than the unit that teaches them:`
    );
    for (const t of drifted) {
      console.error(`  ${t.id}: Topic.level is "${t.level}", but it is taught in a ${pathLevel.get(t.id)} unit.`);
    }
    process.exit(1);
  }
}

/**
 * Classify every word in `text` against the topics taught so far.
 *
 * A word is resolved to the vocabulary entry it is a form of before its topic
 * is looked up: running text inflects and a word list does not, so پیتا has to
 * find پینا and کمرے has to find کمرہ. A form that resolves to a taught entry
 * is taught — the learner who was shown پینا can read پیتا.
 */
function classify(text, taught) {
  const late = [];
  const unknown = [];
  for (const w of tokenize(text)) {
    if (CLOSED_CLASS.has(w)) continue;
    const c = classifyWord(w, VOCAB);
    if (c.kind === 'function' || c.kind === 'name') continue;
    if (c.kind === 'unknown') {
      unknown.push(w);
      continue;
    }
    // Every topic that teaches any reading of this form. Satisfied if the
    // learner has reached any of them — the same leniency a word listed under
    // two topics already gets, extended to a form that could be two words.
    const topics = new Set();
    for (const lemma of c.lemmas) for (const t of topicsOf.get(lemma) ?? []) topics.add(t);
    if (!topics.size) {
      unknown.push(w);
      continue;
    }
    const shown = c.lemmas.includes(w) ? w : `${w} [${c.lemmas.join('/')}]`;
    if (![...topics].some((t) => taught.has(t))) late.push(`${shown} (${[...topics].join('/')})`);
  }
  return { late, unknown };
}

const positionFindings = [];
const levelFindings = [];
const unknownWords = new Map();

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
    /**
     * The sentences a concept borrows from SENTENCES *are* tested: the lesson
     * player runs them through the real sentenceBuild exercise, decoy tiles
     * and all, same as a "sentences" lesson.
     *
     * Which sentences those are is asked of the generator rather than of the
     * tag. A concept's tagged pool is wider than any lesson shows — `g-to-be`
     * has fifteen and draws six — and `readableSentences` already drops the
     * ones whose words are not taught by this point. Reading the whole pool
     * therefore reported sentences no learner can be shown: regrouping the
     * beginner units so each one holds a single theme moved jobs and rooms
     * after the copula lesson, and this reported five "میں ڈاکٹر ہوں"-shaped
     * findings while the lesson itself quietly drew "یہ کتاب ہے", "میں خوش
     * ہوں" and four more from what the learner already had. Measured across
     * every grammar lesson before and after that regrouping: not one drew
     * fewer sentences than before.
     *
     * Asking the generator is also strictly stronger. The old rule never
     * looked at what was drawn, so a filter that failed would have gone
     * unnoticed; this fails the moment a learner is actually shown a word the
     * course has not taught. It is the same choice the concept-ordering
     * section below already made, for the same reason.
     */
    const drawn = new Set();
    for (const ex of buildLessonExercises(lesson, [], 'both', new Set())) {
      const sen = ex.sentence ?? (ex.word && SENTENCES.find((x) => x.id === ex.word.id));
      if (sen && sen.words) drawn.add(sen);
    }
    for (const sen of drawn) {
      const text = sen.words.join(' ');
      const { late, unknown } = classify(text, taught);
      unknown.forEach((u) => unknownWords.set(u, (unknownWords.get(u) ?? 0) + 1));
      if (late.length) positionFindings.push(`grammar ${lesson.id} (${c.id}): "${text}" uses ${late.join(', ')}`);
    }
  }

  if (lesson.kind === 'dialogue' && lesson.dialogueId) {
    const d = DIALOGUES.find((x) => x.id === lesson.dialogueId);
    if (d) {
      for (const l of d.lines) {
        const { late, unknown } = classify(l.urdu, taught);
        unknown.forEach((u) => unknownWords.set(u, (unknownWords.get(u) ?? 0) + 1));
        if (late.length) positionFindings.push(`dialogue ${lesson.id} (${d.id}): "${l.urdu}" uses ${late.join(', ')}`);
      }
    }
  }

  if (lesson.kind === 'reading' && lesson.passageId) {
    const p = PASSAGES.find((x) => x.id === lesson.passageId);
    if (p) {
      for (const l of p.lines) {
        const { late, unknown } = classify(l.urdu, taught);
        unknown.forEach((u) => unknownWords.set(u, (unknownWords.get(u) ?? 0) + 1));
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
    unknown.forEach((u) => unknownWords.set(u, (unknownWords.get(u) ?? 0) + 1));
    if (late.length) levelFindings.push(`sentence ${sen.id} (level ${level}): "${text}" uses ${late.join(', ')}`);
  }
}

/**
 * URD-026: is every sentence a "sentences" or "grammar" lesson can actually
 * draw tagged to a grammar concept the learner has already been taught — or
 * to no concept at all?
 *
 * This is a different axis than the word/topic ordering above: a sentence
 * can pass every word through `readableSentences`' vocabulary filter while
 * still being built entirely around a tense or construction (future,
 * ability, obligation, comparative...) no `grammar` lesson has taught yet.
 * Measured before the fix: `s-intermediate` (an elementary-unit lesson) drew
 * sentences tagging g-future/g-ability/g-obligation/g-comparative in 6 of 8
 * picks, every one of those concepts taught 90-115 lesson-positions later;
 * `s-intermediate-2` drew 8 of 8 untaught.
 *
 * Driven against the real generator (`buildLessonExercises`), not a
 * reimplementation of `readableSentences`' filter — the same reason
 * `check:answerable`/`check:shape` drive real generation rather than
 * reasoning about the functions that produce it: a check that re-derives the
 * same logic it is meant to catch a bug in can share the bug. `sentenceBuild`
 * exercises carry their `sentence` directly; `meaningPick`/`wordFromMeaning`
 * carry it reshaped as a `Word` (`SENTENCE_WORDS`, `generator.ts`) under the
 * same id, so it is looked up back in `SENTENCES` to recover its `concept`
 * tag.
 */
const uniq = (arr) => [...new Set(arr)];

const conceptFindings = [];
for (const lesson of ALL_LESSONS) {
  if (lesson.kind !== 'sentences' && lesson.kind !== 'grammar') continue;
  const taughtConcepts = taughtConceptsUpTo(lesson.id);
  const exercises = buildLessonExercises(lesson, [], 'both', new Set());
  for (const ex of exercises) {
    let sen;
    if (ex.kind === 'sentenceBuild') sen = ex.sentence;
    else if ((ex.kind === 'meaningPick' || ex.kind === 'wordFromMeaning') && ex.word) {
      sen = SENTENCES.find((s) => s.id === ex.word.id);
    }
    if (sen && sen.concept && !taughtConcepts.has(sen.concept)) {
      conceptFindings.push(`${lesson.id}: "${sen.words.join(' ')}" tags ${sen.concept}, not yet taught`);
    }
  }
}
const conceptUniq = uniq(conceptFindings);

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

console.log(
  `\n-- grammar-concept ordering (URD-026: every real "sentences"/"grammar" exercise, checked against` +
    ` concepts taught at this exact lesson's position) --`
);
if (conceptUniq.length) {
  console.log(`${conceptUniq.length} finding(s):`);
  for (const f of conceptUniq.slice(0, 40)) console.log(`  ${f}`);
  if (conceptUniq.length > 40) console.log(`  … and ${conceptUniq.length - 40} more`);
} else {
  console.log('none — every sentence a lesson can actually draw tags only a concept already taught, or none at all.');
}

if (unknownWords.size) {
  // Listed in full and by frequency rather than truncated. This is a backlog —
  // the words the course *uses* and never teaches — and the first version
  // printed thirty of them in whatever order a Set happened to hold, which is
  // neither the whole list nor the part worth doing first.
  const ranked = [...unknownWords].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  console.log(`\n-- words used in sentences/passages/dialogues/grammar with no matching vocabulary entry --`);
  console.log(`${unknownWords.size} distinct, ${ranked.reduce((n, [, c]) => n + c, 0)} uses in all:`);
  console.log(`  ${ranked.map(([w, c]) => `${w}${c > 1 ? ` ×${c}` : ''}`).join(', ')}`);
}

/**
 * Within a vocab lesson: is every word it tests one it has already taught?
 *
 * The check above exempts vocab lessons, on a premise its own doc comment
 * states — "a topic maps to exactly one lesson, so a vocab lesson only ever
 * tests the topic it introduces". That stopped being true when topics were
 * split into parts. A topic's words are now spread across several lessons, and
 * a lesson's exercises are drawn from the topic, so part one can test a word
 * part two teaches. The exemption held; the reason for it had gone.
 *
 * Found by measuring rather than by reading: `v-numbers-more` teaches eleven
 * to twenty, and its closing matching board seated sau, hazaar and laakh —
 * all three taught in the next lesson. The cause was that eleven to twenty
 * shared one picture, so the board could seat only one of them and topped up
 * from the rest of the topic, which is behaviour its own comment allows.
 *
 * Pretests are excluded: guessing before being told is the point of those, and
 * they cost no heart. Sentences are excluded because a grammar card teaches
 * them, not a word card — the block above is what covers those.
 */
const TESTS_THE_WORD = new Set([
  'multipleChoice',
  'meaningPick',
  'wordFromMeaning',
  'listenTap',
  'wordBuild',
  'typeWord',
  'matching',
]);

const earlyWords = [];
{
  const taughtAlready = new Set();
  for (const lesson of ALL_LESSONS) {
    const exercises = buildLessonExercises(lesson, [], 'both');
    const teachAt = new Map();
    exercises.forEach((e, i) => {
      if (e.kind === 'wordTeach' && e.word && !teachAt.has(e.word.id)) teachAt.set(e.word.id, i);
    });
    exercises.forEach((e, i) => {
      if (!TESTS_THE_WORD.has(e.kind) || e.pretest) return;
      const ids = e.kind === 'matching' ? (e.words || []).map((w) => w.id) : e.word ? [e.word.id] : [];
      for (const id of ids) {
        if (!id.startsWith('w-') || taughtAlready.has(id)) continue;
        const at = teachAt.get(id);
        if (at === undefined || at > i) {
          earlyWords.push(
            `${lesson.id} exercise ${i} (${e.kind}) tests ${id}, taught ` +
              (at === undefined ? 'in a later lesson' : `at exercise ${at} of this one`)
          );
        }
      }
    });
    exercises.forEach((e) => {
      if (e.kind === 'wordTeach' && e.word) taughtAlready.add(e.word.id);
    });
  }
}

/**
 * A sentence is met before it is produced.
 *
 * `sentenceReinforceClimb` walks each sentence through meet → produce →
 * recall → produce → recall, and the turn a sentence *entered* that cycle used
 * to depend on its position in the list: `turn = (round + idx) % ROUNDS`, so
 * only the first sentence began on the meet turn. Across the course 382 of
 * 524 sentences were asked to be assembled from tiles, or recalled from their
 * English, before the app had ever shown them — in one pronouns lesson, two of
 * five met their meet turn at exercise 24 of 28.
 *
 * A playtester found it as five sentences it could only guess at. This is the
 * same fact without a browser: for every lesson on both tracks, the first
 * exercise that uses a sentence must be the one that introduces it.
 */
const lateSentences = [];
for (const lesson of ALL_LESSONS) {
  for (const track of ['both', 'script']) {
    const exercises = buildLessonExercises(lesson, [], track);
    const firstUse = new Map();
    exercises.forEach((e, i) => {
      // A sentence rides in `word` for the two recognition kinds and in
      // `sentence` for the build — it is one item either way.
      const id = e.sentence ? e.sentence.id : e.word ? e.word.id : null;
      if (!id || !id.startsWith('s-') || firstUse.has(id)) return;
      firstUse.set(id, { kind: e.kind, at: i });
    });
    for (const [id, use] of firstUse) {
      if (use.kind === 'meaningPick') continue;
      lateSentences.push(`${lesson.id} (${track}) meets ${id} with ${use.kind} at exercise ${use.at}`);
    }
  }
}

/**
 * Within a lesson: a number is only asked about in digits the lesson has shown.
 *
 * `numeralRead` is the one exercise whose question is not an item — it shows
 * ۴۷ and asks what it is worth — so nothing above can see it. The generator
 * builds each one from the numeral glyphs of the very words that lesson
 * teaches, which makes this rule hold by construction today; that is exactly
 * why it is worth pinning. Move the call above the climb, or widen it to the
 * whole topic, and a learner meets a digit in a question before any card has
 * shown it, with nothing else in this file able to notice.
 *
 * Read off the enumerated exercises rather than the word list, so it measures
 * the order a learner actually meets them in.
 */
const unshownDigits = [];
for (const lesson of ALL_LESSONS) {
  const shown = new Set();
  for (const ex of buildLessonExercises(lesson, [], 'both', new Set())) {
    if (ex.kind === 'wordTeach' && ex.word) for (const g of NUMERALS[ex.word.id] || '') shown.add(g);
    if (ex.kind !== 'numeralRead') continue;
    const missing = [...ex.glyphs].filter((g) => !shown.has(g));
    if (missing.length) unshownDigits.push(`${lesson.id} asks about ${ex.glyphs} before showing ${missing.join(' ')}`);
  }
}

console.log(`\n-- within a lesson: every numeral read in digits the lesson has shown --`);
if (unshownDigits.length) {
  console.log(`${unshownDigits.length} finding(s):`);
  for (const f of unshownDigits.slice(0, 20)) console.log(`  ${f}`);
} else {
  console.log('none — no number is asked about in a digit its lesson has not taught.');
}

console.log(`\n-- every sentence introduced before it is produced --`);
if (lateSentences.length) {
  console.log(`${lateSentences.length} finding(s):`);
  for (const f of lateSentences.slice(0, 20)) console.log(`  ${f}`);
  if (lateSentences.length > 20) console.log(`  … and ${lateSentences.length - 20} more`);
} else {
  console.log('none — every sentence is shown before the learner is asked to produce it.');
}

console.log(`\n-- within a lesson: every word tested after the card that teaches it --`);
if (earlyWords.length) {
  console.log(`${earlyWords.length} finding(s):`);
  for (const f of earlyWords.slice(0, 20)) console.log(`  ${f}`);
  if (earlyWords.length > 20) console.log(`  … and ${earlyWords.length - 20} more`);
} else {
  console.log('none — no lesson asks about a word before it has shown it.');
}

console.log('');
if (earlyWords.length) {
  console.error(
    `${earlyWords.length} exercise(s) test a word before the lesson teaches it. The fix is usually the picture: ` +
      `words that share one cue collide, and a matching board that cannot seat them tops up from the rest of the topic.`
  );
  process.exit(1);
}
if (unshownDigits.length) {
  console.error(
    `${unshownDigits.length} numeral question(s) use a digit their own lesson has not shown. ` +
      `See numeralReadExercises: the digits come from the lesson's own words, so this means the call moved.`
  );
  process.exit(1);
}
if (lateSentences.length) {
  console.error(
    `${lateSentences.length} sentence(s) are produced or recalled before the exercise that introduces them. ` +
      `See sentenceReinforceClimb: the turn a sentence enters the cycle on must not depend on its position.`
  );
  process.exit(1);
}
if (positionUniq.length) {
  console.error(
    `${positionUniq.length} place(s) test a word before its topic's lesson is reached. ` +
      `This is a content-ordering problem, not a code bug — the fix is moving the word, the sentence, or the lesson.`
  );
  process.exit(1);
}
if (conceptUniq.length) {
  console.error(
    `${conceptUniq.length} place(s) draw a sentence tagged to a grammar concept before that concept's lesson is ` +
      `reached. This is a content-ordering problem, not a code bug — the fix is re-tagging the sentence or moving ` +
      `the lesson.`
  );
  process.exit(1);
}
console.log('check:order — every word tested at a fixed position is from a topic already taught there.');
