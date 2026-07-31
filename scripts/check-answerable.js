/**
 * Can every question actually be answered?
 *
 * Three separate reports of the same shape came back from real use: a tick
 * medallion asked "which word is this?" with ہاں, خوش, سلام and معاف beneath
 * it; a pair of cupped hands asked the same over معاف, شکریہ, سلام and نہیں; a
 * letter card offered "apple" for انار. Each time the picture could not
 * possibly single out its word, and each time the only way to answer was to
 * guess. That is a pattern, not three mistakes, and patterns need a check
 * rather than three fixes.
 *
 * So this generates every lesson on the path — every kind, both tracks, many
 * times over, because the generator is random — and asks of each exercise it
 * produces: is there enough on the screen to tell the right answer from the
 * three wrong ones? An exercise that fails is one a learner cannot answer
 * except by luck.
 *
 * Run with:  npm run check:answerable
 */

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

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

const { buildLessonExercises } = load('src/exercises/generator.ts');
const { unitsForTrack } = load('src/data/units.ts');
const { pictureIdentifies, cueOf } = load('src/data/art.ts');
const { WORDS, glossOf } = load('src/data/words.ts');

// ---- how many options, and where the answer sits --------------------------

/**
 * Two properties of a multiple-choice question that nothing was checking, and
 * that both turned out to be broken at once.
 *
 * **How many.** A four-option question is a 25% guess and a two-option one is a
 * coin flip. The placement test had questions with two.
 *
 * **Where the answer is.** Options are built as `[answer, ...distractors]` and
 * shuffled, so if the shuffle is not uniform the answer has a favourite seat.
 * The app shipped `[...arr].sort(() => Math.random() - 0.5)`, which is not a
 * shuffle — `sort` is undefined for an inconsistent comparator, and V8's
 * insertion sort barely moves the first element. Measured: with three options
 * the answer was first 43.7% of the time. A learner noticed before any test
 * did, because tapping the top tile worked far too often.
 *
 * Position is measured across every generated exercise rather than asserted
 * about the shuffle in isolation, so it stays true however the options are
 * built.
 */
const OPTION_FLOOR = 5;
const optionCounts = new Map();
const answerAt = new Map();
let optionQuestions = 0;

/**
 * The kinds that are genuinely "pick one of these", and so have a guess rate.
 *
 * Named rather than inferred from the presence of an `options` array: word-
 * building and sentence-building also carry one, but those are letter and word
 * *tiles* to assemble, where more tiles means a harder question, not an easier
 * one. Counting them as choices had this reporting hundreds of four-option
 * questions that were nothing of the sort — a check measuring the wrong thing,
 * confidently.
 *
 * `letterForm` is excluded too: its four options are the four joining
 * positions, which is the entire set that exists. There is no fifth.
 */
const CHOICE_KINDS = new Set(['letterPick', 'multipleChoice', 'meaningPick', 'listenTap', 'wordFromMeaning']);

function recordOptions(ex) {
  if (!CHOICE_KINDS.has(ex.kind)) return;
  if (!Array.isArray(ex.options) || !ex.options.length) return;
  const answerId = (ex.word || ex.letter || {}).id;
  if (!answerId) return;
  optionCounts.set(ex.options.length, (optionCounts.get(ex.options.length) || 0) + 1);
  const at = ex.options.findIndex((o) => o.id === answerId);
  if (at < 0) return;
  answerAt.set(at, (answerAt.get(at) || 0) + 1);
  optionQuestions++;
}

const problems = [];
const seen = new Map(); // rule → count, so one broken word does not print 400 times
const fail = (rule, detail) => {
  seen.set(rule, (seen.get(rule) || 0) + 1);
  if ((seen.get(rule) || 0) <= 3) problems.push(`${rule}: ${detail}`);
};

function distinct(values) {
  return new Set(values).size === values.length;
}

/**
 * The rules. Each takes one exercise and the track it was built for, and
 * complains if the question cannot be told apart from its own distractors.
 *
 * Exempted from `max-lines-per-function` and `complexity` deliberately: this is
 * a dispatch over the thirteen exercise kinds, and `complexity` counts every
 * `case` as a branch, so a flat table of thirteen short arms scores 42. Split
 * into thirteen named functions it would be strictly harder to read — the value
 * of this shape is seeing all the kinds side by side, which is how you notice a
 * kind is missing. The rule is right about tangled logic and wrong about
 * dispatch tables; see rule 159 in docs/ENGINEERING_STANDARDS.md.
 */
