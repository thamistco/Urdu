/* eslint-disable */
/**
 * Play the app as somebody who does not speak Urdu, and write down what
 * happened.
 *
 * `soak.js` already drives the app end to end, and does it well, but it is a
 * crash finder: to get deep into the course it reads the correct answer out of
 * the same content modules the app renders from. That is exactly the right
 * cheat for finding a screen that throws, and exactly the wrong one for asking
 * whether the course *teaches*. An agent that already knows every answer cannot
 * discover that a word was tested before it was introduced, because it was
 * never relying on having been taught it.
 *
 * So this one is deliberately ignorant. It starts knowing nothing, and the only
 * way it ever learns a word is the way a person does: the app shows it. A
 * teaching card, the answer revealed after a wrong guess, or a correct answer
 * confirmed on screen — each of those files an association away, and everything
 * else is a guess among whatever is on screen.
 *
 * That single constraint is what makes the journal worth reading. When this
 * learner gets something wrong, the interesting question is not "did it fail"
 * but "could it possibly have known", and the run records the answer to that
 * for every single exercise.
 *
 * ## What it produces
 *
 *   .playtest/journal.json   every screen, in order: what was asked, what was
 *                            on offer, what the learner picked, whether it was
 *                            right, and whether the app had ever taught the
 *                            thing it was being asked.
 *   .playtest/report.md      the findings that are mechanical facts rather than
 *                            opinions, counted from the journal.
 *   .playtest/*.png          screenshots at the moments worth looking at.
 *
 * The journal is the deliverable. It is written to be read by a person, or by
 * an agent briefed to react to it as the learner would, which is where the
 * subjective half of the feedback comes from — what was confusing, what read as
 * machine-written, what would have helped. This script does not attempt that
 * judgement itself; it produces the evidence for it. Keeping the two apart is
 * deliberate: a number in the report is checkable, and an opinion is not, and
 * mixing them makes the checkable half untrustworthy.
 *
 * ## The memory model
 *
 * Everything the learner has met lives in one association graph. Showing
 * "پانی / paani / water" together unions those three strings into one cluster,
 * and that cluster's strength is how many times the app has shown it. Asked
 * "which word means water", the learner looks up the cluster holding "water"
 * and clicks the option that is in it — but only with a probability that grows
 * with strength and decays with how long ago it was last seen. Below that it
 * guesses among the options, like a person half-remembering.
 *
 * The decay is what stops this being a lookup table with extra steps. A word
 * met once and not met again for forty exercises is usually gone, which is the
 * behaviour that makes a spaced-repetition claim falsifiable by playing.
 *
 *   npm run playtest                  a beginner, twenty lessons
 *   npm run playtest -- --lessons 60  a longer sitting
 *   npm run playtest -- --seed 4211   replay a run exactly
 *   npm run playtest -- --track roman the Roman path
 *   npm run playtest -- --headed      watch it play
 */

const fs = require('fs');
const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');
const { glyphStroke } = require('./lib/glyph-trace');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
let OUT = path.join(ROOT, '.playtest');
const argOf = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

/**
 * Settable so two runs can play at once.
 *
 * They serve the same `dist` read-only, so a second persona, or a quick proof
 * that a tripwire really fires, no longer has to wait forty minutes for the
 * first run to finish — which is how one verification got deferred until after
 * the thing it was verifying had already been committed.
 */
const PORT = Number(argOf('port', 8455));
/**
 * Where the journal, report and screenshots land. Settable for the same reason
 * as the port: two runs writing one `journal.json` is worse than a collision,
 * because neither of them errors and the file ends up belonging to whichever
 * flushed last.
 */
OUT = path.join(ROOT, argOf('out', '.playtest'));

const LESSONS = Number(argOf('lessons', 20));
const TRACK = argOf('track', 'both');
const SEED = Number(argOf('seed', Math.floor(Math.random() * 1e7)));
const HEADED = has('headed');
/** Photograph the first screen matching this and stop. See the main loop. */
const SHOT = argOf('shot', null) ? new RegExp(argOf('shot', ''), 'i') : null;

/**
 * Start this many lessons into the course, as a learner who already did them.
 *
 * The course is 350 lessons — about seven hours of playing. A run always starts
 * a fresh guest at the first lesson, so without this every session of testing
 * replays the same opening lessons and the back half of the app is never seen
 * by anybody. Three rounds of this project's playtesting reached lesson 34.
 *
 * `--resume-after 24` marks the first 24 lessons of the track's own order done
 * and seeds the learner with what those lessons taught, so the next stretch can
 * be played on its own. Two honest limits come with it, and they are why this
 * is a flag rather than the default:
 *
 *   - Those lessons were not played, so nothing in the report describes them.
 *   - The seeded memory is what the course *taught*, at one sighting each, not
 *     what a real learner would have retained across three hours. It is a
 *     better model than amnesia and a worse one than having been there.
 */
const RESUME_AFTER = Number(argOf('resume-after', 0));

/**
 * Who is playing.
 *
 * `beginner` (the default) starts knowing nothing and can only learn from what
 * the app shows it. That is the harder test of teaching, and it is the one this
 * driver was built for — but it is blind to half the app. Thirty-four lessons
 * in, it is still answering about a third of questions right and has hit the
 * hearts wall 88 times, so it never reaches a review that is due, never sees a
 * lesson it finds too easy, and never holds a streak or a league place long
 * enough for either to mean anything. Everything the course does about
 * *retention* is untested by it.
 *
 * `knows-urdu` starts with the language already in memory, and nothing else
 * changes. It is not a cheat mode: it does not read the answers off the
 * exercises, it plays the same screens with the same reader and the same dice.
 * It simply begins where a heritage speaker begins — knowing the words, needing
 * the script and the course's own conventions — so it gets far enough in for
 * the scheduler, the review lessons and the streak machinery to be exercised at
 * all.
 *
 * What neither of them can do is judge whether the Urdu is *right*. A wrong
 * transliteration or a register a speaker would wince at is invisible to both:
 * that needs the content checks, or a person reading it.
 */
const PERSONA = argOf('persona', 'beginner');
if (!['beginner', 'knows-urdu'].includes(PERSONA)) {
  console.error(`playtest — unknown persona "${PERSONA}". Use "beginner" or "knows-urdu".`);
  process.exit(1);
}

/**
 * How long one lesson may take before the run moves on without it.
 *
 * Lesson one of a healthy run answers twenty-five questions in about two
 * minutes, so six is generous enough that a slow machine is not cut off and
 * tight enough that a stall is caught in minutes rather than discovered hours
 * later with nothing to show.
 *
 * Settable so the guard can be proved: `--budget 0` makes every lesson time
 * out, which is the only way to see the code that handles it actually run.
 */
const LESSON_BUDGET_MS = Number(argOf('budget', 360)) * 1000;

/**
 * How many screens in a row the app may leave ungraded before the driver gives
 * up on the lesson.
 *
 * The wall-clock budget above bounds a *slow* lesson; it does not bound a
 * *misread* one, because a screen this driver cannot answer costs about two
 * seconds and changes nothing, so it repeats for as long as the step cap
 * allows. One run spent 133 of a lesson's 140 steps on a single sentence-build
 * screen and reported the lesson as taking five and a half minutes — the number
 * that was actually wrong was the count of screens, and nothing in the run said
 * so. Six in a row is past any plausible run of genuinely ungraded screens: the
 * app grades every exercise it shows, so even one is worth looking at.
 */
const UNGRADED_RUN_LIMIT = Number(argOf('ungraded-limit', 6));

/**
 * When to stop the whole run rather than finish it and read the wreckage.
 *
 * Two runs were lost to this. A stalled lesson was visible in the journal four
 * minutes after it started and was found an hour later. A typing exercise that
 * scored 0 of 149 was decidable after twenty questions in lesson three, and was
 * read as a finding about how the course teaches spelling — it was the driver's
 * memory model collapsing, and every other number in that report was measured
 * against the same wreck.
 *
 * Neither needed a cleverer reader. They needed the run to be allowed to fail.
 * A checkpoint every half hour still spends half an hour; these are decidable
 * from the journal as it is written, so they are checked as it is written.
 *
 * Both settable, because a tripwire nobody has watched fire is a hypothesis:
 * `--zero-after 1` fires on the first wrong answer of a shape, `--cluster-max 1`
 * on the first thing learned.
 */
const TRIPWIRES = {
  /**
   * Attempts at one exercise shape, all wrong, where the learner was supposed
   * to know the answer.
   *
   * Counted only over questions the model believed were answerable
   * (`couldHaveKnown`), because a real beginner genuinely does get its first
   * twenty typed words wrong and that is data, not a fault. Twenty in a row
   * that it *should* have got is either a broken exercise or a broken driver,
   * and both are worth an hour of someone's attention immediately.
   */
  zeroShapeAfter: Number(argOf('zero-after', 20)),
  /**
   * How many strings may sit in one cluster before the memory model is judged
   * to have collapsed. A word, its reading, its meaning and a stray header is
   * four; the run that typed "alif" for "book" had twenty-one after two
   * lessons and four figures by the end.
   */
  clusterMax: Number(argOf('cluster-max', 8)),
  /**
   * How far a meaning the `knows-urdu` persona walked in with may grow while
   * playing before the same suspicion applies. A word picking up the odd extra
   * form from a screen is normal; five is a merge.
   */
  clusterGrowth: Number(argOf('cluster-growth', 4)),
};

/**
 * Fill a memory with the language, for the `knows-urdu` persona.
 *
 * Read out of the course's own data files rather than scraped from the app,
 * because what this persona knows is *Urdu*, not this app's screens — the two
 * happen to coincide here, and if the course ever teaches a word this misses,
 * the persona simply meets it the way the beginner does.
 *
 * Deliberately not the exercises: nothing here says which option is correct on
 * any screen. It seeds the same word/reading/meaning triples the beginner
 * builds by playing, and then the same reader picks between the same options.
 *
 * Returns how many meanings were seeded, which the report prints — a persona
 * that silently seeded nothing would otherwise look like a beginner having a
 * very bad run.
 */
function seedFluent(memory) {
  const { load } = require('./lib/load-ts');
  const { WORDS } = load('src/data/words.ts');
  const { LETTERS } = load('src/data/letters.ts');
  const { SENTENCES } = load('src/data/sentences.ts');

  for (const w of WORDS) memory.knewAlready([w.urdu, w.roman, w.meaning]);
  // A letter is one thing in four faces, plus its name and the sound the app
  // names it by. The faces matter: every "which letter is this" shows a
  // positional form, never the isolated one.
  for (const l of LETTERS) {
    memory.knewAlready([l.name, l.forms.isolated, l.forms.initial, l.forms.medial, l.forms.final]);
    memory.knewAlready([l.name, `“${l.sound}”`, l.sound]);
  }
  for (const s of SENTENCES) memory.knewAlready([s.words.join(' '), s.roman, s.meaning]);
  return memory.clusters.length;
}

/**
 * The state a learner who had finished the first `n` lessons would have, and
 * the memory they would have built doing it.
 *
 * Both halves matter. Marking the lessons done without seeding the memory
 * produces a learner with amnesia who is then tested on everything the course
 * assumed it had taught — which would fill the report with "tested before
 * taught" for words that were, in fact, taught, in the part that was skipped.
 *
 * What is seeded is drawn from the same generator the app uses to build those
 * lessons, so it is exactly what those lessons put on screen: no more (nothing
 * from lessons not yet reached) and no less.
 */
function resumeState(n, track) {
  const { load } = require('./lib/load-ts');
  const { UNITS, lessonOrderForTrack } = load('src/data/units.ts');
  const { buildLessonExercises } = load('src/exercises/generator.ts');

  const byId = new Map(UNITS.flatMap((u) => u.lessons).map((l) => [l.id, l]));
  const done = lessonOrderForTrack(track).slice(0, n);
  // Grouped by lesson, and replayed in order, so what the skipped stretch
  // taught last is freshest — the forgetting curve is keyed on when a thing was
  // last seen, and seeding it all at one instant would make a word from lesson
  // one exactly as vivid as one from lesson thirty.
  const taught = [];
  for (const id of done) {
    const lesson = byId.get(id);
    if (!lesson) continue;
    const ofLesson = [];
    for (const ex of buildLessonExercises(lesson, [], track)) {
      if (ex.word) ofLesson.push([ex.word.urdu, ex.word.roman, ex.word.meaning]);
      if (ex.letter) ofLesson.push([ex.letter.name, ex.letter.forms.isolated]);
      if (ex.sentence) ofLesson.push([ex.sentence.words.join(' '), ex.sentence.roman, ex.sentence.meaning]);
    }
    taught.push(ofLesson);
  }
  return {
    completedLessons: Object.fromEntries(done.map((id) => [id, { best: 1, done: 1 }])),
    taught,
    lessons: done.length,
  };
}

/**
 * Which tripwires have fired, as plain data. Pure, so the rules can be held to
 * their contracts without a browser — the rest of this file's bookkeeping is
 * tested that way for the same reason.
 */
function tripwires(journal, memory, limits = TRIPWIRES) {
  const fired = [];

  const byShape = new Map();
  for (const e of journal) {
    if (e.type !== 'answer' || !e.couldHaveKnown) continue;
    const shape = e.promptShape || '(unnamed)';
    const t = byShape.get(shape) || { attempts: 0, right: 0 };
    t.attempts++;
    if (e.correct) t.right++;
    byShape.set(shape, t);
  }
  for (const [shape, t] of byShape) {
    if (t.attempts >= limits.zeroShapeAfter && t.right === 0) {
      fired.push({
        name: 'an exercise shape at zero',
        detail: `"${shape}" — 0 right out of ${t.attempts} the learner should have known`,
        note: 'Either the exercise cannot be won or the driver cannot play it. Both need looking at before the run goes on.',
      });
    }
  }

  // What is being watched for is accretion during play, not size as such: a
  // meaning seeded at eight strings was eight strings before a single screen
  // was read, and it is the growth past that which means the model is merging
  // things it should not.
  const roomFor = (c) => (c.fluent ? c.seeded + limits.clusterGrowth : limits.clusterMax);
  const swollen = memory.clusters.find((c) => c.tokens.size > roomFor(c));
  if (swollen) {
    fired.push({
      name: 'the learner’s memory has collapsed',
      detail: `${swollen.tokens.size} strings in one meaning — ${[...swollen.tokens].slice(0, 6).join(', ')}`,
      note: 'Every "recalled" after this point is fiction, and so is every count in the report built on one.',
    });
  }

  return fired;
}

/** One seeded generator, so a run that finds something can be replayed. */
let seedState = SEED;
const rand = () => {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return seedState / 0x7fffffff;
};

const norm = (s) => (s || '').replace(/[‎‏؜]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

// ------------------------------------------------------------------ memory

/**
 * Everything the learner has been shown, and how well it stuck.
 *
 * A cluster is one meaning in all the forms the app has shown it in, so
 * "water", "پانی" and "paani" are one entry rather than three. `strength` is
 * raised every time the app shows the cluster again and read back with decay,
 * because a learner who met a word once forty exercises ago does not know it.
 *
 * Two rules keep a cluster from becoming a blob, and both exist because it
 * did. The first version merged two clusters whenever they shared a single
 * string, and every screen in the app carries the same close button: one
 * correct answer learned alongside "✕" chained its cluster to every other
 * cluster that had ever seen one. Two lessons in, the largest cluster held 21
 * strings — `be`, `te`, four glyphs, "these look alike" and "✕" — all of it
 * one meaning as far as the model was concerned. That is not a small
 * inaccuracy: `typeWord` types a script form out of the prompt's cluster, so
 * over 34 lessons the learner answered "Book" with "alif", "Farewell" with
 * "happy", and got 0 of 149 typed words right. Every "recalled" in that
 * journal, and every count in the report built on one, was measuring this.
 *
 *   - Nothing that is not a word joins a cluster. One branch already kept the
 *     close glyph out of its own call, with a note about what letting it
 *     through had cost; a rule that has to be remembered at each of eight call
 *     sites is not a rule, so it lives here.
 *   - Two clusters merge only on an overlap of two strings or more. One shared
 *     string is what a coincidence looks like — a gloss that happens to repeat,
 *     a header above an unrelated question. Two is what the same word looks
 *     like. A token may therefore belong to several clusters, and the readers
 *     below pick between them rather than assuming there is only one.
 */
class Memory {
  constructor() {
    this.clusters = [];
    /** token → every cluster holding it, strongest first at read time. */
    this.index = new Map();
    this.step = 0;
  }

  /** Teach these strings as being the same thing. */
  learn(tokens) {
    const keys = [
      ...new Set(
        tokens
          .map(norm)
          // Screen chrome, not language: the close button, a bare arrow, a
          // lone bullet. A string with no letter or digit in it cannot be a
          // form of a word, and it is exactly the kind that turns up on every
          // screen and joins everything to everything.
          .filter((t) => t && !/^[^\p{L}\p{N}]+$/u.test(t))
      ),
    ];
    if (keys.length < 2) return;

    const overlap = (c) => keys.reduce((n, k) => n + (c.tokens.has(k) ? 1 : 0), 0);
    const existing = this.clusters.find((c) => overlap(c) >= 2);
    const cluster = existing || { tokens: new Set(), strength: 0, lastSeen: this.step, firstSeen: this.step };
    for (const k of keys) {
      cluster.tokens.add(k);
      const at = this.index.get(k);
      if (!at) this.index.set(k, [cluster]);
      else if (!at.includes(cluster)) at.push(cluster);
    }
    if (!existing) this.clusters.push(cluster);
    cluster.strength += 1;
    cluster.lastSeen = this.step;
  }

  /** Has the app ever taught this, in any form? */
  knows(token) {
    return this.index.has(norm(token));
  }

  /**
   * How well it is remembered right now, 0 to 1.
   *
   * Rises with sightings and falls with the gap since the last one. The
   * constants are not tuned against anything — they are a plausible forgetting
   * curve, and the journal records the raw sightings and gaps alongside every
   * decision so a reader can disagree with them without rerunning anything.
   *
   * Read from the best cluster holding the token, because a string can sit in
   * more than one: "one" is a number and part of "one another", and a learner
   * who knows either of them knows this string.
   */
  recall(token) {
    const cs = this.index.get(norm(token));
    if (!cs || !cs.length) return 0;
    return Math.max(
      ...cs.map((c) => {
        // Something known before the app ever opened does not decay across a
        // run: a speaker who knew "water" this morning knows it four hundred
        // questions later. Without this the `knows-urdu` persona forgets its
        // own language by lesson six, since the curve is keyed on when the
        // *app* last showed a thing. Not 1: even a fluent reader mis-taps.
        if (c.fluent) return 0.97;
        const gap = this.step - c.lastSeen;
        const learned = 1 - Math.exp(-0.6 * c.strength);
        const retained = Math.exp(-gap / 45);
        return learned * retained;
      })
    );
  }

  /**
   * Teach these as something the learner walked in already knowing.
   *
   * The only difference between the two personas. Everything downstream —
   * which option gets picked, what gets typed, what the journal records —
   * reads the same memory through the same functions.
   */
  knewAlready(tokens) {
    this.learn(tokens);
    const c = this.clusterFor(tokens.find((t) => norm(t)) ?? '');
    if (!c) return;
    c.fluent = true;
    // How big this meaning was before any playing happened, so the collapse
    // tripwire can tell a large seeded cluster from a cluster that grew.
    // Choṭī ye and baṛī ye share two of their four faces and merge into one
    // eight-string entry, which is correct and is also exactly the beginner's
    // limit: without this the `knows-urdu` run would trip on its own first
    // screen.
    c.seeded = c.tokens.size;
  }

  /** The best-remembered meaning this string belongs to. */
  clusterFor(token) {
    const cs = this.index.get(norm(token));
    if (!cs || !cs.length) return undefined;
    return cs.reduce((a, c) => (c.strength > a.strength ? c : a));
  }
}

// ------------------------------------------------------------- screen reading

/** Every tappable option on screen, with each of its text lines. */
async function readOptions(page) {
  const btns = page.locator('[role="button"]');
  const n = await btns.count();
  const out = [];
  for (let i = 0; i < n; i++) {
    const box = await btns
      .nth(i)
      .boundingBox()
      .catch(() => null);
    if (!box || box.width < 90 || box.height < 30) continue;
    const dead = await btns
      .nth(i)
      .getAttribute('aria-disabled')
      .catch(() => null);
    const text = await btns
      .nth(i)
      .innerText()
      .catch(() => '');
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;
    // "start" was in this list, and it is also the label of a letter-position
    // answer: POSITIONS offers Alone, Start, Middle, End. So on every "which
    // position is this letter showing" question the driver quietly deleted the
    // correct answer from the options before choosing, then lost a heart for
    // not picking it. A playtester reading the journal reported it as the
    // app's most serious defect — an unanswerable question asked 38 times —
    // and it was this line. Nothing inside a lesson is labelled exactly
    // "Start"; the one on the path is reached by its aria-label instead.
    if (/^(continue|finish|check|clear)$/i.test(lines[0])) continue;
    out.push({ i, lines, box, dead: dead === 'true' });
  }
  return { btns, options: out };
}

/** What the screen is asking, and what it is telling. */
async function readScreen(page) {
  const body = await page.evaluate(() => document.body.innerText).catch(() => '');
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    body,
    lines,
    prompt: lines.find((l) => /\?$/.test(l) || /^(which|what|type|tap|drag|trace|build|choose|put)\b/i.test(l)) || '',
    // The three footer banners, matched on their exact wording. `right` used to
    // include a loose /correct/i, which meant any screen mentioning the word
    // read as a correct answer; worse, a screen with *no* footer at all read as
    // `right: false`, which the callers recorded as a wrong answer. That is
    // where "121 wrong answers with nothing revealed" came from: not one of
    // them was an answer. Nothing may be recorded unless `graded` is true.
    wrong: /not quite/i.test(body),
    right: /beautifully done/i.test(body),
    teaching: /keep that in mind/i.test(body),
    // The app says "SESSION COMPLETE", which none of the guessed wordings
    // matched, so a run that finished eight lessons reported finishing none.
    lessonDone: /session complete|lesson complete|you finished|xp earned/i.test(body),
    outOfHearts: /out of hearts/i.test(body),
    graded: /not quite|beautifully done|keep that in mind/i.test(body),
  };
}