// eslint-disable-next-line max-lines-per-function, complexity
function check(ex, track) {
  const roman = track === 'roman';

  switch (ex.kind) {
    case 'multipleChoice':
      // The prompt is a picture. Either the picture names the thing, or the
      // exercise shows the English underneath — the component decides that
      // from `pictureIdentifies`, so what has to hold here is only that the
      // four *options* are told apart by what is written on them.
      if (!distinct(ex.options.map((o) => o.urdu))) fail('two options are the same word', `${ex.word.id}`);
      if (!pictureIdentifies(ex.word) && !distinct(ex.options.map((o) => o.meaning.toLowerCase())))
        fail('captioned picture with two options meaning the same', `${ex.word.id}`);
      break;

    case 'listenTap':
      // The prompt is audio; the options are pictures with their meanings
      // under them, so two options sharing a picture is only a problem if
      // they also share a meaning.
      if (!distinct(ex.options.map((o) => o.meaning.toLowerCase())))
        fail('listen: two options mean the same', `${ex.word.id}`);
      if (!distinct(ex.options.map(cueOf))) fail('listen: two options share a picture', `${ex.word.id}`);
      break;

    case 'meaningPick':
    case 'wordFromMeaning':
      if (!distinct(ex.options.map((o) => o.meaning.toLowerCase())))
        fail('two options mean the same', `${ex.word.id} — ${ex.options.map((o) => o.meaning).join(' / ')}`);
      if (!distinct(ex.options.map((o) => o.urdu))) fail('two options are the same word', `${ex.word.id}`);
      break;

    case 'matching':
      if (!distinct(ex.words.map(cueOf))) fail('matching board shares a picture', ex.words.map((w) => w.id).join(','));
      // What the tile shows, not the raw meaning: the board prints the gloss
      // with its register, so "yes" and "yes (polite)" really are two tiles.
      if (!distinct(ex.words.map((w) => glossOf(w).toLowerCase())))
        fail('matching board shares a caption', ex.words.map((w) => w.id).join(','));
      break;

    case 'wordBuild':
      if (roman) fail('letter tiles on the Roman track', ex.word.id);
      // The tray must contain every letter of the answer.
      for (const ch of Array.from(ex.word.urdu).filter((c) => c.trim())) {
        if (!ex.tiles.includes(ch)) fail('a letter of the answer is missing from the tray', `${ex.word.id} — ${ch}`);
      }
      break;

    case 'sentenceBuild':
      for (const w of ex.sentence.words) {
        if (!ex.tiles.includes(w)) fail('a word of the sentence is missing from the tray', `${ex.sentence.id} — ${w}`);
      }
      if (roman && !ex.romanTiles) fail('sentence tiles have no transliteration on the Roman track', ex.sentence.id);
      if (ex.romanTiles && ex.romanTiles.length !== ex.tiles.length)
        fail('transliterated tray does not match the tray', ex.sentence.id);
      break;

    case 'grammarDrill':
      if (!ex.drill.options.includes(ex.drill.answer)) fail('drill answer is not among its options', ex.drill.id);
      if (roman && !ex.romanOptions) fail('drill options have no transliteration on the Roman track', ex.drill.id);
      break;

    case 'letterForm':
    case 'letterPick':
    case 'letterTrace':
      if (roman) fail('script exercise on the Roman track', `${ex.kind} ${ex.letter.id}`);
      break;

    case 'reading':
      if (!ex.passage.question.options.includes(ex.passage.question.answer))
        fail('passage answer is not among its options', ex.passage.id);
      if (roman && ex.passage.lines.some((l) => !l.roman)) fail('passage line has no transliteration', ex.passage.id);
      break;

    case 'dialogue':
      if (!ex.dialogue.question.options.includes(ex.dialogue.question.answer))
        fail('dialogue answer is not among its options', ex.dialogue.id);
      if (roman && ex.dialogue.lines.some((l) => !l.roman))
        fail('dialogue line has no transliteration', ex.dialogue.id);
      break;

    default:
      break;
  }
}

// ---- run it ---------------------------------------------------------------

const TRACKS = ['both', 'roman'];
const PASSES = 6; // the generator is random; one pass proves very little

let generated = 0;
const kinds = new Map();

for (const track of TRACKS) {
  const lessons = unitsForTrack(track).flatMap((u) => u.lessons);
  for (let pass = 0; pass < PASSES; pass++) {
    for (const lesson of lessons) {
      let exercises;
      try {
        exercises = buildLessonExercises(lesson, [], track);
      } catch (e) {
        problems.push(`lesson ${lesson.id} (${track}) threw: ${e.message}`);
        continue;
      }
      if (!exercises.length) {
        fail('lesson generates no exercises', `${lesson.id} (${track})`);
        continue;
      }
      for (const ex of exercises) {
        generated++;
        const key = `${ex.kind}/${track}`;
        kinds.set(key, (kinds.get(key) || 0) + 1);
        check(ex, track);
        recordOptions(ex);
      }
    }
  }
}

// ---- nothing on the Roman path may promise the alphabet -------------------

/**
 * The units are named after the letter groups they teach, because that is the
 * spine of a script-first course. Filtering the letter lessons out of a unit
 * without renaming it leaves "The Non-Joiners — letters that break the flow"
 * sitting over two vocabulary lessons, which is the same broken promise as the
 * lessons themselves. Word boundaries matter here: "description" contains
 * "script".
 */
const SCRIPT_WORDS = /\b(letters?|script|alphabet|nastaliq|glyphs?|handwriting|trace)\b/i;

/**
 * "Letter" also means correspondence, and two lessons teach exactly that —
 * writing to someone, and the formal register you write to them in. They are
 * listed rather than pattern-matched around, because the pattern that would
 * exclude them would also let a real alphabet lesson through.
 */