/**
 * Record what just happened, but only if the app actually judged it.
 *
 * A driver that acts on a screen the app ignores — an empty answer box, a tile
 * it could not find, a screen it misread as a question — has not answered
 * anything, and must not say it did. Every such screen used to be filed as a
 * wrong answer that the app had failed to explain, which manufactured a defect
 * in the app out of a defect in this file: of 121 such "answers" in the first
 * full run, none were answers at all.
 */
/**
 * How to file an attempt, given the two facts that are easy to collapse.
 *
 * `taught` is whether the app has ever shown this learner the thing; `knew` is
 * whether they could produce it just now. Both call sites used to pass only the
 * second, so every word taught long ago and since forgotten was reported as a
 * word the course had never introduced — a complaint about lesson *order*
 * raised for what is really a complaint about *spacing*. They want opposite
 * fixes, so the report has to keep them apart.
 *
 * Pure and shared precisely so the rule can be tested: the branch used to live
 * inline in the browser loop, where nothing could reach it.
 */
function classify(taught, knew) {
  return { how: knew ? 'recalled' : taught ? 'forgot' : 'guessed', couldHaveKnown: !!taught };
}

function record(journal, after, entry) {
  // The hearts wall *is* a verdict. A heart is only ever lost by answering
  // wrongly, and when the last one goes the app replaces the whole screen with
  // the wall 500ms later, banner and all. Every one of this run's remaining
  // dropped screens was one of these: real wrong answers, thrown away because
  // the thing that judged them had already been painted over.
  if (after.outOfHearts) {
    journal.push({ ...entry, type: 'answer', correct: false, endedOnHeartsWall: true });
    return true;
  }
  if (!after.graded) {
    journal.push({ type: 'ungraded', lesson: entry.lesson, step: entry.step, promptShape: entry.promptShape });
    return false;
  }
  journal.push({ ...entry, type: 'answer', correct: after.right });
  return true;
}

/**
 * The answer the app just revealed, as its parts.
 *
 * This is the app's own teaching moment, so it is also the learner's main way
 * of ever learning anything. Mirrors the reveal panel added to LessonScreen:
 * script, transliteration, translation, each on its own line under THE ANSWER.
 */
function revealFrom(lines) {
  const at = lines.findIndex((l) => /^the answer$/i.test(l));
  if (at === -1) return null;
  const after = lines.slice(at + 1).filter((l) => !/^(continue|finish)$/i.test(l));
  return after.slice(0, 3);
}

// -------------------------------------------------------------------- playing

/**
 * Wait for the app to actually judge the answer, rather than guessing how long
 * that takes.
 *
 * Every handler used to sleep 700ms and then read the screen. When the app took
 * longer than that, the footer banner was not up yet, the screen read as
 * ungraded, and the answer was dropped — evenly, about one screen in eight,
 * across every exercise shape and every lesson. Before `record` existed the
 * same lag produced something worse: the screen read as "not correct" and the
 * answer was banked as wrong.
 *
 * This is the same mistake the lesson-open code already carries a note about:
 * a fixed sleep is a guess about someone else's machine, and it is wrong in
 * both directions — too short on a slow one, wasted time on a fast one.
 *
 * Resolves as soon as any of the three banners is up, and gives up quietly
 * after a moment so a screen that genuinely never grades still ends the step.
 */
async function waitForGraded(page) {
  await page
    .waitForFunction(
      () => {
        const body = document.body.innerText || '';
        // Losing the last heart replaces the whole screen with the hearts wall,
        // so that is the end of the wait too — see `record`, which counts it.
        if (/out of hearts/i.test(body)) return true;
        if (!/not quite|beautifully done|keep that in mind/i.test(body)) return false;
        // The banner and the way forward arrive together in one footer, so
        // waiting for the text alone returns before the button is there.
        return Array.from(document.querySelectorAll('[role="button"]')).some((n) =>
          /^(continue|finish|got it)$/i.test((n.textContent || '').trim())
        );
      },
      { timeout: 4000 }
    )
    .catch(() => {});
  // The footer slides in. Returning the instant it mounts means clicking a
  // button that is still moving, and the click lands where the button is not:
  // a traced letter was graded, never continued past, and the next step broke
  // the lesson with nothing recorded. This settle is what the old fixed 700ms
  // was really buying, and it is the only part of it worth keeping.
  await page.waitForTimeout(260);
  return readScreen(page);
}

/**
 * Did the learner already know the answer the app just revealed?
 *
 * The honest test for "tested before taught", and narrower than the one it
 * replaces. That one asked whether the learner recognised anything in the
 * *prompt*, which quietly counted every question that is not about vocabulary
 * at all: "which position is this letter showing" is answered by looking at
 * whether the glyph joins on the left, so there is no word to have been taught
 * and it could never come out any other way. Six of one probe's thirty-eight
 * were that single shape, and the finding was on course to headline a report
 * with them.
 *
 * So the question is now asked of the answer rather than the prompt, and only
 * when the answer is a piece of Urdu: the app has just shown what the right
 * answer was, and either it had put that in front of this learner before or it
 * had not. Returns null when there is nothing to judge, which is not the same
 * as false and is not counted.
 */
function knewRevealedAnswer(memory, reveal, prompt = '') {
  if (!reveal || !reveal.length) return null;
  if (!reveal.some((l) => /[\u0600-\u06ff]/.test(l))) return null;
  // "Which tile is alif?" reveals the winning tile \u2014 a letter wrapped in its
  // two real neighbours, \u067e\u0627\u0646 out of \u067e\u0627\u0646\u06cc. That string is not vocabulary and
  // never will be: the word is scenery, the question is about one character
  // in it, and the app has taught that character. Counting these put 25 of
  // one run's 64 "tested before taught" on questions whose answer the learner
  // knew perfectly well. `check:order` excludes `letterSpot` from its own
  // ordering rule for exactly this reason; this is the same exclusion.
  if (/which tile is/i.test(prompt)) return null;
  return reveal.some((l) => memory.knows(l));
}

/**
 * Choose an option the way a learner would.
 *
 * Looks for something on screen it has been taught to associate with the
 * prompt. If it finds one and remembers it well enough, it picks it; otherwise
 * it guesses among everything on offer. Returns what it did and, crucially,
 * whether it *could* have known, which is the column the report is built on.
 */
function chooseOption(memory, promptLines, options) {
  const lines = Array.isArray(promptLines) ? promptLines : [promptLines];

  /**
   * What on this screen might name the thing being asked about.
   *
   * Whole lines first, then the words inside them. The words alone were the
   * whole list, and that made every question about a *sentence* unanswerable:
   * a sentence is remembered under its whole text — "میں خوش ہوں" — and
   * splitting the prompt on spaces means that string is never looked up. A
   * learner resumed at lesson 31, where the course has turned to sentences,
   * guessed 100 times out of 100 with the right answer sitting in its memory.
   */
  const promptTokens = [
    ...lines.map((l) => norm(l.replace(/[?？]/g, ''))).filter((t) => t.length > 2),
    ...lines
      .join(' ')
      .replace(/[?？]/g, '')
      .split(/\s+/)
      .map(norm)
      .filter((t) => t.length > 2),
  ];

  /**
   * Which cluster is the question about?
   *
   * The prompt's own words, plus any non-option line the screen showed (a
   * picture's caption, a word to translate) — but the *first* one recognised
   * is the wrong answer to that question. "What does it mean?" over کتاب,
   * with "Book" among the options, resolved to the cluster for **what**,
   * because کیا means "what" and this learner knows it. The real target was
   * never looked at, the question was filed as a guess, and the `knows-urdu`
   * persona scored 46% — one point above the beginner it was meant to
   * outclass, on a screen it could read perfectly.
   *
   * So a cluster that explains one of the options wins over one that does
   * not, and among those, the best remembered. Every screen here is a
   * question about something on offer; a cluster that touches nothing on
   * offer is scenery, however well it is known.
   */
  let target = null;
  for (const t of promptTokens) {
    const cluster = memory.clusterFor(t);
    if (!cluster) continue;
    const covers = options.some((o) => o.lines.some((l) => cluster.tokens.has(norm(l))));
    const strength = memory.recall(t);
    if (!target || (covers && !target.covers) || (covers === target.covers && strength > target.strength)) {
      target = { cluster, via: t, covers, strength };
    }
  }

  const inTarget = (o) => target && o.lines.some((l) => target.cluster.tokens.has(norm(l)));
  const known = options.filter(inTarget);
  const couldHaveKnown = !!target && known.length > 0;
  const strength = target ? memory.recall(target.via) : 0;

  if (couldHaveKnown && rand() < strength) {
    return { pick: known[0], couldHaveKnown, strength, how: 'recalled' };
  }
  const pick = options[Math.floor(rand() * options.length)];
  return { pick, couldHaveKnown, strength, how: couldHaveKnown ? 'forgot' : 'guessed' };
}

/**
 * Trace the letter, the way somebody with a finger and a guide would.
 *
 * The app's very first screen is a tracing exercise, so a playtester that
 * cannot draw never reaches the vocabulary where most of the teaching claims
 * live. The stroke comes from `lib/glyph-trace.js`, shared with the soak.
 *
 * A beginner is sometimes sloppy, so a seeded fraction of attempts trace only
 * part of the letter and are correctly refused. That is not padding: being
 * turned down, and seeing what the app says about it, is part of the
 * experience under test.
 */