const CORRESPONDENCE = new Set(['r-196', 'v-232']);

for (const u of unitsForTrack('roman')) {
  if (SCRIPT_WORDS.test(`${u.title} ${u.subtitle}`))
    fail('a Roman-track unit is still named after the alphabet', `${u.id}: ${u.title} — ${u.subtitle}`);
  for (const l of u.lessons) {
    if (!CORRESPONDENCE.has(l.id) && SCRIPT_WORDS.test(`${l.title} ${l.subtitle}`))
      fail('a Roman-track lesson is still named after the alphabet', `${l.id}: ${l.title} — ${l.subtitle}`);
  }
}

// ---- no picture may name two words ----------------------------------------

/**
 * The rule the six-💪 bug was an instance of.
 *
 * A picture-only question shows a drawing and four Urdu words, and asks which
 * one the drawing is. That question has an answer only if the drawing belongs
 * to exactly one word in the whole course — not merely one word in the four on
 * screen, because a learner who met 💪 as "arm" on Monday and is shown it as
 * "elbow" on Friday has been taught something false either way.
 *
 * `pictureIdentifies` enforces this by counting, so this cannot fail unless
 * that counting is broken. It is here because the property is the thing worth
 * asserting, and a check that reads the same way whether or not the fix stays
 * implemented is the only kind that survives a refactor.
 */
const cueOwners = new Map();
for (const w of WORDS) {
  const c = cueOf(w);
  if (!cueOwners.has(c)) cueOwners.set(c, []);
  cueOwners.get(c).push(w);
}
for (const w of WORDS) {
  if (!pictureIdentifies(w)) continue;
  const sharers = cueOwners.get(cueOf(w)).filter((o) => o.id !== w.id);
  if (sharers.length)
    fail(
      'a picture-only word shares its picture',
      `${w.id} (${w.meaning}) and ${sharers.map((o) => o.meaning).join(', ')} all show ${cueOf(w)}`
    );
}

const shared = [...cueOwners.values()].filter((v) => v.length > 1);
console.log(
  `${cueOwners.size} distinct pictures across ${WORDS.length} words; ` +
    `${shared.length} are shared by more than one word (those words are captioned, never asked by picture alone)`
);

// ---- the picture inventory, printed so it can be argued with --------------

const askedByPicture = WORDS.filter((w) => pictureIdentifies(w));
console.log(
  `picture-only prompts allowed for ${askedByPicture.length} of ${WORDS.length} words ` +
    `(${((askedByPicture.length / WORDS.length) * 100).toFixed(0)}%); the rest are captioned with their meaning`
);

const byTrack = {};
for (const [key, n] of kinds) {
  const [kind, track] = key.split('/');
  (byTrack[track] = byTrack[track] || []).push(`${kind} ${n}`);
}
for (const track of TRACKS) console.log(`  ${track.padEnd(6)} ${byTrack[track].sort().join(' · ')}`);
console.log(`\n${generated} exercises generated across ${TRACKS.length} tracks × ${PASSES} passes`);

// ---- report the two option properties -------------------------------------

if (optionQuestions) {
  const sizes = [...optionCounts.entries()].sort((a, b) => a[0] - b[0]);
  console.log(`\noptions per question: ${sizes.map(([n, c]) => `${n}\u00d7${c}`).join(' · ')}`);

  for (const [size, count] of sizes) {
    if (size < OPTION_FLOOR)
      fail(
        `a question offers fewer than ${OPTION_FLOOR} options`,
        `${count} question(s) with only ${size} — a ${Math.round(100 / size)}% guess`
      );
  }

  const positions = [...answerAt.entries()].sort((a, b) => a[0] - b[0]);
  const expected = optionQuestions / positions.length;
  console.log(
    `answer position: ${positions.map(([i, c]) => `${i}:${((c / optionQuestions) * 100).toFixed(1)}%`).join('  ')}` +
      ` (even would be ${((1 / positions.length) * 100).toFixed(1)}% each)`
  );

  /**
   * Generous on purpose. This runs over a random sample, so it must not fail on
   * ordinary variation — but the bias it replaced put the answer first 43.7% of
   * the time against a fair 33.3%, half again as often as it should be, and
   * nothing that loose gets through a 40% band.
   */
  for (const [position, count] of positions) {
    const off = Math.abs(count - expected) / expected;
    if (off > 0.4)
      fail(
        'the correct answer favours a position',
        `it lands at ${position} ${((count / optionQuestions) * 100).toFixed(1)}% of the time, ` +
          `expected about ${((1 / positions.length) * 100).toFixed(1)}% — the shuffle is not uniform`
      );
  }
}

if (problems.length) {
  console.log(`\n${seen.size} kinds of unanswerable question:`);
  for (const p of problems) console.log('  •', p);
  for (const [rule, n] of seen) if (n > 3) console.log(`  (${rule} — ${n} occurrences in total)`);
  process.exit(1);
}
console.log('\nevery generated exercise is answerable from what it puts on screen');