async function traceLetter(page, sloppy) {
  const pad = page.locator('[aria-label^="Drawing area"]').first();
  if (!(await pad.count())) return false;
  const box = await pad.boundingBox().catch(() => null);
  if (!box || box.width < 120) return false;
  const area = { x: box.x + 4, y: box.y + 4, width: box.width - 8, height: box.height - 8 };

  let png;
  try {
    const { PNG } = require(path.join(ROOT, 'node_modules', 'pngjs'));
    // `scale: 'css'` keeps the image 1:1 with CSS pixels. Without it a 2x
    // device ratio yields four times the glyph pixels, and glyphStroke's 220
    // point cap then covers a quarter of the letter: the app measured exactly
    // that and said so, "20% of the letter covered".
    png = PNG.sync.read(await page.screenshot({ clip: area, scale: 'css' }));
  } catch {
    return false;
  }
  const stroke = glyphStroke(png);
  if (!stroke) return false;

  // The screenshot comes back in device pixels and the mouse moves in CSS
  // pixels. At deviceScaleFactor 2 that is a stroke drawn at half size over the
  // top-left quarter of the letter, which the app correctly refused at "18% of
  // the letter covered" — a real trace that looked like a driver bug and was
  // one. Scale is measured from the image rather than assumed, so this is right
  // at any device pixel ratio.
  const scale = png.width / area.width;
  const at = (p) => ({ x: area.x + p.x / scale, y: area.y + p.y / scale });

  const walk = sloppy ? stroke.slice(0, Math.max(4, Math.floor(stroke.length / 3))) : stroke;
  const first = at(walk[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const p of walk) {
    const q = at(p);
    await page.mouse.move(q.x, q.y);
  }
  await page.mouse.up();
  await page.waitForTimeout(250);
  return clickByText(page, /^Check$/i);
}

/**
 * Assemble a word out of letter tiles, or a sentence out of word tiles.
 *
 * The tiles are much smaller than an answer card, so the option reader skips
 * them and the screen looks like a dead end; four of five lessons in an early
 * run ended here, on "Build the word", with the driver reporting no way
 * forward when a learner would simply have been tapping letters.
 *
 * Both trays are played here because they are the same interaction: the app
 * labels a waiting tile "Tap to add it to the word" or "…to the sentence"
 * depending on which, and this read only matched the first. `sentenceBuild`
 * screens say "Build the sentence", so they reached this function, found no
 * tiles, and returned without ever pressing Check — 133 consecutive dropped
 * screens on one lesson of the 30-lesson run, and, worse, not a single
 * sentence-building exercise exercised by this driver in any run before it.
 *
 * A learner who remembers taps the right pieces in order; one who does not taps
 * something and finds out. Both are real, and which one happened is recorded.
 */
async function buildWord(page, memory, promptLine) {
  // Read the tray fresh every time, because tapping a tile takes it out of the
  // tray and moves every tile after it. The first version read all the
  // positions once and then clicked them in order: after the first tap every
  // remaining coordinate pointed somewhere else, and clicks landed on the tiles
  // already placed and took them back again. The exercise ended with nothing
  // placed, Check stayed disabled, and the app never graded it — 138 of one
  // run's 185 dropped screens, and the single largest hole in that journal.
  const readTray = () =>
    page
      .evaluate(() => {
        // The tray and the assembly line hold identical-looking tiles, so they
        // are told apart by what the app says they do, not by where they sit:
        // a tile waiting to be used says "Tap to add it to the word" (or "\u2026to
        // the sentence"), and one already placed says "Tap to take it back".
        const out = [];
        for (const n of document.querySelectorAll('[role="button"]')) {
          const of = /tap to add it to the (word|sentence)/i.exec(n.getAttribute('aria-label') || '');
          if (!of) continue;
          const r = n.getBoundingClientRect();
          if (r.width < 10 || r.height < 10) continue;
          out.push({
            t: (n.textContent || '').trim(),
            of: of[1].toLowerCase(),
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
          });
        }
        return out;
      })
      .catch(() => []);

  const tiles = await readTray();
  // Reported, never swallowed. A tray this driver cannot read is a fault in
  // this file, and the run that hid one behind a silent `return` spent a
  // quarter of its steps on it looking like an app that would not grade.
  if (!tiles.length) return { tapped: 0, taught: false, knew: false, unreadable: true };
  const mode = tiles[0].of === 'sentence' ? 'sentence' : 'word';

  // Does the learner know this? Only if the app has shown the script form
  // already \u2014 spelled out in letters for a word, in words for a sentence.
  const cluster = memory.clusterFor(promptLine) || null;
  const script = cluster ? [...cluster.tokens].filter((t) => /[\u0600-\u06ff]/.test(t)) : [];
  const target = script.find((t) => (mode === 'sentence' ? /\s/.test(t) : !/\s/.test(t))) ?? null;
  // See `typeWord`: shown-at-all and remembered-now are separate questions.
  const taught = !!target;
  const knew = taught && rand() < memory.recall(promptLine);

  // How many tiles to place, and in what order.
  //
  // The tray is the word's letters plus exactly two decoys (`buildTilesFor`),
  // so placing every tile is always wrong — including when the learner knows
  // the word perfectly well. An earlier version did exactly that and scored
  // 0 of 66 across a whole run, recalled and guessed alike, which a playtester
  // read as an exercise that could not be won.
  //
  // Knowing the word means spelling it: its letters, in order, decoys left
  // alone. Not knowing it means placing some plausible number of tiles in some
  // order, which is mostly wrong, as it should be, but can come out right.
  // A sentence is the same shape one level up — its words, in order, and
  // `sentenceTilesFor` mixes in a decoy or two exactly as `buildTilesFor` does.
  const wanted = knew ? (mode === 'sentence' ? target.split(/\s+/) : [...target.replace(/\s/g, '')]) : null;
  const holds = (tile, piece) => (mode === 'sentence' ? norm(tile) === norm(piece) : tile.includes(piece));
  const taps = wanted ? wanted.length : 2 + Math.floor(rand() * (tiles.length - 1));

  let tapped = 0;
  for (let i = 0; i < taps; i++) {
    const rest = await readTray();
    if (!rest.length) break;

    let pick = null;
    if (wanted && i < wanted.length) pick = rest.find((t) => holds(t.t, wanted[i]));
    if (!pick) pick = rest[Math.floor(rand() * rest.length)];

    await page.mouse.click(pick.x, pick.y).catch(() => {});
    tapped++;
    await page.waitForTimeout(140);
  }

  await clickByText(page, /^Check$/i);
  return { tapped, taught, knew, mode };
}

/**
 * Type the word, from memory or from nothing.
 *
 * The most honest exercise in the app for a playtester: nothing is on screen to
 * pick from, so what comes out is exactly what the learner retained. A blank or
 * a wrong spelling here is real evidence about teaching in a way a lucky tap on
 * one of four cards never is.
 */
async function typeWord(page, memory, promptLine) {
  const input = page.locator('input, textarea').first();
  if (!(await input.count().catch(() => 0))) return { typed: null, taught: false, knew: false };

  const cluster = memory.clusterFor(promptLine);
  const tokens = cluster ? [...cluster.tokens] : [];
  /**
   * What this learner would write.
   *
   * The transliteration if the app has shown one — and on the `script` track it
   * never does, by design: `Lexeme` renders Nastaliq alone because someone
   * learning to read wants nothing to lean on. So the script form is the second
   * choice, and the app accepts it: `matchesWord` checks the Urdu first, and
   * the exercise's own hint says "kitab, kitaab and کتاب all count".
   *
   * Without it a script-track run typed the first three letters of the English
   * prompt at every one of 115 typing questions — "Boo" for Book — and scored
   * zero, which reads as an exercise nobody can pass and is nothing of the
   * kind. What a human has here and this driver does not is ears: the word is
   * spoken aloud, so a learner can spell what they heard.
   */
  const roman = tokens.find((t) => /^[a-z' ]+$/i.test(t) && t !== norm(promptLine)) || null;
  const script = tokens.find((t) => /[\u0600-\u06ff]/.test(t)) || null;
  const answer = roman || script;

  // Two different facts, and collapsing them into one was a reporting bug:
  // `taught` is whether the app ever showed this, `knew` is whether the die
  // came up. A word taught fifty exercises ago and forgotten is a complaint
  // about pacing; a word never taught at all is a complaint about ordering.
  // With only `knew` to go on, every forgotten word was filed under "tested
  // before taught", which is the wrong finding and the wrong fix.
  const taught = !!answer;
  const knew = taught && rand() < memory.recall(promptLine);

  // Always type something. The empty box used to be an option here, on the
  // theory that a stuck learner gives up — but the app disables Check on an
  // empty box, so the app never judged it, and the run banked a wrong answer
  // that the learner had never given. A beginner who is stuck types a bad guess.
  const stem = (roman || promptLine).replace(/[^a-z']/gi, '');
  const guess = knew ? answer : (stem || 'kya').slice(0, 3);
  await input.fill(guess).catch(() => {});
  await clickByText(page, /^Check$/i);
  return { typed: guess, taught, knew };
}

/** Tiles the app has marked as used, which is how a matched pair shows. */
async function matchedCount(page) {
  return page
    .evaluate(
      () =>
        Array.from(document.querySelectorAll('[role="button"]')).filter(
          (n) => n.getAttribute('aria-disabled') === 'true' || n.disabled === true
        ).length
    )
    .catch(() => 0);
}

/**
 * Pair each word with its picture, which grades each pair where it stands
 * rather than through the footer banner every other exercise uses.
 *
 * The screen offers eight things, not four: the words on one side and the
 * glosses on the other, and an answer is a *pair*. The generic option reader
 * treated it as a single choice, tapped one tile, recorded an answer and found
 * the same screen still there — 429 times in one run, 43% of every answer in
 * that journal, none of it anything a learner would ever do.
 *
 * So this is the one place that has to judge its own answers, and it has been
 * wrong twice. First it counted the pairs it *believed* it had recalled, so a
 * lucky guess counted as a miss and the screen was never consulted at all.
 * Then it counted tiles leaving the tray — which the app does not do: a
 * matched tile stays exactly where it is and becomes disabled. That version
 * scored 0 of 6 on all 35 matching screens of a run, which a playtester
 * reading the journal reasonably took for a broken exercise.
 *
 * It now counts disabled tiles, which is what the app actually changes.
 */
async function matchPairs(page, memory) {
  let pairs = 0;
  let right = 0;
  let taught = 0;
  let cleared = false;
  // A board needs one successful match per pair, and every miss costs an
  // attempt too, so the cap has to leave room for misses: a cap of six
  // attempts on a six pair board could never clear one, and scored 0 of 46
  // boards for that reason alone. Generous enough for a learner who knows none
  // of the words to finish, tight enough that one who cannot still stops. A
  // board left unfinished is recorded as such rather than retried forever.
  let barren = 0;
  for (let round = 0; round < 30 && barren < 10; round++) {
    const { options } = await readOptions(page);
    if (!options.length) break;
    const before = await matchedCount(page);
    // A matched tile stays on screen, disabled. Leaving those in the pool meant
    // the driver kept tapping dead tiles: both boards of one probe stalled at
    // exactly four pairs, because with four matched the chance of picking the
    // two live tiles out of twelve is small and every miss burned an attempt.
    const live = options.filter((o) => !o.dead);
    // Which column a tile is in, not what script is written on it.
    //
    // The sides used to be told apart by "does this tile contain an Arabic
    // range character": words on the left, pictures on the right. That is true
    // of every board whose picture is drawn — and false of the numbers board,
    // whose picture *is* Urdu script, the numeral ۱ ۲ ۳ ۴. Both columns then
    // counted as words, the gloss column came back empty, and the board was
    // abandoned at "0 of 0 tries matched" on the first round. The lesson never
    // finished, the run re-entered it, and every playtest of more than
    // fourteen lessons quietly stopped making progress there — six lessons of
    // one run were the same Numbers lesson, 636 taps that matched nothing.
    // It was also wrong on the Roman track, where the left column is Latin.
    // A matched tile stays on the board, so both columns are always present in
    // `options` even when one of them has no live tile left.
    const xs = options.map((o) => o.box.x);
    const midline = (Math.min(...xs) + Math.max(...xs)) / 2;
    const words = live.filter((o) => o.box.x <= midline);
    const glosses = live.filter((o) => o.box.x > midline);
    // Nothing left to pair means the board is finished. This is where a
    // cleared board is actually noticed: the flag below only fired when the
    // app had already moved off the screen, so boards that were completed and
    // then waited for Continue were reported as failures — four pairs matched
    // in five tries, and still scored zero.
    if (!words.length || !glosses.length) {
      if (pairs) cleared = true;
      break;
    }

    const word = words[Math.floor(rand() * words.length)];
    const cluster = word.lines.map((l) => memory.clusterFor(l)).find(Boolean);
    const knownGloss = cluster && glosses.find((g) => g.lines.some((l) => cluster.tokens.has(norm(l))));
    // Whether the app had taught this word, separately from whether the die
    // came up — same distinction `typeWord` draws, and for the same reason.
    if (knownGloss) taught++;
    const recalled = knownGloss && rand() < memory.recall(word.lines[0]);
    const gloss = recalled ? knownGloss : glosses[Math.floor(rand() * glosses.length)];

    await page
      .locator('[role="button"]')
      .nth(word.i)
      .click()
      .catch(() => {});
    await page.waitForTimeout(320);
    await page
      .locator('[role="button"]')
      .nth(gloss.i)
      .click()
      .catch(() => {});
    await page.waitForTimeout(600);
    pairs++;

    // Read the result rather than assume it. A matched tile is not removed, it
    // is disabled in place, so what grows is the number of spent tiles.
    const now = await readScreen(page);
    if ((await matchedCount(page)) > before) {
      right++;
      barren = 0;
    } else {
      barren++;
    }
    // The board is finished when the app moves off it. That, not "every round
    // I attempted happened to land", is what completing this exercise means —
    // the previous test could not be satisfied inside the rounds available and
    // so reported every matching screen in a run as a failure.
    if (!/match each word/i.test(now.body)) {
      cleared = true;
      break;
    }
  }
  return { pairs, right, taught, cleared };
}

async function tapText(page, re) {
  const el = page.locator(`text=${re}`).first();
  if (!(await el.count())) return false;
  const box = await el.boundingBox().catch(() => null);
  if (!box) return false;
  await el.click().catch(() => {});
  return true;
}

/**
 * Click a control by the words on it.
 *
 * Not by `role="button"`: the tracing screen's Clear and Check render as bare
 * divs with no role and no role on any ancestor, so a driver that looks for
 * buttons finds *nothing at all* on the first screen of the first lesson and
 * reports the app as a dead end. `offsetParent` is no better here — it is null
 * for every control on that screen. The text is the only reliable handle, which
 * is what soak.js settled on too.
 */
async function clickByText(page, re) {
  const hit = await page
    .evaluate((src) => {
      const rx = new RegExp(src, 'i');
      let best = null;
      for (const n of document.querySelectorAll('div, span, p')) {
        if (n.children.length) continue; // leaf nodes only: the label itself
        const t = (n.textContent || '').trim();
        if (!rx.test(t)) continue;
        const r = n.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        // The lowest match on screen: the control is under the content, and a
        // word like "Continue" can also appear in a sentence above it.
        if (!best || r.top > best.top) best = { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top };
      }
      return best;
    }, re.source)
    .catch(() => null);
  if (!hit) return false;
  await page.mouse.click(hit.x, hit.y).catch(() => {});
  return true;
}

async function pressContinue(page) {
  return clickByText(page, /^(Continue|Finish|Start|Got it)$/i);
}

/** Hearts run on real time this run does not have; see soak.js's own note. */
async function topUpHearts(page) {
  await page
    .evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('harf-progress') || '{"state":{},"version":0}');
      raw.state = { ...raw.state, hearts: 5 };
      localStorage.setItem('harf-progress', JSON.stringify(raw));
    })
    .catch(() => {});
}

// --------------------------------------------------------------------- report

/**
 * The findings that are facts rather than opinions.
 *
 * Every one of these is counted straight off the journal, so a reader can check
 * it. Anything that needs a judgement call — whether copy reads as machine
 * written, whether an explanation helped — is deliberately not here; that is
 * what the journal gets read for.
 */
function findings(journal) {
  const out = [];
  const answered = journal.filter((e) => e.type === 'answer');

  /**
   * The first question about a word is *meant* to be unanswerable.
   *
   * The course asks before it tells on purpose — guessing and then being told
   * beats being told outright — and the card that answers the question follows
   * it immediately. So every one of those shows up as an Urdu answer the app
   * had never shown, which is true and is not a complaint: counting them took
   * this finding from 4 to 47 the moment the design changed, reporting the
   * intent as a defect.
   *
   * Spotted by shape rather than by a flag, because the driver only sees what
   * a learner sees: an answer whose very next screen is that word's card.
   */
  const pretest = new Set();
  for (let i = 0; i < journal.length - 1; i++) {
    if (journal[i].type === 'answer' && journal[i + 1].type === 'taught') pretest.add(journal[i]);
  }
  const untaught = answered.filter((e) => e.knewAnswer === false && !e.correct && !pretest.has(e));
  if (untaught.length) {
    out.push({
      kind: 'tested before taught',
      count: untaught.length,
      note: `${untaught.length} of ${answered.length} questions revealed an Urdu answer the app had never put in front of this learner, outside the opening question about a word, which is unanswerable by design. A beginner can only guess at these.`,
      examples: untaught.slice(0, 6).map((e) => ({ lesson: e.lesson, prompt: e.prompt, options: e.optionText })),
    });
  }

  const forgot = answered.filter((e) => e.how === 'forgot');
  if (forgot.length) {
    out.push({
      kind: 'met once, gone by the time it was tested',
      count: forgot.length,
      note: `${forgot.length} questions were about something taught earlier but too long ago, or too few times, to stick.`,
      examples: forgot.slice(0, 6).map((e) => ({ lesson: e.lesson, prompt: e.prompt, gapSteps: e.gapSteps })),
    });
  }

  // Same question shape several times running is the commonest complaint a
  // real tester makes about a course, and it is countable.
  //
  // Counted over every screen, not just the answered ones. A teaching card or a
  // tracing pad between two questions is a change of scene to the learner, so
  // it breaks the run — and skipping them said a Greetings lesson asked the
  // same question five times running when what it actually did was alternate
  // question, card, question, card. That reported the new word card as a
  // monotony regression it had in fact relieved.
  const screens = journal.filter((e) => e.type === 'answer' || e.type === 'taught' || e.type === 'trace');
  let run = 1;
  const runs = [];
  const shapeOf = (e) => (e.type === 'answer' ? e.promptShape : null);
  for (let i = 1; i < screens.length; i++) {
    const here = shapeOf(screens[i]);
    if (here && here === shapeOf(screens[i - 1])) run++;
    else {
      if (run >= 4) runs.push({ shape: shapeOf(screens[i - 1]), length: run, lesson: screens[i - 1].lesson });
      run = 1;
    }
  }
  // The run in progress when the screens ran out. Only the `else` above records
  // one, so a lesson that ends on its longest run — which is exactly where a
  // drain of one exercise kind puts it — never reported it at all.
  const last = screens[screens.length - 1];
  if (run >= 4 && last && shapeOf(last)) runs.push({ shape: shapeOf(last), length: run, lesson: last.lesson });
  if (runs.length) {
    out.push({
      kind: 'the same question shape several times running',
      count: runs.length,
      note: 'A learner reads this as the app stalling rather than teaching.',
      examples: runs.slice(0, 6),
    });
  }

  // Only exercises that use the footer banner can be held to the reveal panel.
  // Matching corrects each pair in the tray instead, so counting it here
  // produced 31 phantom complaints on top of 90 more that were not answers at
  // all — see `record`, which is why this can now only see graded answers.
  const noReveal = answered.filter((e) => !e.correct && !e.gradesInPlace && (!e.reveal || !e.reveal.length));
  if (noReveal.length) {
    out.push({
      kind: 'got it wrong and was shown nothing',
      count: noReveal.length,
      note: 'A wrong answer with no answer revealed teaches nothing at all.',
      examples: noReveal.slice(0, 6).map((e) => ({ lesson: e.lesson, prompt: e.prompt, shape: e.promptShape })),
    });
  }

  // Screens this driver acted on and the app never judged. Not a finding about
  // the app — a finding about this file, reported so that a quiet harness bug
  // cannot masquerade as a clean run.
  const ungraded = journal.filter((e) => e.type === 'ungraded');
  if (ungraded.length) {
    out.push({
      kind: 'harness: acted on a screen the app never graded',
      count: ungraded.length,
      note: 'Dropped rather than recorded as answers. A large number here means this driver is misreading screens.',
      examples: [...new Set(ungraded.map((e) => e.promptShape))].slice(0, 8),
    });
  }

  // Lessons abandoned because the same unreadable screen came back six times.
  // Listed separately from the count above because it says something the count
  // does not: the lesson's remaining exercises were never played at all, so a
  // run carrying one of these has a hole in its coverage, not just noise.
  const driverStuck = journal.filter((e) => e.type === 'driverStuck');
  if (driverStuck.length) {
    out.push({
      kind: 'harness: gave up on a lesson it could not read',
      count: driverStuck.length,
      note: 'The rest of each of these lessons went unplayed. Fix this file before trusting the run as coverage.',
      examples: driverStuck.map((e) => ({ lesson: e.lesson, shape: e.shape })),
    });
  }

  // The app shows the reveal panel and then, 500ms later, replaces the entire
  // screen with the hearts wall. On the one wrong answer where a learner most
  // needs to see what the right answer was, they get half a second of it.
  const wall = answered.filter((e) => e.endedOnHeartsWall);
  if (wall.length) {
    out.push({
      kind: 'the answer was taken away by the hearts wall',
      count: wall.length,
      note: 'These wrong answers showed their reveal for about half a second before the out-of-hearts screen replaced it.',
      examples: wall.slice(0, 6).map((e) => ({ lesson: e.lesson, prompt: e.prompt, shape: e.promptShape })),
    });
  }

  const timedOut = journal.filter((e) => e.type === 'lessonTimedOut');
  if (timedOut.length) {
    out.push({
      kind: 'harness: lesson abandoned on the clock',
      count: timedOut.length,
      note: 'These lessons are incomplete in the journal. Findings counted across them are understated.',
      examples: timedOut.map((e) => ({ lesson: e.lesson, step: e.step, seconds: e.seconds })),
    });
  }

  return out;
}

/**
 * The journal on disk, after every lesson rather than only at the end.
 *
 * This tool is meant to be left running, and a run that is stopped — by a
 * timeout, by a person, by anything — used to produce an empty directory and
 * nothing to read. Everything it had learned up to that point was thrown away
 * at exactly the moment it became interesting.
 */
let flush = () => {};

function writeReport(journal, memory, stats) {
  const f = findings(journal);
  const answered = journal.filter((e) => e.type === 'answer');
  const right = answered.filter((e) => e.correct).length;
  const lines = [];
  lines.push(`# Playtest: a beginner's run`, ``);
  lines.push(
    `Seed \`${SEED}\`, track \`${TRACK}\`, persona \`${PERSONA}\`. ` +
      `Replay with \`npm run playtest -- --seed ${SEED} --track ${TRACK} --persona ${PERSONA}\`.`,
    ``
  );
  if (PERSONA === 'knows-urdu')
    lines.push(
      `This learner already knew the language when the app opened, so "tested before taught" and ` +
        `"met once, gone" cannot fire — read this run for what a beginner never reaches: reviews ` +
        `falling due, lessons that are too easy, streaks and leagues held long enough to matter.`,
      ``
    );
  /**
   * When this file was last written, and how far the run had got.
   *
   * A run died mid-lesson and was noticed two hours later. Nothing said so:
   * the process was gone, the log ended without a summary, and `tail` on it
   * showed lesson 7 of 34 exactly as it had while the run was healthy, because
   * stdout to a file is buffered and the last thing written was stale. The
   * journal was current and nobody was looking at the journal.
   *
   * With this line, one look at the report answers "is it alive, and where is
   * it" — which is the whole point of writing the report every lesson.
   */
  lines.push(
    `Written ${new Date().toISOString().replace('T', ' ').slice(0, 19)}Z, ` +
      `after lesson ${stats.lessonsEntered} of ${LESSONS}` +
      (RESUME_AFTER ? `, which began at lesson ${RESUME_AFTER + 1} of the course` : '') +
      `.`,
    ``
  );
  lines.push(
    `Played ${stats.lessonsEntered} lessons, ${stats.lessonsFinished} finished. ` +
      `Answered ${answered.length} questions, ${right} right (${answered.length ? Math.round((right / answered.length) * 100) : 0}%). ` +
      `Learned ${memory.clusters.length} words well enough to have a memory of them.`,
    ``
  );

  /**
   * How big the largest thing this learner thinks is one word got.
   *
   * A cluster is one meaning in all the forms the app has shown it in, and two
   * clusters merge the moment they share a single string. That makes one wrong
   * pairing contagious: it chains its two clusters, the next wrong pairing
   * chains those, and what comes out is a single blob the model will happily
   * "recall" any member of. The `a new word` branch already carries a note
   * about one way in — the close glyph, which was on every screen — and the
   * fix there was to keep that one string out, which cannot be the fix for a
   * mechanism that has this many doors.
   *
   * So the size is printed on every run, whether or not anything looks wrong.
   * A number consulted only once someone suspects a problem is a number that
   * finds nothing: this one sat at four figures for four rounds while the
   * report described the learner's memory as "196 words".
   */
  const biggest = memory.clusters.reduce((a, c) => (!a || c.tokens.size > a.tokens.size ? c : a), null);
  if (biggest) {
    lines.push(
      `Largest single cluster: ${biggest.tokens.size} strings the learner believes are one meaning ` +
        `— ${[...biggest.tokens]
          .slice(0, 8)
          .map((t) => `\`${t}\``)
          .join(', ')}. ` +
        `Anything past a word, its reading and its meaning is this file merging things it should not.`,
      ``
    );
  }

  // First, above everything, because a run that hit one of these is not a run
  // whose findings can be read at face value.
  const tripped = journal.filter((e) => e.type === 'tripwire');
  if (tripped.length) {
    lines.push(`## This run stopped early`, ``);
    for (const t of tripped) lines.push(`- **${t.name}** — ${t.detail} (${t.lesson}, step ${t.step})`);
    lines.push(``, `Everything below covers only what was played before that.`, ``);
  }

  lines.push(`## What the run can prove`, ``);
  if (!f.length)
    lines.push(`Nothing mechanical to report: every question was answerable from what the app had taught.`, ``);
  for (const item of f) {
    lines.push(`### ${item.kind} — ${item.count}`, ``, item.note, ``);
    for (const e of item.examples) lines.push(`  - ${JSON.stringify(e)}`);
    lines.push(``);
  }
  lines.push(`## What it cannot`, ``);

  /**
   * Question shapes this run never once had anything to bring to.
   *
   * Every answer a guess, not because the learner had not been taught, but
   * because what the screen tests is not something a driver can perceive:
   * "tap to hear" needs ears, "which position is this letter showing" needs to
   * see how a glyph joins, "which tile is X" needs to see which character the
   * app has tinted. Scoring 0 of 9 on those is this file's limit, not the
   * app's, and saying so here is what stops the next reader filing them as
   * findings.
   *
   * Only asked of `knows-urdu`, because only there does "the learner had
   * nothing to bring" mean what it says. The beginner's four-lesson run listed
   * "what does it mean" among these, which is false: that question is perfectly
   * perceivable and the learner simply had not been taught those words yet —
   * which the findings above already report, as a complaint about the course
   * rather than about this file.
   */
  if (PERSONA === 'knows-urdu') {
    const blind = new Map();
    for (const e of answered) {
      const shape = e.promptShape || '(unnamed)';
      const t = blind.get(shape) || { n: 0, knew: 0, right: 0 };
      t.n++;
      if (e.couldHaveKnown) t.knew++;
      if (e.correct) t.right++;
      blind.set(shape, t);
    }
    const unseeable = [...blind].filter(([, t]) => t.n >= 5 && t.knew === 0);
    if (unseeable.length) {
      lines.push(
        `Answered blind. A learner who knows the language still had nothing to bring to these, because`,
        `what they test is something this driver cannot perceive — a sound, how a glyph joins, which`,
        `character is tinted:`,
        ``
      );
      for (const [shape, t] of unseeable) lines.push(`  - "${shape}" — ${t.right} of ${t.n}, all guessed`);
      lines.push(``, `Those scores are this file's limit, not the app's.`, ``);
    }
  }

  lines.push(
    `Whether any of this felt confusing, whether the writing reads as machine written, and what would have`,
    `helped instead. Those need the journal read by someone willing to have an opinion. \`journal.json\``,
    `holds every screen in order, with what was on offer and what this learner knew at the time.`,
    ``
  );
  fs.writeFileSync(path.join(OUT, 'report.md'), lines.join('\n'));
}

// ------------------------------------------------------------------------ run

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('playtest — no dist/. Run `npm run build:web` first.');
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright-core'));
  await serveDist(DIST, PORT);
  const browser = await chromium.launch({ executablePath: findChromium(), headless: !HEADED });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

  // Playwright waits 30 seconds by default before deciding an element is not
  // there. That is the right default for a test asserting a thing exists, and
  // the wrong one for a driver that is *looking around*: almost every locator
  // call here ends in `.catch(() => {})` and means "take this if it is on
  // screen", so a long timeout does not make the run more robust, it just makes
  // a miss cost thirty seconds instead of one. A run stalled on lesson two for
  // twenty-five minutes with the browser idle, which is what that looks like
  // from outside — no error, no progress, nothing in the log.
  page.setDefaultTimeout(1500);

  const memory = new Memory();
  const journal = [];
  const stats = { lessonsEntered: 0, lessonsFinished: 0 };
  /**
   * Both files, every lesson.
   *
   * The report used to be written once, at the end, which is why two runs were
   * read for the first time an hour after they had gone wrong. It costs
   * milliseconds against lessons that take a minute, and it means the answer to
   * "how is it going" is a file rather than a guess.
   */
  flush = () => {
    fs.writeFileSync(path.join(OUT, 'journal.json'), JSON.stringify(journal, null, 2));
    writeReport(journal, memory, stats);
  };
  let stopped = false;
  const seeded = PERSONA === 'knows-urdu' ? seedFluent(memory) : 0;
  const resume = RESUME_AFTER > 0 ? resumeState(RESUME_AFTER, TRACK) : null;
  if (resume)
    for (const lessonsWorth of resume.taught) {
      // One step per skipped lesson, so the decay curve places them the way
      // playing them would have: what the last skipped lesson taught is fresh,
      // what the first one taught is thirty steps stale. The counter is left
      // where it lands rather than wound back — it is a clock, and everything
      // learned during the run that follows is stamped with the time it happens.
      memory.step++;
      for (const t of lessonsWorth) memory.learn(t);
    }
  console.log(
    `playtest — seed ${SEED}, track ${TRACK}, ${LESSONS} lessons, persona ${PERSONA}` +
      (seeded ? ` (${seeded} meanings known before the app opened)` : '') +
      (resume ? `, resuming after lesson ${resume.lessons}` : '')
  );

  // Gems from the start, so the refill button actually works when the wall is
  // hit. Writing them mid-run does not help: the modal is already mounted and
  // reads the state it was rendered with, which cost one run looping on the
  // same screen 53 times.
  await enterAsGuest(
    page,
    `http://127.0.0.1:${PORT}/`,
    { hearts: 5, gems: 9999, ...(resume ? { completedLessons: resume.completedLessons } : {}) },
    { track: TRACK }
  );
  await page.reload();
  await page.waitForTimeout(2500);

  for (let lesson = 0; lesson < LESSONS; lesson++) {
    await topUpHearts(page);
    await page.reload();
    // Wait for the path to actually be on screen. A fixed sleep here reported
    // "no lesson could be opened" on a perfectly healthy app, because three
    // reloads in a row take longer to mount than any number guessed in advance.
    await page
      .waitForFunction(
        () =>
          Array.from(document.querySelectorAll('[role="button"]')).some((n) =>
            /start this lesson/i.test(n.getAttribute('aria-label') || '')
          ),
        { timeout: 25000 }
      )
      .catch(() => {});

    const opened = await page.evaluate(() => {
      const n = Array.from(document.querySelectorAll('[role="button"]')).find((n) =>
        /start this lesson/i.test(n.getAttribute('aria-label') || '')
      );
      if (!n) return null;
      n.scrollIntoView({ block: 'center' });
      const label = n.getAttribute('aria-label');
      n.click();
      return label;
    });
    if (!opened) {
      // With a screenshot and what was on screen, because the bare note has
      // now twice been the entire content of a failed run: a reader cannot
      // tell "the app did not boot" from "the path rendered and this file
      // could not read it", and those want opposite repairs.
      const seen = await page
        .evaluate(() => ({
          body: document.body.innerText.slice(0, 400),
          buttons: document.querySelectorAll('[role="button"]').length,
        }))
        .catch(() => ({ body: '(could not read the page)', buttons: 0 }));
      journal.push({ type: 'stuck', note: 'no lesson on the path could be opened', ...seen });
      await page.screenshot({ path: path.join(OUT, 'stuck-no-lesson.png') }).catch(() => {});
      console.log(`  ⚠ no lesson could be opened — ${seen.buttons} buttons on screen, see ${OUT}/stuck-no-lesson.png`);
      break;
    }
    const lessonName = opened.split('.')[0];
    stats.lessonsEntered++;
    const startedAt = Date.now();
    await page.waitForTimeout(2200);

    for (let step = 0; step < 140; step++) {
      // A step cap alone does not bound a lesson: the cap counts screens, and a
      // screen that the driver cannot read costs seconds rather than
      // milliseconds. One lesson ran for twenty-five minutes inside a cap of
      // 140. Wall clock is what a person waiting on the run actually cares
      // about, so it is what ends the lesson, and it is recorded rather than
      // hidden because a lesson hitting this is a bug in this file.
      const spent = Date.now() - startedAt;
      if (spent > LESSON_BUDGET_MS) {
        journal.push({ type: 'lessonTimedOut', lesson: lessonName, step, seconds: Math.round(spent / 1000) });
        console.log(`    lesson ${lessonName} gave up after ${Math.round(spent / 1000)}s at step ${step}`);
        await page.screenshot({ path: path.join(OUT, `slow-${stats.lessonsEntered}.png`) }).catch(() => {});
        break;
      }

      // See `UNGRADED_RUN_LIMIT`: a screen the driver cannot answer repeats
      // silently and cheaply, so the run has to notice the repetition itself.
      const tail = journal.slice(-UNGRADED_RUN_LIMIT);
      if (
        UNGRADED_RUN_LIMIT > 0 &&
        tail.length === UNGRADED_RUN_LIMIT &&
        tail.every((e) => e.type === 'ungraded' && e.lesson === lessonName)
      ) {
        const shape = tail[tail.length - 1].promptShape;
        journal.push({ type: 'driverStuck', lesson: lessonName, step, shape, screens: UNGRADED_RUN_LIMIT });
        console.log(
          `    ⚠ ${lessonName}: ${UNGRADED_RUN_LIMIT} unanswerable "${shape}" screens in a row — a playtest.js fault, not a finding`
        );
        await page.screenshot({ path: path.join(OUT, `driver-stuck-${stats.lessonsEntered}.png`) }).catch(() => {});
        break;
      }

      // See `TRIPWIRES`. Checked here, on every screen, rather than at the end
      // of the run or at some checkpoint: both of the things these catch were
      // decidable within minutes and were found hours later.
      const fired = tripwires(journal, memory);
      if (fired.length) {
        for (const t of fired) {
          journal.push({ type: 'tripwire', lesson: lessonName, step, name: t.name, detail: t.detail });
          console.log(`\n  ⛔ ${t.name}: ${t.detail}\n     ${t.note}`);
        }
        await page.screenshot({ path: path.join(OUT, `tripwire-${stats.lessonsEntered}.png`) }).catch(() => {});
        console.log(`  stopped after ${stats.lessonsEntered} lessons. Journal and report in ${OUT}/.`);
        stopped = true;
        break;
      }

      memory.step++;
      const screen = await readScreen(page);

      /**
       * Stop and photograph the first screen matching `--shot <pattern>`.
       *
       * For looking at a screen that is hard to reach by hand. A tile question
       * sits several exercises into a letter lesson behind a tracing pad that
       * has to actually be drawn on, and three throwaway scripts failed to get
       * there before this existed — `role="button"` finds nothing on some of
       * these screens, so a driver that can already play the course is the
       * cheapest way to reach one and look at it.
       */
      if (SHOT && SHOT.test(screen.body)) {
        const file = path.join(OUT, `shot-${lessonName.replace(/\W+/g, '-')}-${step}.png`);
        await page.screenshot({ path: file, fullPage: true }).catch(() => {});
        console.log(`  shot: ${file}`);
        await browser.close();
        process.exit(0);
      }

      if (process.env.PLAYTEST_DEBUG)
        console.log(
          `    [${step}] ${JSON.stringify(screen.lines.slice(0, 4))}${screen.wrong ? ' WRONG' : ''}${screen.right ? ' RIGHT' : ''}`
        );

      if (screen.lessonDone) {
        stats.lessonsFinished++;
        journal.push({ type: 'lessonDone', lesson: lessonName, step });
        await pressContinue(page);
        await page.waitForTimeout(800);
        break;
      }
      if (screen.outOfHearts) {
        // Recorded rather than worked around silently: how often a beginner is
        // stopped mid-lesson, and how far in, is one of the things this run
        // exists to measure. Then the hearts are topped up and the lesson
        // continues, because the alternative is a playtest that never sees past
        // the first unit and therefore has nothing to say about the course.
        journal.push({
          type: 'outOfHearts',
          lesson: lessonName,
          step,
          told: screen.lines.slice(0, 8),
          // The run carries gems a real beginner would not have earned yet, so
          // it can buy its way back in and keep going. Recorded on every one of
          // these, because without the note the journal would read as though
          // the wall were passable, and for the learner it is not.
          onlyPastItBecause: 'the harness was given gems; a real beginner has none this early',
        });
        await page.screenshot({ path: path.join(OUT, `hearts-${journal.length}.png`) }).catch(() => {});
        const resumed = await clickByText(page, /^REFILL/i);
        await page.waitForTimeout(800);
        if (!resumed) {
          await topUpHearts(page);
          break;
        }
        continue;
      }
      if (screen.teaching) {
        // A teaching card is the app explaining something. Everything on it is
        // learned together, which is the whole point of the card.
        const shown = screen.lines.filter((l) => l.length < 60 && !/^(continue|finish)$/i.test(l));
        memory.learn(shown.slice(0, 4));
        journal.push({ type: 'taught', lesson: lessonName, step, shown: shown.slice(0, 6) });
        await pressContinue(page);
        await page.waitForTimeout(600);
        continue;
      }

      /**
       * A word being introduced: picture, script, reading, meaning, and a
       * button. Nothing to answer.
       *
       * This is the screen the whole course was missing, so the learner has to
       * read it the way a person would — the three forms of the word go into
       * memory together, which is what makes every later question about it
       * answerable. Handled before the option reader gets here, because "Got
       * it" looks like a choice to it: the driver would tap it, the teaching
       * footer would come up, and a card that cannot be failed would be
       * recorded as a wrong answer.
       */
      if (/^a new word$/im.test(screen.body)) {
        // Screen chrome as well as the card's own labels. The close button is a
        // single glyph that appears on every screen in the app, and letting it
        // through put it in the cluster for every word taught — which, because
        // a cluster is a set of strings that mean the same thing, quietly
        // merged all of them into one. The learner then "recalled" words it had
        // never met: 34 recalls at 18% correct, against 73% when the model is
        // honest. Anything that is not the word, its reading or its meaning has
        // to be kept out of here.
        const shown = screen.lines.filter(
          (l) =>
            l.length < 60 &&
            !/^(a new word|got it|continue|finish|check|hear\b.*)$/i.test(l) &&
            !/^[^\p{L}\p{N}]+$/u.test(l)
        );
        memory.learn(shown.slice(0, 3));
        journal.push({ type: 'taught', lesson: lessonName, step, shown: shown.slice(0, 3) });
        await clickByText(page, /^Got it$/i);
        await page.waitForTimeout(500);
        await pressContinue(page);
        await page.waitForTimeout(500);
        continue;
      }

      /**
       * A letter being introduced: the glyph, its name and sound, its four
       * positional shapes, an example word, and a button.
       *
       * The same card as "a new word" above, and missing here for as long as
       * this file has existed. The option reader tapped "Got it", `LetterTeach`
       * advanced without grading anything — deliberately, since looking at a
       * letter is not evidence of recalling it — and every one of these was
       * filed as a screen the app never judged: 24 of the 159 in one 30-lesson
       * run, all of them this branch's absence rather than anything about the
       * app.
       */
      if (/^a new letter$/im.test(screen.body)) {
        // "alif · sounds like “a / aa”" — the trace branch's narrower
        // `/^[A-Za-z’']+\s*·/` misses the two-word names (alif madda, bari ye).
        const named = screen.lines.find((l) => /·\s*sounds like/i.test(l));
        const glyph = screen.lines.find((l) => /^[؀-ۿ‎‏]+$/.test(l));
        if (named && glyph) memory.learn([named.split('·')[0].trim(), glyph]);
        journal.push({ type: 'taught', lesson: lessonName, step, shown: [named, glyph].filter(Boolean) });
        await clickByText(page, /^Got it$/i);
        await page.waitForTimeout(500);
        await pressContinue(page);
        await page.waitForTimeout(500);
        continue;
      }

      // A tracing exercise has no options, only a pad. Roughly one attempt in
      // five is deliberately sloppy, because being refused is part of what a
      // beginner meets and the wording of that refusal is under test too.
      if (/trace the letter|draw over the grey letter/i.test(screen.body)) {
        const sloppy = rand() < 0.2;
        const traced = await traceLetter(page, sloppy);
        const after = await waitForGraded(page);

        // A tracing screen names the letter it is showing — "ALIF · ALONE"
        // over the glyph — so it teaches, and the learner has to leave it
        // knowing alif. Skipping this said the app had never introduced any
        // letter it taught by tracing, which put every later letter question
        // under "tested before taught": 201 of 536 in the run that found it,
        // the report's largest finding, and wrong.
        const named = screen.lines.find((l) => /^[A-Za-z’']+\s*·/.test(l));
        const glyph = screen.lines.find((l) => /^[\u0600-\u06ff\u200e\u200f]+$/.test(l));
        if (named && glyph) memory.learn([named.split('·')[0].trim(), glyph]);

        journal.push({
          type: 'trace',
          lesson: lessonName,
          step,
          sloppy,
          traced,
          accepted: after.right,
          told: after.lines.slice(0, 6),
        });
        if (!traced) {
          journal.push({ type: 'noWayForward', lesson: lessonName, step, lines: screen.lines.slice(0, 8) });
          await page.screenshot({ path: path.join(OUT, `stuck-${journal.length}.png`) }).catch(() => {});
          break;
        }
        await pressContinue(page);
        await page.waitForTimeout(600);
        continue;
      }

      // Back on the learn path: the lesson ended without a completion screen,
      // usually by being left. Answering the path's own lesson rows as though
      // they were options put 36 junk entries in one run's journal.
      if (/tap any lesson to jump ahead/i.test(screen.body)) {
        journal.push({ type: 'leftLesson', lesson: lessonName, step });
        break;
      }

      // Matching pairs a word with a gloss, so it needs two taps, not one.
      if (/match each word/i.test(screen.body)) {
        const m = await matchPairs(page, memory);
        // A board that rendered always offers at least one pair to try, so
        // zero attempts is this script failing to read the screen rather than
        // a learner failing to pair it. It stayed invisible for exactly that
        // reason: the journal wrote "0 of 0 tries matched" alongside genuine
        // scores, the lesson never finished, the run re-entered it, and the
        // console said only that Numbers was being played again.
        if (m.pairs === 0)
          console.log(`  ⚠ matching board unreadable in ${lessonName} — a playtest.js fault, not a finding`);
        journal.push({
          type: 'answer',
          lesson: lessonName,
          step,
          prompt: 'Match each word to its picture',
          promptShape: 'match each word to its picture',
          optionText: [],
          picked: `${m.right} of ${m.pairs} tries matched`,
          correct: m.cleared,
          ...classify(m.taught > 0, m.right > 0),
          strength: 0,
          reveal: null,
          // Matching corrects a pair where it stands instead of showing the
          // reveal panel, so a null here is the exercise working as designed,
          // not the app withholding the answer. The reveal finding skips it.
          gradesInPlace: true,
        });
        await pressContinue(page);
        await page.waitForTimeout(700);
        continue;
      }

      // Typing: nothing on screen to pick from, so this is pure recall.
      if (/type this word|type the word/i.test(screen.body)) {
        // Line 1 is not reliably the word: on a listen-and-type screen it is
        // the speaker button, and a run that took it literally typed "🔊" into
        // the box and then blamed the app for not explaining the answer.
        const prompt =
          screen.lines.slice(1).find((l) => /\p{L}/u.test(l) && !/^(type|check|continue)\b/i.test(l)) || '';
        const t = await typeWord(page, memory, prompt);
        const after = await waitForGraded(page);
        const reveal = revealFrom(after.lines);
        const knewAnswer = knewRevealedAnswer(memory, reveal);
        if (reveal && reveal.length >= 2) memory.learn(reveal);
        record(journal, after, {
          lesson: lessonName,
          step,
          prompt,
          promptShape: 'type this word',
          optionText: [],
          picked: t.typed,
          ...classify(t.taught, t.knew),
          strength: 0,
          reveal,
          knewAnswer,
        });
        await pressContinue(page);
        await page.waitForTimeout(600);
        continue;
      }

      // Tile trays: building a word or a sentence out of pieces.
      if (/build the word|build the sentence|tap the letters|tap the words/i.test(screen.body)) {
        /**
         * Which line says what is being built.
         *
         * A word carries its own: "Water · paani". A sentence does not — its
         * card shows the English on a line of its own — so the fallback was
         * `lines[1]`, which is the question itself, and every sentence build
         * was played as "Build the sentence": no cluster, nothing known,
         * nothing placed on purpose. 0 of 43 in the run that showed it up,
         * while the same learner was answering questions about those very
         * sentences correctly two screens earlier.
         */
        const chrome =
          /^(✕|check|continue|finish|the answer|tap the words below|tap the letters below|build the (word|sentence)|hear the sentence|tap a word to take it back)$/i;
        const meaningLine = screen.lines.find(
          (l) => l.trim() && !chrome.test(l.trim()) && /[a-z]/i.test(l) && !/[؀-ۿ]/.test(l)
        );
        const prompt = screen.lines.find((l) => /·/.test(l)) || meaningLine || screen.lines[1] || '';
        const promptLine = prompt.split('·')[0].trim();
        const built = await buildWord(page, memory, promptLine);
        if (built.unreadable)
          console.log(`  ⚠ tile tray unreadable in ${lessonName} — a playtest.js fault, not a finding`);
        const after = await waitForGraded(page);
        const reveal = revealFrom(after.lines);
        const knewAnswer = knewRevealedAnswer(memory, reveal);
        // A sentence reveal is script and transliteration only — its English is
        // the prompt, deliberately not repeated (see `answerReveal`). Learning
        // the reveal alone therefore never ties the sentence to the meaning the
        // next exercise asks it by, so the pairing the learner actually makes
        // is the one recorded here.
        if (reveal && reveal.length >= 2) memory.learn(built.mode === 'sentence' ? [promptLine, ...reveal] : reveal);
        record(journal, after, {
          lesson: lessonName,
          step,
          prompt,
          // From the screen rather than from `built`, so a tray this driver
          // failed to read is still filed under the exercise it belongs to.
          promptShape: /build the sentence|tap the words/i.test(screen.body) ? 'build the sentence' : 'build the word',
          optionText: [],
          picked: `${built.tapped} tiles`,
          ...classify(built.taught, built.knew),
          strength: 0,
          reveal,
          knewAnswer,
        });
        await pressContinue(page);
        await page.waitForTimeout(600);
        continue;
      }

      const { options } = await readOptions(page);
      if (!options.length) {
        // Nothing to choose: a trace, a typing box, or a screen that only has a
        // way forward. A beginner presses on.
        const moved = await pressContinue(page);
        if (!moved) {
          journal.push({ type: 'noWayForward', lesson: lessonName, step, lines: screen.lines.slice(0, 8) });
          await page.screenshot({ path: path.join(OUT, `stuck-${journal.length}.png`) }).catch(() => {});
          break;
        }
        await page.waitForTimeout(600);
        continue;
      }

      const prompt = screen.prompt || screen.lines[1] || '';
      const context = screen.lines.filter((l) => !options.some((o) => o.lines.includes(l))).slice(0, 4);
      const decision = chooseOption(memory, [prompt, ...context], options);
      const cluster = decision.strength > 0 ? null : null;

      await page
        .locator('[role="button"]')
        .nth(decision.pick.i)
        .click()
        .catch(() => {});
      const after = await waitForGraded(page);
      const reveal = revealFrom(after.lines);
      const knewAnswer = knewRevealedAnswer(memory, reveal, prompt);
      const correct = after.right;

      // The learner learns from being told, right or wrong. This is the only
      // way anything ever enters memory.
      if (reveal && reveal.length >= 2) memory.learn(reveal);
      /**
       * A right answer teaches the pairing that produced it — except when the
       * answer is not a form of anything.
       *
       * "Which position is this letter showing?" is answered by "Middle /
       * joined on both sides", and every letter in the course shares those
       * four labels. Learning them merged alif madda, jeem, baṛī he, daal and
       * ṛe into a single seven-string meaning in one 24-lesson run — the
       * largest cluster in it, and one screen away from tripping the collapse
       * wire. The question is about the shape on screen, not about a word.
       */
      if (correct && !/which position is this letter showing/i.test(prompt))
        memory.learn([...decision.pick.lines, ...context].slice(0, 4));

      record(journal, after, {
        lesson: lessonName,
        step,
        prompt,
        context,
        promptShape: prompt
          .replace(/[^a-z ]/gi, '')
          .slice(0, 40)
          .toLowerCase(),
        optionText: options.map((o) => o.lines.join(' / ')),
        picked: decision.pick.lines.join(' / '),
        how: decision.how,
        couldHaveKnown: decision.couldHaveKnown,
        strength: Number(decision.strength.toFixed(2)),
        gapSteps: decision.couldHaveKnown ? memory.step - (memory.clusterFor(prompt)?.lastSeen ?? memory.step) : null,
        reveal,
        knewAnswer,
      });

      await pressContinue(page);
      await page.waitForTimeout(600);
    }
    flush();
    const answers = journal.filter((e) => e.type === 'answer').length;
    console.log(
      `  lesson ${stats.lessonsEntered}: ${lessonName} — ${answers} answered so far, ` +
        `${stats.lessonsFinished} finished, ${Math.round((Date.now() - startedAt) / 1000)}s`
    );
    if (stopped) break;
  }

  flush();
  const answered = journal.filter((e) => e.type === 'answer');
  console.log(
    `playtest — ${stats.lessonsEntered} lessons entered, ${stats.lessonsFinished} finished, ` +
      `${answered.length} questions answered, ${answered.filter((e) => e.correct).length} right` +
      `${stopped ? ', run stopped early by a tripwire' : ''}.`
  );
  console.log(`playtest — journal and report in ${path.relative(ROOT, OUT)}/`);
  await browser.close();
  process.exit(0);
}

// Requiring this file used to launch a browser and play the course, which made
// the pure parts — the memory model, the reveal parser, the rule that only a
// graded screen may be recorded — impossible to exercise without a full run.
if (require.main === module) {
  main().catch((e) => {
    console.error('playtest —', e.message);
    process.exit(1);
  });
}

module.exports = { Memory, revealFrom, record, classify, knewRevealedAnswer, chooseOption, findings, tripwires };
