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
const { glyphStrokes } = require('./lib/glyph-trace');

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
 * How many screens in a row may pass with nothing answered before the driver
 * gives up on the lesson.
 *
 * The wall-clock budget above bounds a *slow* lesson; it does not bound a
 * *stuck* one, because a screen this driver cannot get past costs about two
 * seconds and changes nothing, so it repeats for as long as the step cap
 * allows. One run spent 133 of a lesson's 140 steps on a single sentence-build
 * screen; another read the same conversation 560 times because the button
 * under it was below the fold. The first of those was journalled as dropped
 * screens and the second as teaching cards, which is why the count is of
 * screens that produced no answer rather than of any one kind.
 *
 * Eight is past any legitimate run: a letter lesson opens with two or three
 * cards before its first question.
 */
const STUCK_RUN_LIMIT = Number(argOf('stuck-limit', 8));

/**
 * How often the run leaves the path.
 *
 * A learner does not spend an hour on lessons and then discover Practice; they
 * dip into it, change a setting, come back. Interleaving matters for more than
 * realism — a setting changed mid-course is the one that can break the next
 * lesson, and a practice session is only interesting once there is something
 * in the review pool for it to draw on.
 *
 * `0` turns either off, which is how a run that only wants the path asks for
 * one.
 */
const PRACTICE_EVERY = Number(argOf('practice-every', 6));
const SETTINGS_EVERY = Number(argOf('settings-every', 12));
/** Skip the path entirely: one practice pass and one settings pass, for
 *  checking those two surfaces without paying for a course walk. */
const SURFACES_ONLY = has('surfaces-only');
/**
 * Walk the eight screens before the first lesson instead of skipping them.
 *
 * Off by default, so a resumed slice still starts where it is told to. On, the
 * run enters with `onboarded: false` and plays the real flow — which is the
 * only way the speaker's basic-vocabulary skip and the alphabet-skip offer are
 * ever reached, both being decided there and nowhere else.
 */
const ONBOARD = has('onboard');

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
   * A learner who already speaks Urdu, scoring like one who does not.
   *
   * This persona exists to reach what a beginner cannot, and the way it fails
   * is silent: it plays a full slice, the report reads plausibly, and only a
   * side-by-side with a beginner's numbers shows that the fluency never
   * arrived. That has happened — a knows-urdu run once scored 46%, one point
   * above the beginner it was meant to outclass, on screens it could read
   * perfectly, and it took reading two reports an hour apart to notice.
   *
   * Measured over three healthy slices rather than guessed: of the questions
   * this learner had the answer for, it got 96%, 97% and 96% right. A beginner
   * over the same measure gets 63%. The floor sits between them with room on
   * both sides, and the window is large enough that the small-sample dip a
   * letters-only stretch produces — 77% over 13 questions — cannot reach it.
   *
   * Scoped to what it *knew*, not to the raw score, on purpose. A speaker
   * skips the vocabulary and lands on the letter lessons, where this driver
   * genuinely cannot see glyph joining and scores 40%; those show up as
   * guesses, not as things known and missed, so they leave this untouched.
   */
  fluentFloor: Number(argOf('fluent-floor', 0.8)),
  fluentWindow: Number(argOf('fluent-window', 60)),

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
   * How many *names* one meaning may have before the model is judged to have
   * collapsed.
   *
   * Not how many strings: a meaning is allowed to wear many shapes. A letter
   * has four faces plus its isolated form, and two letters can honestly share
   * some of them — baṛī ye is written with choṭī ye's shapes at the start of a
   * word and in the middle of one, so a learner meeting یـ cannot tell which
   * letter it is, and neither should this model. Counting strings tripped on
   * exactly that, at nine, and ended a run five lessons early over correct
   * Urdu.
   *
   * What a collapse looks like instead is a meaning with several names: `be`
   * and `te` and "these look alike" and "✕" in one entry, or `happy`, `family`
   * and `name` joined by the instruction printed above all three. A word has
   * its reading and its meaning, a letter its name and perhaps its sound; more
   * than three names is the model merging things it should not.
   */
  clusterNames: Number(argOf('cluster-names', 3)),
  /**
   * A backstop on sheer size, set well above anything legitimate, for a
   * runaway that somehow keeps its names down.
   */
  clusterMax: Number(argOf('cluster-max', 16)),
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
      // All four faces, as the card itself shows them — seeding the isolated
      // form alone left a resumed learner meeting صـ at lesson 200 as
      // something the course had never shown it.
      if (ex.letter)
        ofLesson.push([
          ex.letter.name,
          ex.letter.forms.isolated,
          ex.letter.forms.initial,
          ex.letter.forms.medial,
          ex.letter.forms.final,
        ]);
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

  // See `clusterNames`: a meaning may wear many shapes, but it should not
  // answer to many names.
  const namesIn = (c) => {
    const plain = [...c.tokens].filter(
      (t) =>
        // A shape is not a name.
        !/[\u0600-\u06ff]/.test(t) &&
        // Neither is a sound. The app writes one in curly quotes — “a / aa” —
        // and two letters that share their faces bring two names and two
        // sounds with them, which is four strings and one honest meaning:
        // choṭī ye and baṛī ye, the pair this wire has now stopped twice.
        !/^[“"'].*[”"']$/.test(t) &&
        // Nor is the picture on the word's own card. Most are pure
        // pictographs and never reach a cluster, but a keycap digit carries a
        // real digit inside it — `6️⃣` for Saturday, the sixth day — so it
        // passes the "letters or numbers" filter the card branch uses and
        // arrives here looking like a third name for the word.
        !/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/u.test(t)
    );
    /**
     * A gloss that qualifies another gloss is one name, not two.
     *
     * `units.ts` says so in as many words: a meaning may qualify itself, and
     * the course's own example is the one that stopped this run — ہفتہ is
     * taught in Time & day as "Week" and again in Days & months as "Saturday
     * (also: week)". Both are true, both are the same word, and the learner
     * meeting the second after the first is the app working. Counting them
     * separately made a correct memory look like a corrupted one and ended a
     * 24-lesson slice at lesson 23.
     *
     * Containment rather than equality, because the qualifier is what differs:
     * the shorter name sits inside the longer one. A real collapse does not
     * look like this — the blob this wire exists for was "happy", "family",
     * "which one did you hear?" and "tap to hear", four names with nothing of
     * each other in them.
     */
    return plain.filter((t) => {
      const me = t.toLowerCase();
      return !plain.some((o) => o !== t && o.length < t.length && me.includes(o.toLowerCase()));
    });
  };
  /**
   * The fluent learner missing what it knows. See `fluentFloor` above for the
   * measurements behind the numbers.
   */
  if (limits.fluent) {
    const known = journal.filter((e) => e.type === 'answer' && e.couldHaveKnown).slice(-limits.fluentWindow);
    if (known.length >= limits.fluentWindow) {
      const right = known.filter((e) => e.correct).length;
      const share = right / known.length;
      if (share < limits.fluentFloor) {
        fired.push({
          name: 'the fluent learner is scoring like a beginner',
          detail:
            `${right} of the last ${known.length} questions it had the answer for ` +
            `(${Math.round(share * 100)}%, and a healthy run of this persona sits at 96%)`,
          note: 'Either the fluency never reached the screen or the app is refusing answers that are right.',
        });
      }
    }
  }

  const swollen = memory.clusters.find(
    (c) => namesIn(c).length > limits.clusterNames || c.tokens.size > limits.clusterMax
  );
  if (swollen) {
    const names = namesIn(swollen);
    fired.push({
      name: 'the learner’s memory has collapsed',
      detail:
        `${swollen.tokens.size} strings in one meaning, under ${names.length} names — ` +
        `${names.slice(0, 6).join(', ') || [...swollen.tokens].slice(0, 6).join(', ')}`,
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
  /**
   * The buttons belonging to screens behind this one — see `readScreen`. The
   * index is kept, not compacted, because the caller clicks `nth(i)` on this
   * same locator.
   *
   * A *disabled* control is kept, and the exception is load-bearing rather
   * than defensive. React Native Web gives a disabled Pressable
   * `pointer-events: none`, the same as a screen that is not in front, so the
   * first version of this filter threw away every spent tile on a matching
   * board. The board empties as it is solved, an emptied board returned no
   * options at all, `matchPairs` broke out before it could notice it had won,
   * and twenty boards that were solved four pairs out of four were recorded as
   * failures — which then tripped the run's own "this exercise is at zero"
   * wire, exactly as that wire is meant to do.
   *
   * `aria-disabled` is what separates the two: a spent tile carries it, the
   * buttons on a screen behind do not.
   */
  const live = new Set(
    await page
      .evaluate(() =>
        Array.from(document.querySelectorAll('[role="button"]'))
          .map((b, i) =>
            getComputedStyle(b).pointerEvents === 'none' && b.getAttribute('aria-disabled') !== 'true' ? -1 : i
          )
          .filter((i) => i >= 0)
      )
      .catch(() => null)
  );
  const out = [];
  for (let i = 0; i < n; i++) {
    if (live.size && !live.has(i)) continue;
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

/**
 * Does this screen say the lesson is over?
 *
 * Kept as a named function rather than an inline regex so `playtest-selftest`
 * can hold it against the literal strings in `src/screens/LessonComplete.tsx`
 * — the only place that decides what this screen says.
 */
function lessonDoneText(body) {
  return /session complete|flawless session|lesson complete|you finished|xp earned/i.test(body || '');
}

/** What the screen is asking, and what it is telling. */
/**
 * The text of the screen the learner is actually on.
 *
 * React Navigation leaves the screens behind the one in front mounted, at full
 * size, with their own buttons and their own words: Practice is still there
 * while a practice session plays on top of it, and so is Learn. The one thing
 * that separates them is `pointer-events`, which it sets to `none` on the ones
 * behind — measured against the real build, because `offsetParent`,
 * `checkVisibility()` and a non-empty bounding box all report them as visible,
 * so a reader built on any of those three reads the wrong screen and looks
 * like it works.
 *
 * Their text is subtracted from `body.innerText` rather than rebuilt from
 * scratch: `innerText` runs the same algorithm on a subtree as on the whole
 * document, so a mounted screen's text appears in the page's verbatim, and if
 * it ever does not, the subtraction does nothing and this falls back to what it
 * read before. Rebuilding the text by walking nodes would change the line
 * breaks every branch in the step loop matches on.
 */
async function readScreen(page) {
  const body = await page
    .evaluate(() => {
      const dead = Array.from(document.querySelectorAll('div')).filter(
        (n) =>
          getComputedStyle(n).pointerEvents === 'none' &&
          !(n.parentElement && getComputedStyle(n.parentElement).pointerEvents === 'none')
      );
      let text = document.body.innerText;
      for (const n of dead) {
        const t = n.innerText;
        if (t && t.length > 10) text = text.split(t).join('\n');
      }
      return text;
    })
    .catch(() => '');
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
    /**
     * The end-of-lesson screen, in both of the things it can say.
     *
     * `LessonComplete` prints "Session complete" — or "Flawless session" when
     * nothing was missed. This knew the first and not the second, so a lesson
     * the learner got entirely right was never recognised as finished: the
     * driver pressed on past the completion screen, landed back on the tabs,
     * tapped the Letter Lab, and spent eight screens in a browse view with
     * nothing to answer before the stuck-run breaker ended the lesson. Its own
     * earlier comment records the first half of this same mistake — guessed
     * wordings, one of which was right — and guessing again is what cost the
     * second half.
     *
     * `lessonDoneText` is what the self-test holds against the app's own
     * source, so a third wording cannot quietly repeat this.
     */
    lessonDone: lessonDoneText(body),
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
 * The lines of a screen that could be a form of a word, out of everything that
 * is not an option.
 *
 * What a screen asks is not what it is about. "Tap to hear" and "Which one did
 * you hear?" sit above every listening question in the course, so learning them
 * beside the answer merged `happy`, `family` and `name` into one meaning inside
 * sixteen lessons. An instruction and a question are the same on every screen
 * that carries them, which is exactly what makes them able to join everything
 * to everything — the close glyph's trick, in words.
 */
function asContent(lines) {
  return lines.filter(
    (l) => !/\?\s*$/.test(l.trim()) && !/^(tap|type|build|match|choose|check|continue|finish|hear)\b/i.test(l.trim())
  );
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
  /**
   * How long since the learner last met this, read here rather than later.
   *
   * The journal used to work it out after the answer was recorded, by which
   * time the screen's own `learn` calls had already refreshed the cluster: it
   * read 0 on 2,069 of the 2,071 answers that carried it. A field that is
   * always zero is worse than an absent one — it prints in the report's own
   * examples beside real numbers and reads as evidence that nothing the course
   * asks about is ever stale, which is the opposite of what every run finds.
   */
  const gapSteps = target ? memory.step - target.cluster.lastSeen : null;

  if (couldHaveKnown && rand() < strength) {
    return { pick: known[0], couldHaveKnown, strength, gapSteps, how: 'recalled' };
  }
  const pick = options[Math.floor(rand() * options.length)];
  return { pick, couldHaveKnown, strength, gapSteps, how: couldHaveKnown ? 'forgot' : 'guessed' };
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
  const strokes = glyphStrokes(png);
  if (!strokes || !strokes.length) return false;

  // The screenshot comes back in device pixels and the mouse moves in CSS
  // pixels. At deviceScaleFactor 2 that is a stroke drawn at half size over the
  // top-left quarter of the letter, which the app correctly refused at "18% of
  // the letter covered" — a real trace that looked like a driver bug and was
  // one. Scale is measured from the image rather than assumed, so this is right
  // at any device pixel ratio.
  const scale = png.width / area.width;
  const at = (p) => ({ x: area.x + p.x / scale, y: area.y + p.y / scale });

  // A sloppy learner draws a third of the letter's body and none of its dots,
  // which is what the app is supposed to refuse; a careful one draws every
  // piece, lifting the pen between them the way the letter is actually written.
  const walks = sloppy
    ? [strokes[0].slice(0, Math.max(4, Math.floor(strokes[0].length / 3)))]
    : strokes.filter((s) => s.length);

  for (const walk of walks) {
    const first = at(walk[0]);
    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
    for (const p of walk) {
      const q = at(p);
      await page.mouse.move(q.x, q.y);
    }
    await page.mouse.up();
    await page.waitForTimeout(40);
  }
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
  /**
   * The answer box on this screen, not the first `<input>` in the document.
   *
   * A practice session is entered by tapping a card on the Practice tab, which
   * stays mounted behind it — and it has an `<input>` of its own, its search
   * box, sitting earlier in the DOM. The first practice run typed every answer
   * into that instead: `fill` timed out on it, Check stayed disabled, nothing
   * was graded, and the session ended after eight silent screens with the
   * answer box on screen and empty.
   *
   * Both halves of the test are load-bearing, and each was measured on the
   * real build rather than reasoned about:
   *
   *   pointer-events   a tab that is not in front keeps a full-size, visible,
   *                    hit-testable box; `none` is the only thing that marks it.
   *   a non-zero box   a screen underneath a pushed one keeps `pointer-events:
   *                    auto` and `display: block`, and collapses to 0×0.
   *
   * Either test alone lets one of the two cases through, which is how this cost
   * a session: the first fix here checked only the first.
   */
  const at = await page
    .evaluate(() =>
      Array.from(document.querySelectorAll('input, textarea')).findIndex((n) => {
        const r = n.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(n).pointerEvents !== 'none';
      })
    )
    .catch(() => -1);
  if (at < 0) return { typed: null, taught: false, knew: false };
  const input = page.locator('input, textarea').nth(at);

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
  let why = 'ran out of rounds';
  for (let round = 0; round < 30 && barren < 10; round++) {
    const { options } = await readOptions(page);
    // Nothing on the board at all. Not the same as a finished board — that one
    // still has its spent tiles on screen — so it is recorded as its own
    // outcome rather than scored, because the only ways to get here are a
    // screen this file cannot read and an app that drew nothing.
    if (!options.length) {
      why = 'no tiles could be read';
      break;
    }
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
      why = pairs ? 'every pair matched' : 'a column was empty before anything was tried';
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
      why = 'the app moved off the board';
      break;
    }
  }
  return { pairs, right, taught, cleared, why };
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
        if (getComputedStyle(n).pointerEvents === 'none') continue; // see readScreen
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
  /**
   * Scroll it into view, then read its position again.
   *
   * A conversation's transcript is longer than the phone, so "I've read it"
   * sits below the fold and the mouse click landed on whatever was at those
   * coordinates instead. The screen never advanced, the driver read the same
   * transcript again, and one dialogue lesson repeated itself 560 times before
   * the step cap ended it — the single largest stall in any run of this file.
   *
   * The coordinates have to be re-read after scrolling, because scrolling is
   * what makes the first ones wrong.
   */
  const at = await page
    .evaluate((src) => {
      const rx = new RegExp(src, 'i');
      let best = null;
      for (const n of document.querySelectorAll('div, span, p')) {
        if (n.children.length) continue;
        if (getComputedStyle(n).pointerEvents === 'none') continue; // see readScreen
        const t = (n.textContent || '').trim();
        if (!rx.test(t)) continue;
        const r = n.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        if (!best || r.top > best.top) best = n;
      }
      if (!best) return null;
      best.scrollIntoView({ block: 'center' });
      const r = best.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, re.source)
    .catch(() => null);
  const target = at || hit;
  await page.mouse.click(target.x, target.y).catch(() => {});
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

  /**
   * The kinds that ask a learner to *recognise* something.
   *
   * Every one of them reveals its answer, so meeting an item here is the app
   * telling the learner about it — the ask-then-tell design above, in the case
   * where what does the telling is the reveal panel rather than a card. A
   * sentence has no card at all, and a word's card can be an exercise or two
   * later once review has woven something in between, so the "next entry is a
   * card" rule missed both: 27 of one slice's questions were counted as the
   * course testing what it had never taught, and every one was the first half
   * of ask-then-tell.
   *
   * What the finding is for is the other case: being asked to *produce* or
   * *recall* something never met — to type it, build it from tiles, or pick it
   * from an English prompt. `check:order` proves the same property against the
   * generator, and found 382 of them before the sentence climb was fixed.
   */
  const MEETS = /^(what does it mean|which word means this|which word is this|tap to hear)$/i;
  const untaught = answered.filter(
    (e) => e.knewAnswer === false && !e.correct && !pretest.has(e) && !MEETS.test(e.promptShape || '')
  );
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
      /**
       * How stale these were, as a distribution rather than as six examples.
       *
       * The count alone says a number of questions went unanswered by a learner
       * who had met the thing; it does not say whether the course asked again
       * after eight screens or after a thousand, and those want opposite fixes.
       * The examples carried a per-question gap that read 0 on every one of
       * them until it was measured at the right moment — worth printing now
       * that it is true, and worth printing as a spread, because the median and
       * the tail of this one are two different stories.
       */
      note:
        `${forgot.length} questions were about something taught earlier but too long ago, or too few times, to stick.` +
        (() => {
          const gaps = forgot.map((e) => e.gapSteps).filter((g) => typeof g === 'number');
          if (gaps.length < 8) return '';
          gaps.sort((a, b) => a - b);
          const at = (q) => gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * q))];
          return ` Last seen ${at(0.5)} screens earlier at the median, ${at(0.9)} at the ninetieth, ${gaps[gaps.length - 1]} at the worst.`;
        })(),
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
  // The hearts wall counts as a change of scene for the same reason a card
  // does: it replaces the whole screen, and a learner who has just been
  // stopped, shown a price and let back in is not looking at the same question
  // shape four times over. Without it here, two questions either side of a
  // wall read as a run of four.
  const screens = journal.filter(
    (e) => e.type === 'answer' || e.type === 'taught' || e.type === 'trace' || e.type === 'outOfHearts'
  );
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

/**
 * What went wrong away from the path.
 *
 * Kept apart from `findings` because the two answer different questions. That
 * one asks whether the course teaches what it tests, which is a judgement made
 * over hundreds of answers. This one asks whether four specific promises the
 * interface makes to a learner are kept, and each is a single fact: the shelf
 * that says 78 lists 78, a search finds what is on screen in front of it, a
 * switch stays where it was put, and nothing erases a profile without asking.
 *
 * Every one of them returns a sentence naming the numbers, because "practice
 * counts wrong" sends a reader back to the journal and "topics says 78, lists
 * 54" does not.
 */
function surfaceFindings(journal) {
  const out = [];

  for (const e of journal.filter((x) => x.type === 'practiceShelf')) {
    if (e.claims !== null && e.claims !== e.lists)
      out.push(`Practice · ${e.shelf}: the tab says ${e.claims} items, the shelf under it lists ${e.lists}.`);
    if (e.lists === 0) out.push(`Practice · ${e.shelf}: the shelf is empty — nothing to open.`);
  }

  for (const e of journal.filter((x) => x.type === 'practiceSearch')) {
    // A term lifted off a card that is already on screen: finding nothing is
    // the search failing, not the learner mistyping.
    if (e.of && e.hits === 0)
      out.push(`Practice · search for "${e.term}" found nothing, though it was taken from "${e.of}" on that shelf.`);
    if (!e.of && e.hits > 0) out.push(`Practice · search for nonsense ("${e.term}") still listed ${e.hits} items.`);
    if (!e.of && e.hits === 0 && !e.sawEmptyState)
      out.push(`Practice · search for "${e.term}" emptied the shelf with nothing on screen to say why.`);
  }

  for (const e of journal.filter((x) => x.type === 'reviewPlayed')) {
    if (e.asked === 0)
      out.push(`Practice · the daily review said ${e.dueClaimed} item(s) were due and then asked nothing.`);
  }

  for (const e of journal.filter((x) => x.type === 'practiceStuck'))
    out.push(`Practice · ${e.note}${e.shelf ? ` (${e.shelf})` : ''}.`);

  for (const e of journal.filter((x) => x.type === 'settingToggled')) {
    if (!e.stuck) out.push(`Settings · "${e.label}" did not change when it was tapped (still ${e.from}).`);
    if (e.rowsAfter === 0) out.push(`Settings · the screen stopped drawing its rows after "${e.label}" was tapped.`);
  }
  for (const e of journal.filter((x) => x.type === 'trackChanged')) {
    if (!e.moved) out.push(`Settings · the "${e.to}" track could not be chosen.`);
    else if (!e.stillOnSettings) out.push(`Settings · choosing "${e.to}" left the Settings screen.`);
  }
  for (const e of journal.filter((x) => x.type === 'onboardingStuck'))
    out.push(`Onboarding · it did not get past "${e.at}".`);
  for (const e of journal.filter((x) => x.type === 'onboarded')) {
    if (!e.reachedHome) out.push(`Onboarding · finishing it did not land on the learn path.`);
    if (!e.onboarded) out.push(`Onboarding · it finished without recording that it had.`);
    if (e.asked < 4) out.push(`Onboarding · the placement quiz asked ${e.asked} question(s), not 4.`);
    // The two things the flow exists to decide for a learner who already
    // speaks Urdu. Both are false for a beginner, correctly, so neither is
    // checked against one.
    if (e.speaker) {
      if (e.background !== 'speaker')
        out.push(`Onboarding · said "I already speak it" and the profile recorded "${e.background}".`);
      if (!e.skipped)
        out.push(`Onboarding · a speaker finished with no lesson skipped, so the basics skip did nothing.`);
    } else if (e.skipped) {
      out.push(`Onboarding · a learner starting from scratch had ${e.skipped} lesson(s) skipped for them.`);
    }
  }

  for (const e of journal.filter((x) => x.type === 'settingsStuck')) out.push(`Settings · ${e.note}.`);
  for (const e of journal.filter((x) => x.type === 'resetOffered')) {
    if (e.tapped && !e.confirmed)
      out.push(`Settings · "Reset progress and start over" ran without asking for confirmation.`);
    if (!e.tapped) out.push(`Settings · the reset control could not be found.`);
  }

  return out;
}

function writeReport(journal, memory, stats) {
  const f = findings(journal);
  const sf = surfaceFindings(journal);
  const answered = journal.filter((e) => e.type === 'answer');
  const right = answered.filter((e) => e.correct).length;
  const lines = [];
  lines.push(`# Playtest: a beginner's run`, ``);
  lines.push(
    `Seed \`${SEED}\`, track \`${TRACK}\`, persona \`${PERSONA}\`. ` +
      `Replay with \`npm run playtest -- --seed ${SEED} --track ${TRACK} --persona ${PERSONA}\`.`,
    ``
  );
  if (PERSONA === 'knows-urdu') {
    /**
     * The one number that says whether the fluency arrived.
     *
     * A run where the seeding never reached the screen reads perfectly
     * otherwise — it plays every lesson, finishes every slice, and files a
     * plausible report. What gives it away is this: of the questions it had
     * the answer for, a healthy run of this persona gets 96%. One that scored
     * 46% overall, a point above the beginner it was meant to outclass, went
     * unnoticed for an hour because nothing printed it. The tripwire stops a
     * run that falls this far; the line is here so a run that drifts halfway
     * is visible without a second report to compare against.
     */
    const known = answered.filter((e) => e.couldHaveKnown);
    const kRight = known.filter((e) => e.correct).length;
    lines.push(
      `This learner already knew the language when the app opened, so "tested before taught" and ` +
        `"met once, gone" cannot fire — read this run for what a beginner never reaches: reviews ` +
        `falling due, lessons that are too easy, streaks and leagues held long enough to matter.`,
      ``
    );
    lines.push(
      known.length
        ? `Of the ${known.length} questions it had the answer for, it got ${kRight} right ` +
            `(${Math.round((kRight / known.length) * 100)}%). A healthy run of this persona sits at 96%; ` +
            `a beginner over the same measure gets 63%.`
        : `It was never asked anything it had the answer for, which is itself the finding.`,
      ``
    );
  }
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
  lines.push(
    `Away from the path: ${stats.practiceSessions} visit(s) to Practice, ${stats.practiceFinished} practice set(s) ` +
      `played to the end, ${stats.settingsPasses} pass(es) over Settings.`,
    ``
  );

  /**
   * The interface half, first and unconditionally.
   *
   * These are facts rather than judgements — a count that disagrees with
   * itself, a switch that would not move — so they are worth more per line
   * than anything below, and a reader who stops after the first screen of this
   * file should have already seen them. The "nothing" line is not padding: it
   * is the difference between a run that checked and found nothing and a run
   * where this section never executed, which have looked identical twice.
   */
  lines.push(`## Practice and Settings`, ``);
  if (!stats.practiceSessions && !stats.settingsPasses) lines.push(`Neither surface was visited on this run.`, ``);
  else if (!sf.length) lines.push(`Nothing wrong found on either.`, ``);
  else {
    for (const s of sf) lines.push(`- ${s}`);
    lines.push(``);
  }

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
  /**
   * How densely the course actually revisits what it teaches.
   *
   * "Met once, gone by the time it was tested" is the report's largest number
   * and the most model-dependent thing in it: whether a learner still knows a
   * word is decided by a forgetting curve whose constants, as the model itself
   * says, are not tuned against anything. So the same question is answered here
   * without the model — count, for every word the app taught, how many entries
   * passed before it came back.
   *
   * On the first 24 lessons the answer was a median of 2 entries, with 3 of 205
   * words never revisited. That is dense revisiting, which means the finding
   * above is about how much repetition it takes to hold a word, not about a
   * course that teaches and walks away. Those two want different fixes, and the
   * number that tells them apart belongs in the report rather than in a note
   * somebody has to remember to run.
   */
  const scriptOf = (l) => /[\u0600-\u06ff]/.test(l);
  const taughtWords = [];
  journal.forEach((e, i) => {
    // Words and letters only. A reading passage is read once by design and a
    // grammar card explains a rule in prose, so counting either as something
    // that ought to come back put eight "never revisited" in one slice's
    // report, not one of which was a word.
    if (e.type !== 'taught' || !e.shown || e.shown.length < 2) return;
    if (e.what && e.what !== 'word' && e.what !== 'letter') return;
    const u = e.shown.find(scriptOf);
    if (u) taughtWords.push({ u: norm(u), at: i });
  });
  if (taughtWords.length) {
    const gaps = [];
    let never = 0;
    for (const t of taughtWords) {
      let last = t.at;
      let seen = 0;
      journal.forEach((e, i) => {
        if (i <= t.at || e.type !== 'answer') return;
        const hay = [e.prompt, ...(e.context || []), ...(e.optionText || []), ...(e.reveal || [])]
          .map(norm)
          .join(' | ');
        if (!hay.includes(t.u)) return;
        gaps.push(i - last);
        last = i;
        seen++;
      });
      if (!seen) never++;
    }
    gaps.sort((a, b) => a - b);
    const at = (p) => gaps[Math.floor(gaps.length * p)] ?? 0;
    lines.push(
      `Measured without the forgetting curve: of ${taughtWords.length} words the app taught, ${never} were ` +
        `never put in front of the learner again, and the gap between one sighting and the next ran ` +
        `${at(0.5)} entries at the median, ${at(0.9)} at the ninetieth. Sparse revisiting and too few ` +
        `repetitions to hold a word want different fixes; this is the number that tells them apart.`,
      ``
    );
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

/**
 * Play one session, screen by screen, until it ends.
 *
 * Extracted from `main`'s lesson loop unchanged, because a practice session and
 * a path lesson are the same screen sequence behind different entry points —
 * `LessonScreen` renders both. A driver that could only reach the path could
 * only report on the path, and "practice" is a third of what the app offers.
 *
 * `sessionName` is what every journal entry is filed under, so a finding can be
 * traced back to the lesson or the practice set it came from. Returns whether a
 * tripwire stopped the run, which is the only condition that ends the whole
 * playtest rather than this one session.
 */
async function playSession(page, ctx, sessionName, kind = 'lesson') {
  const { journal, memory, stats, browser } = ctx;
  // Counted apart from the path's own tally: a practice set that finishes is
  // not a lesson finished, and adding it to that number made a run that walked
  // no path at all report "0 lessons played, 1 finished".
  const finishedKey = kind === 'lesson' ? 'lessonsFinished' : 'practiceFinished';
  const startedAt = Date.now();
  let stopped = false;

  for (let step = 0; step < 140; step++) {
    // A step cap alone does not bound a lesson: the cap counts screens, and a
    // screen that the driver cannot read costs seconds rather than
    // milliseconds. One lesson ran for twenty-five minutes inside a cap of
    // 140. Wall clock is what a person waiting on the run actually cares
    // about, so it is what ends the lesson, and it is recorded rather than
    // hidden because a lesson hitting this is a bug in this file.
    const spent = Date.now() - startedAt;
    if (spent > LESSON_BUDGET_MS) {
      journal.push({ type: 'lessonTimedOut', lesson: sessionName, step, seconds: Math.round(spent / 1000) });
      console.log(`    lesson ${sessionName} gave up after ${Math.round(spent / 1000)}s at step ${step}`);
      await page.screenshot({ path: path.join(OUT, `slow-${stats.lessonsEntered}.png`) }).catch(() => {});
      break;
    }

    // See `STUCK_RUN_LIMIT`: a screen the driver cannot answer repeats
    // silently and cheaply, so the run has to notice the repetition itself.
    /**
     * Nothing answered for a while, in this lesson.
     *
     * The first version of this counted `ungraded` screens, which is one way
     * a lesson stalls and not the only one: a dialogue whose "I've read it"
     * button sat below the fold was pressed, missed, and re-read 560 times,
     * and every one of those was journalled as a teaching card rather than a
     * dropped screen. The honest signal is that the lesson has stopped
     * producing answers at all. Eight is past any legitimate run of teaching
     * cards — a letter lesson opens with two or three before its first
     * question.
     */
    const tail = journal.slice(-STUCK_RUN_LIMIT);
    if (
      STUCK_RUN_LIMIT > 0 &&
      tail.length === STUCK_RUN_LIMIT &&
      tail.every((e) => e.lesson === sessionName && e.type !== 'answer')
    ) {
      const shape = tail[tail.length - 1].promptShape || tail[tail.length - 1].type;
      journal.push({ type: 'driverStuck', lesson: sessionName, step, shape, screens: STUCK_RUN_LIMIT });
      console.log(
        `    ⚠ ${sessionName}: ${STUCK_RUN_LIMIT} screens in a row with nothing answered ("${shape}") — a playtest.js fault, not a finding`
      );
      await page.screenshot({ path: path.join(OUT, `driver-stuck-${stats.lessonsEntered}.png`) }).catch(() => {});
      break;
    }

    // See `TRIPWIRES`. Checked here, on every screen, rather than at the end
    // of the run or at some checkpoint: both of the things these catch were
    // decidable within minutes and were found hours later.
    const fired = tripwires(journal, memory, { ...TRIPWIRES, fluent: PERSONA === 'knows-urdu' });
    if (fired.length) {
      for (const t of fired) {
        journal.push({ type: 'tripwire', lesson: sessionName, step, name: t.name, detail: t.detail });
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
      const file = path.join(OUT, `shot-${sessionName.replace(/\W+/g, '-')}-${step}.png`);
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
      stats[finishedKey]++;
      journal.push({ type: 'lessonDone', kind, lesson: sessionName, step });
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
        lesson: sessionName,
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
    /**
     * A screen still showing the verdict for the answer just given.
     *
     * The way forward was pressed and did not take — the footer was still
     * sliding, or the click landed a moment early — so the next read is the
     * same graded screen. Every branch below assumes it is looking at a
     * question, and the trace branch proved what that costs: it drew over a
     * letter the app had already accepted, found no Check button, and ended
     * the lesson with "no way forward" on a screen whose CONTINUE was right
     * there in its own journal entry.
     */
    if ((screen.right || screen.wrong) && !screen.lessonDone) {
      /**
       * The footer's own control, and nothing else.
       *
       * `pressContinue` also accepts "Start", which is a way forward on some
       * screens and, on "Which position is this letter showing?", the label
       * of one of the four answers. When the verdict banner was up but the
       * footer had not finished sliding in, this guard pressed that option
       * instead — already answered, already disabled — read the same screen
       * again, and pressed it again. Seven lessons of one slice were spent
       * that way, one question answered in each.
       *
       * Falling through is the right thing when the footer is not there yet:
       * the branches below wait for it properly.
       */
      const moved = await page.evaluate(() => {
        const n = Array.from(document.querySelectorAll('[role="button"]')).find((b) =>
          /^(continue|finish)$/i.test((b.textContent || '').trim())
        );
        if (!n) return false;
        n.scrollIntoView({ block: 'center' });
        n.click();
        return true;
      });
      if (moved) {
        await page.waitForTimeout(500);
        continue;
      }
    }

    /**
     * A passage or a conversation, before its question.
     *
     * The learner reads it and says so; nothing is graded, because nothing
     * has been asked yet. Routed through the option reader it looked like a
     * question with strange options, and every one of these was recorded as
     * a screen the app never judged — nine in one slice, all of them the app
     * working exactly as designed.
     *
     * The lines are learned, because reading them is how a learner meets
     * these sentences, which is the whole point of the exercise.
     */
    if (/i’ve read it|i've read it/i.test(screen.body)) {
      // Line by line, each in the script with the transliteration printed
      // under it — which is how the passage is laid out and how it is read.
      // Learning four lines together instead would say a passage is one
      // meaning, and a passage is four sentences.
      const lines = asContent(screen.lines).filter((l) => l.length < 80 && !/^(✕|i.ve read it)$/i.test(l.trim()));
      const isScript = (l) => /[\u0600-\u06ff]/.test(l);
      const learned = [];
      for (let k = 0; k < lines.length - 1; k++) {
        if (isScript(lines[k]) && !isScript(lines[k + 1])) {
          memory.learn([lines[k], lines[k + 1]]);
          learned.push(`${lines[k]} · ${lines[k + 1]}`);
        }
      }
      journal.push({ type: 'taught', what: 'passage', lesson: sessionName, step, shown: learned.slice(0, 6) });
      await clickByText(page, /^I.ve read it$/i);
      await page.waitForTimeout(600);
      continue;
    }

    /**
     * A grammar card, which is read in stages.
     *
     * "Show the pattern", then "Show examples", then "Got it" — three taps
     * for one card, and only the last one grades. The option reader clicked
     * the stage button and recorded a screen the app never judged, once per
     * stage, on every grammar lesson in the course.
     */
    if (/^grammar$/im.test(screen.body) && /show the pattern|show examples/i.test(screen.body)) {
      await clickByText(page, /^(show the pattern|show examples)$/i);
      await page.waitForTimeout(500);
      continue;
    }
    // The last tap of that card. It grades itself correct — a teaching card
    // cannot be failed — and the lesson moves on without a verdict banner,
    // so waiting for one recorded a dropped screen on every grammar lesson.
    if (/^grammar$/im.test(screen.body) && /^got it$/im.test(screen.body)) {
      // Nothing is learned from it. A grammar card explains a pattern; its
      // lines are headings and prose — "GRAMMAR", "WHO", "FORM", "MEANING" —
      // and feeding those to a model of what a learner knows made one
      // meaning with four names on the first card it met, which the collapse
      // wire stopped the run over, correctly. The sentences the card shows
      // are learned when they come back as exercises.
      journal.push({ type: 'taught', what: 'grammar', lesson: sessionName, step, shown: screen.lines.slice(1, 6) });
      await clickByText(page, /^Got it$/i);
      await page.waitForTimeout(500);
      await pressContinue(page);
      await page.waitForTimeout(400);
      continue;
    }

    if (screen.teaching) {
      // A teaching card is the app explaining something. Everything on it is
      // learned together, which is the whole point of the card.
      const shown = screen.lines.filter((l) => l.length < 60 && !/^(continue|finish)$/i.test(l));
      memory.learn(shown.slice(0, 4));
      journal.push({ type: 'taught', what: 'card', lesson: sessionName, step, shown: shown.slice(0, 6) });
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
      journal.push({ type: 'taught', what: 'word', lesson: sessionName, step, shown: shown.slice(0, 3) });
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
      const isScript = (l) => /^[\u0600-\u06FF\u200E\u200F]+$/.test(l);

      /**
       * All four faces, not just the isolated one.
       *
       * The card's whole point is that a letter changes shape by position,
       * and it shows every shape under a heading that says so. Learning only
       * the glyph at the top left the learner meeting the medial pe in the
       * next question as something it had never seen: ten of one 24-lesson
       * run's nineteen "tested before taught" were a face of a letter the app
       * had just displayed four faces of.
       *
       * The card's own labels bound them — the faces sit between "It changes
       * shape…" and "As in", and what follows "As in" is a whole word, which
       * must not join the letter's cluster.
       */
      const from = screen.lines.findIndex((l) => /it changes shape/i.test(l));
      const to = screen.lines.findIndex((l) => /^as in$/i.test(l));
      const faces =
        from > -1 && to > from ? screen.lines.slice(from + 1, to).filter(isScript) : screen.lines.filter(isScript);
      const glyph = screen.lines.find(isScript);
      if (named) memory.learn([named.split('·')[0].trim(), ...new Set([glyph, ...faces].filter(Boolean))]);

      // And the word the letter is met inside, which this card teaches as
      // plainly as any "a new word" screen: the script over "anaar · pomegranate".
      if (to > -1) {
        const exampleScript = screen.lines.slice(to + 1).find(isScript);
        const gloss = screen.lines.slice(to + 1).find((l) => /·/.test(l) && !isScript(l));
        if (exampleScript && gloss) memory.learn([exampleScript, ...gloss.split('·').map((x) => x.trim())]);
      }

      journal.push({
        type: 'taught',
        what: 'letter',
        lesson: sessionName,
        step,
        shown: [named, ...faces].filter(Boolean),
      });
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
        lesson: sessionName,
        step,
        sloppy,
        traced,
        accepted: after.right,
        told: after.lines.slice(0, 6),
      });
      if (!traced) {
        journal.push({ type: 'noWayForward', lesson: sessionName, step, lines: screen.lines.slice(0, 8) });
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
      journal.push({ type: 'leftLesson', lesson: sessionName, step });
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
        console.log(`  ⚠ matching board unreadable in ${sessionName} — a playtest.js fault, not a finding`);
      journal.push({
        type: 'answer',
        lesson: sessionName,
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
        // How the board ended, so a zero can never again be indistinguishable
        // between "the learner could not solve it" and "this file stopped
        // looking at it".
        why: m.why,
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
      const prompt = screen.lines.slice(1).find((l) => /\p{L}/u.test(l) && !/^(type|check|continue)\b/i.test(l)) || '';
      const t = await typeWord(page, memory, prompt);
      const after = await waitForGraded(page);
      const reveal = revealFrom(after.lines);
      const knewAnswer = knewRevealedAnswer(memory, reveal);
      if (reveal && reveal.length >= 2) memory.learn(reveal);
      record(journal, after, {
        lesson: sessionName,
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
        console.log(`  ⚠ tile tray unreadable in ${sessionName} — a playtest.js fault, not a finding`);
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
        lesson: sessionName,
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
        journal.push({ type: 'noWayForward', lesson: sessionName, step, lines: screen.lines.slice(0, 8) });
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
      memory.learn([...decision.pick.lines, ...asContent(context)].slice(0, 4));

    record(journal, after, {
      lesson: sessionName,
      step,
      prompt,
      context,
      promptShape: prompt
        .replace(/[^a-z ]/gi, '')
        .slice(0, 40)
        .toLowerCase(),
      /**
       * Exercises that mark the right option where it stands.
       *
       * `screens/answerReveal.ts` names the kinds that use the reveal panel;
       * everything in its `default` branch corrects in place instead, and the
       * grammar drill does it twice over — the right option turns green and a
       * "Why" note explains the rule underneath. Counting those as answers
       * shown nothing put seven complaints in one slice's report about the
       * most thoroughly explained screen in the app.
       *
       * This list restates that branch, matched on what the screen says rather
       * than on a kind this file cannot see, so it has to be extended whenever
       * a kind joins it. "What number is this?" is the proof: the numeral
       * exercise shipped, landed in `default` correctly — its right answer
       * turns green and a reversed reading gets named underneath — and the
       * very next slice reported it twice as a wrong answer the app had
       * explained nothing about.
       */
      gradesInPlace: /complete the sentence|reading ·|conversation ·|what number is this/i.test(screen.body),
      optionText: options.map((o) => o.lines.join(' / ')),
      picked: decision.pick.lines.join(' / '),
      how: decision.how,
      couldHaveKnown: decision.couldHaveKnown,
      strength: Number(decision.strength.toFixed(2)),
      // From the decision, which read it before this screen taught anything.
      // See `chooseOption`.
      gapSteps: decision.couldHaveKnown ? decision.gapSteps : null,
      reveal,
      knewAnswer,
    });

    await pressContinue(page);
    await page.waitForTimeout(600);
  }
  return { stopped, seconds: Math.round((Date.now() - startedAt) / 1000) };
}

/* ---------------------------------------------------------------------- *
 * The two surfaces that are not the path.
 *
 * A learner meets three things: lessons on the path, the Practice tab, and
 * Settings. Only the first had ever been played here, so two thirds of what
 * the app offers had never been driven by anything except a crash finder —
 * and the questions those surfaces raise are not crash questions. Does the
 * shelf that says it holds 78 topics list 78? Does searching for something
 * the screen is already showing find it? Does a toggle stay toggled? Does
 * the button that erases everything ask first?
 *
 * Practice sessions are played through `playSession`, the same function the
 * path uses, because `LessonScreen` renders both — a practice set is a lesson
 * reached by another door, and a driver that treated it as something else
 * would be measuring the door.
 * ---------------------------------------------------------------------- */

/** The shelves the Practice tab browses by, in the order its own tabs sit. */
const PRACTICE_SHELVES = ['topics', 'grammar', 'reading'];

/**
 * The deploy's subpath, read from the page rather than assumed.
 *
 * The build writes it into a meta tag (`scripts/inject-web-meta.js`) and every
 * route carries it, so a local build and the deploy-shaped build CI produces
 * do not agree on where `/practice` lives. Hard-coding either one gives a
 * driver that silently plays the wrong app half the time.
 */
async function siteRoot(page) {
  const base = await page
    .evaluate(() =>
      (document.querySelector('meta[name="harf:base"]')?.getAttribute('content') || '').replace(/^\/+|\/+$/g, '')
    )
    .catch(() => '');
  return `http://127.0.0.1:${PORT}/${base ? `${base}/` : ''}`;
}

/** Open a screen by its own URL, the way a bookmark would. */
async function openScreen(page, where) {
  await page.goto((await siteRoot(page)) + where);
  await page.waitForTimeout(2600);
}

/**
 * What is on the screen in front of the learner, and nothing else.
 *
 * A tab that has been visited stays mounted: Learn is still in the DOM at full
 * size, with all 214 of its buttons, while Practice is the tab in front. The
 * one thing that separates them is `pointer-events`, which React Navigation
 * sets to `none` on the screens behind. Measured rather than assumed — Learn's
 * buttons come back from `offsetParent`, from `checkVisibility()` and from a
 * non-empty bounding box alike, so a reader built on any of those three reads
 * the wrong screen while looking like it works.
 */
async function readSurface(page) {
  return page.evaluate(() => {
    const live = (n) => getComputedStyle(n).pointerEvents !== 'none';
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const controls = Array.from(document.querySelectorAll('[role="button"],[role="tab"],[role="radio"]'))
      .filter(live)
      .map((n) => clean(n.getAttribute('aria-label') || n.textContent))
      .filter(Boolean);
    const switches = Array.from(document.querySelectorAll('input[type="checkbox"]'))
      .filter(live)
      .map((n, i) => ({
        i,
        // The label is the row's, not the input's: `Row` in SettingsScreen
        // draws the name and the hint beside the switch rather than on it.
        label: clean((n.closest('div')?.parentElement?.innerText || '').split('\n')[0]),
        on: n.checked,
      }));
    const lines = Array.from(document.querySelectorAll('div,span,p'))
      .filter((n) => live(n) && !n.firstElementChild && clean(n.textContent))
      .map((n) => clean(n.textContent));
    return { controls, switches, lines, text: lines.join('\n') };
  });
}

/** Tap the first live control whose label matches. */
async function tapControl(page, re) {
  return page.evaluate((src) => {
    const rx = new RegExp(src, 'i');
    const live = (n) => getComputedStyle(n).pointerEvents !== 'none';
    const n = Array.from(document.querySelectorAll('[role="button"],[role="tab"],[role="radio"]'))
      .filter(live)
      .find((b) => rx.test((b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim()));
    if (!n) return false;
    n.scrollIntoView({ block: 'center' });
    n.click();
    return true;
  }, re.source);
}

/**
 * A pass over the Practice tab: what it claims, what it lists, and one of its
 * sets actually played.
 *
 * The shelf browsed rotates with `pass`, so a run of several passes covers
 * topics, grammar and readings rather than the first one three times.
 */
async function practiceSession(page, ctx, pass) {
  const { journal, stats } = ctx;
  stats.practiceSessions++;
  await openScreen(page, 'practice');
  const shelf = PRACTICE_SHELVES[pass % PRACTICE_SHELVES.length];

  const opened = await readSurface(page);
  if (!/daily review/i.test(opened.text)) {
    journal.push({ type: 'practiceStuck', pass, note: 'the Practice tab did not open', saw: opened.lines.slice(0, 8) });
    await page.screenshot({ path: path.join(OUT, `practice-stuck-${pass}.png`) }).catch(() => {});
    return { stopped: false };
  }

  /**
   * The daily review first, because it is the top of the screen and because it
   * is the one thing here that navigates away.
   *
   * It used to run after the shelf was browsed, and coming back from it cost
   * two of slice two's four practice visits: a review returns to `/practice`,
   * which mounts on its default `topics` tab, so the grammar point and the
   * passage this file had just picked off the grammar and reading shelves were
   * no longer rendered and could not be tapped. Both were recorded as the app
   * failing to open them. Doing the review before anything is chosen removes
   * the state to restore rather than restoring it.
   *
   * The card states a number — "84 items due" — and a session either brings
   * something back or it does not, which is the one claim on this screen the
   * next screen can be held to. Left alone when nothing is due, because the
   * card is deliberately disabled then; tapping it and reporting that nothing
   * happened would be reporting the design.
   */
  const dueLine = /(\d+)\s+items?\s+due/i.exec(opened.text);
  const dueClaimed = dueLine ? Number(dueLine[1]) : 0;
  if (dueClaimed > 0) {
    const before = journal.filter((e) => e.type === 'answer').length;
    const entered = await tapControl(page, /^Daily review/i);
    await page.waitForTimeout(2400);
    if (!entered)
      journal.push({ type: 'practiceStuck', pass, note: `the daily review card would not open (${dueClaimed} due)` });
    else {
      const r = await playSession(page, ctx, 'practice · daily review', 'practice');
      journal.push({
        type: 'reviewPlayed',
        pass,
        dueClaimed,
        asked: journal.filter((e) => e.type === 'answer').length - before,
        seconds: r.seconds,
      });
      if (r.stopped) return r;
      await openScreen(page, 'practice');
    }
  }

  /**
   * The shelf tabs carry their own counts — "topics: 122 items" — so the screen
   * states a number that the list under it either meets or does not. That is
   * the one thing on this screen checkable without a second source.
   */
  const claimed = {};
  for (const c of (await readSurface(page)).controls) {
    const m = /^(topics|grammar|reading):\s*(\d+)\s*items?$/i.exec(c);
    if (m) claimed[m[1].toLowerCase()] = Number(m[2]);
  }
  await tapControl(page, new RegExp(`^${shelf}: `));
  await page.waitForTimeout(900);
  const shelved = await readSurface(page);
  const listed = shelved.controls.filter((c) => /^(practise |passage:|conversation:)/i.test(c));
  journal.push({
    type: 'practiceShelf',
    pass,
    shelf,
    claims: claimed[shelf] ?? null,
    lists: listed.length,
    first: listed.slice(0, 3),
  });

  /**
   * Search for something the screen is already showing.
   *
   * The item's own title, taken off the card in front of us, so a shelf that
   * cannot find what it is displaying is the finding — not a guess about what
   * a learner might type. A word of three letters or fewer is skipped: the
   * search matches substrings, and "day" finding forty things is not evidence
   * of anything.
   */
  const target = (listed[0] || '')
    .replace(/^(practise |passage:|conversation:)\s*/i, '')
    .split(/[.,]/)[0]
    .trim();
  const term = target.split(' ').find((w) => w.length > 3) || '';
  const searchFor = async (text, of) => {
    await page
      .locator('[aria-label="Search practice content"]')
      .fill(text)
      .catch(() => {});
    await page.waitForTimeout(800);
    const found = await readSurface(page);
    journal.push({
      type: 'practiceSearch',
      pass,
      shelf,
      term: text,
      of,
      hits: found.controls.filter((c) => /^(practise |passage:|conversation:)/i.test(c)).length,
      sawEmptyState: /nothing matches/i.test(found.text),
    });
    await page
      .locator('[aria-label="Search practice content"]')
      .fill('')
      .catch(() => {});
    await page.waitForTimeout(600);
  };
  if (term) await searchFor(term, target);
  // And a query that matches nothing, to see the empty state say so rather
  // than leave a blank shelf with no explanation.
  await searchFor('zzqxwv', null);

  // And then play one of the sets, which is the other half of this screen.
  const pick = listed[pass % Math.max(listed.length, 1)] || listed[0];
  if (!pick) {
    journal.push({ type: 'practiceStuck', pass, shelf, note: 'the shelf listed nothing to open' });
    return { stopped: false };
  }
  const started = await tapControl(page, new RegExp(`^${pick.slice(0, 28).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  await page.waitForTimeout(2400);
  if (!started) {
    journal.push({ type: 'practiceStuck', pass, shelf, note: `could not open "${pick}"` });
    return { stopped: false };
  }
  const name = `practice · ${pick
    .replace(/^(practise |passage:|conversation:)\s*/i, '')
    .split(/[.,]/)[0]
    .trim()}`;
  const outcome = await playSession(page, ctx, name, 'practice');
  journal.push({ type: 'practicePlayed', pass, shelf, session: name, seconds: outcome.seconds });
  return outcome;
}

/**
 * A pass over Settings: every switch flipped and read back, the track changed
 * and changed back, and the button that erases everything asked to prove it
 * asks first.
 *
 * Each switch is restored afterwards, because the next lesson is played with
 * whatever this leaves behind — a run that turned Roman off and walked away
 * would be reporting on a different app from the one it started in.
 */
async function settingsSession(page, ctx) {
  const { journal, stats } = ctx;
  stats.settingsPasses++;
  await openScreen(page, 'settings');
  const opened = await readSurface(page);
  if (!/sound effects/i.test(opened.text)) {
    journal.push({ type: 'settingsStuck', note: 'Settings did not open', saw: opened.lines.slice(0, 8) });
    await page.screenshot({ path: path.join(OUT, `settings-stuck-${stats.settingsPasses}.png`) }).catch(() => {});
    return;
  }

  for (let i = 0; i < opened.switches.length; i++) {
    const was = opened.switches[i];
    await page
      .locator('input[type="checkbox"]')
      .nth(i)
      .click({ force: true })
      .catch(() => {});
    await page.waitForTimeout(700);
    const mid = await readSurface(page);
    const now = mid.switches[i];
    journal.push({
      type: 'settingToggled',
      label: was.label,
      from: was.on,
      to: now ? now.on : null,
      stuck: now ? now.on !== was.on : false,
      // A screen that stops rendering its own rows after a toggle is the
      // failure worth catching here; the count says whether it still does.
      rowsAfter: mid.switches.length,
    });
    await page
      .locator('input[type="checkbox"]')
      .nth(i)
      .click({ force: true })
      .catch(() => {});
    await page.waitForTimeout(600);
  }

  const restore = TRACK === 'roman' ? /^Roman|Roman first/i : TRACK === 'script' ? /Script first/i : /Both together/i;
  for (const [label, re] of [
    ['Script first', /Script first/i],
    ['Both together', /Both together/i],
  ]) {
    const moved = await tapControl(page, re);
    await page.waitForTimeout(900);
    const after = await readSurface(page);
    journal.push({ type: 'trackChanged', to: label, moved, stillOnSettings: /learning track/i.test(after.text) });
  }
  await tapControl(page, restore);
  await page.waitForTimeout(800);

  const voiced = await tapControl(page, /’s voice/i);
  await page.waitForTimeout(800);
  journal.push({ type: 'voicePicked', moved: voiced });

  /**
   * The destructive control, and the only question worth asking of it: does
   * anything stand between a mis-tap and an erased profile? The dialog is
   * dismissed, never accepted — a run that wiped its own progress would report
   * the rest of the course as never taught.
   */
  let asked = false;
  const watch = (d) => {
    asked = true;
    d.dismiss().catch(() => {});
  };
  page.on('dialog', watch);
  const tapped = await tapControl(page, /^Reset all progress/i);
  await page.waitForTimeout(1200);
  page.off('dialog', watch);
  const afterReset = await readSurface(page);
  journal.push({
    type: 'resetOffered',
    tapped,
    confirmed: asked,
    // If the tap went through and nothing asked, the profile is gone — which
    // this can see, because Settings still knows how many lessons are done.
    stillOnSettings: /learning track/i.test(afterReset.text),
  });
}

/**
 * Walk the eight screens a learner meets before the first lesson.
 *
 * This had never been driven by anything. Every run here — fifteen slices and
 * both personas — entered through `enterAsGuest`, which writes `onboarded:
 * true` straight into the store, and no check script visits `/setup` either.
 * So the first thing every real learner sees was the one flow nothing had
 * played.
 *
 * It matters most for the persona that already speaks Urdu, because this is
 * where the app treats the two apart: `background === 'speaker'` is what skips
 * the basic vocabulary, and a speaker who also scores full marks on the
 * placement quiz is the only learner ever offered the alphabet skip. That code
 * exists for this persona alone. Without walking it, a knows-urdu run is a
 * beginner with a better memory starting at lesson one.
 *
 * The persona answers as itself: it says whether it speaks Urdu, and it
 * answers the placement questions out of the same memory it plays lessons
 * with. Nothing here is told the right answer.
 */
async function onboardingSession(page, ctx) {
  const { journal, memory, stats } = ctx;
  stats.onboardings++;
  const speaker = PERSONA === 'knows-urdu';
  const steps = [];
  const note = (step, did) => steps.push(`${step}: ${did}`);

  await page.goto(`http://127.0.0.1:${PORT}/`);
  await page.waitForTimeout(3000);
  const opening = await readSurface(page);
  if (!/let.s start/i.test(opening.text)) {
    journal.push({ type: 'onboardingStuck', at: 'welcome', saw: opening.lines.slice(0, 8) });
    await page.screenshot({ path: path.join(OUT, 'onboarding-stuck.png') }).catch(() => {});
    return { finished: false, steps };
  }

  await tapControl(page, /^Let.s start$/i);
  await page.waitForTimeout(900);
  note('welcome', 'started');

  // Goal, track, voice: whatever is on offer. None of the three changes what
  // the learner is taught, and picking the first keeps the run replayable.
  // A goal card carries its label and its description in one run of text, so
  // the journal line read "Speak with familyParents, grandparents, relatives
  // back home". Only the label is the choice; the rest is the card talking.
  const GOALS = /^(Speak with family|Read & write it|Reconnect with heritage|I.m just curious)/i;
  const onOffer = (await readSurface(page)).controls.find((c) => GOALS.test(c));
  const goalName = onOffer ? GOALS.exec(onOffer)[0] : null;
  if (goalName) await tapControl(page, GOALS);
  await page.waitForTimeout(500);
  note('goal', goalName || 'nothing on offer');
  await tapControl(page, /^Continue$/i);
  await page.waitForTimeout(900);

  // The track step is the one this run is already pinned to, so it takes the
  // track the run was started with rather than whatever sits first.
  const wanted = TRACK === 'roman' ? /Roman/i : TRACK === 'script' ? /Script first/i : /Both together/i;
  note('track', (await tapControl(page, wanted)) ? TRACK : `could not choose ${TRACK}`);
  await page.waitForTimeout(500);
  await tapControl(page, /^Continue$/i);
  await page.waitForTimeout(900);

  // Voice only exists when a second voice shipped; skipped silently when not.
  if (/’s voice|Tap to hear it/i.test((await readSurface(page)).text)) {
    await tapControl(page, /’s voice|Tap to hear it/i);
    await page.waitForTimeout(500);
    await tapControl(page, /^Continue$/i);
    await page.waitForTimeout(900);
    note('voice', 'picked one');
  }

  /**
   * The answer that separates the two personas, given as the learner's own
   * self-report — which is what the app says it trusts over the quiz.
   */
  const said = speaker ? /already speak or understand/i : /starting from scratch/i;
  note(
    'background',
    (await tapControl(page, said)) ? (speaker ? 'already speaks it' : 'starting from scratch') : 'could not answer'
  );
  await page.waitForTimeout(500);
  await tapControl(page, /^Continue$/i);
  await page.waitForTimeout(1200);

  /**
   * The placement quiz, answered out of memory like any other question.
   *
   * Four questions, each advancing on the tap, so there is no Continue to
   * press. A beginner guesses and scores what a beginner scores; a speaker
   * knows them and should reach the top level — which is the only way the
   * alphabet skip is ever offered, and so the only way that branch is tested.
   */
  let asked = 0;
  for (let i = 0; i < 8; i++) {
    const screen = await readSurface(page);
    if (!/question \d|of 4/i.test(screen.text) && !/which letter|what does|which of these/i.test(screen.text)) break;
    const { options } = await readOptions(page);
    if (!options.length) break;
    const prompt = screen.lines.slice(0, 6).join(' ');
    const decision = chooseOption(memory, [prompt, ...screen.lines.slice(0, 4)], options);
    await page
      .locator('[role="button"]')
      .nth(decision.pick.i)
      .click()
      .catch(() => {});
    asked++;
    await page.waitForTimeout(1100);
  }
  note('placement', `${asked} question(s) answered`);

  // Daily goal, then the summary screen.
  await tapControl(page, /^(Steady|Casual|Serious|Intense|Gentle)/i);
  await page.waitForTimeout(500);
  await tapControl(page, /^Continue$/i);
  await page.waitForTimeout(1200);

  const ready = await readSurface(page);
  /**
   * The alphabet skip, offered only to a speaker who scored full marks.
   * Declined on purpose: the run is here to walk the course, and a driver that
   * skipped the thirteen letter lessons would report on a path it had chosen
   * not to see. That it was *offered* is the thing worth recording.
   */
  const offeredScriptSkip = /alphabet|letter lessons|skip the script/i.test(ready.text);
  note('ready', offeredScriptSkip ? 'was offered the alphabet skip' : 'no alphabet skip offered');

  const started = await tapControl(page, /^Start learning$/i);
  await page.waitForTimeout(3000);
  const home = await readSurface(page);
  const onPath = /start this lesson|tap any lesson/i.test(home.text);

  const state = await page
    .evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('harf-progress') || 'null');
      const s = raw && raw.state ? raw.state : {};
      return {
        onboarded: !!s.onboarded,
        background: s.background ?? null,
        startLevel: s.startLevel ?? null,
        skipped: Object.keys(s.skippedLessons || {}).length,
      };
    })
    .catch(() => ({}));

  journal.push({
    type: 'onboarded',
    persona: PERSONA,
    speaker,
    steps,
    asked,
    offeredScriptSkip,
    reachedHome: started && onPath,
    ...state,
  });
  return { finished: started && onPath, steps };
}

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
  const stats = {
    lessonsEntered: 0,
    lessonsFinished: 0,
    practiceSessions: 0,
    practiceFinished: 0,
    settingsPasses: 0,
    onboardings: 0,
  };
  /** Everything a session needs to play and to write down what it saw. */
  const ctx = { journal, memory, stats, browser };
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
    {
      hearts: 5,
      gems: 9999,
      // `enterAsGuest` writes `onboarded: true`; this is the one run that wants
      // it left undone, so the flow can actually be played.
      ...(ONBOARD ? { onboarded: false } : {}),
      ...(resume ? { completedLessons: resume.completedLessons } : {}),
    },
    { track: TRACK }
  );
  await page.reload();
  await page.waitForTimeout(2500);

  if (ONBOARD) {
    const done = await onboardingSession(page, ctx);
    flush();
    if (!done.finished) {
      console.log(`  ⚠ onboarding did not reach the path — ${done.steps.join(' · ')}`);
      await browser.close();
      process.exit(1);
    }
    console.log(`  onboarding: ${done.steps.join(' · ')}`);
  }

  if (SURFACES_ONLY) {
    await practiceSession(page, ctx, 0);
    flush();
    await settingsSession(page, ctx);
    flush();
  }

  for (let lesson = 0; lesson < (SURFACES_ONLY ? 0 : LESSONS); lesson++) {
    await topUpHearts(page);
    /**
     * Back to the path, not just back to where we were.
     *
     * A lesson can end without being finished — a trace this driver cannot
     * draw, a screen it cannot read — and a reload then reopens the lesson,
     * because the lesson is what the URL says. The next iteration looks for
     * "start this lesson", finds a letter card instead, and the run stops with
     * "no lesson on the path could be opened". That cost one slice fourteen of
     * its twenty-four lessons, and reported it as though the app had run out of
     * course.
     */
    // Same explicit timeout as the retry below, and for the same reason: the
    // 1.5s default that makes locator misses cheap is far too short for a
    // page load, and a throw here would end the run rather than be reported.
    await page.goto(`http://127.0.0.1:${PORT}/`, { timeout: 30000 }).catch(() => {});
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

    /**
     * Open the next lesson on the path, and give a dead page one more chance.
     *
     * A knows-urdu run stopped after five lessons on "no lesson could be
     * opened — 0 buttons on screen". The app was fine: the screenshot taken
     * immediately afterwards shows Home fully drawn, and the journal's own
     * capture of the DOM at that moment reads `body: ''`. The page had simply
     * not come up, and the wait above had already spent its twenty-five
     * seconds on an empty document.
     *
     * One reload is the whole fix, and it is worth 19 lessons: that is what
     * the run threw away rather than press the button again. A second failure
     * still stops the run — this retries a blank page, it does not paper over
     * a path that genuinely has nothing to open.
     */
    const openNext = () =>
      page.evaluate(() => {
        const n = Array.from(document.querySelectorAll('[role="button"]')).find((b) =>
          /start this lesson/i.test(b.getAttribute('aria-label') || '')
        );
        if (!n) return null;
        n.scrollIntoView({ block: 'center' });
        const label = n.getAttribute('aria-label');
        n.click();
        return label;
      });
    let opened = await openNext();
    if (!opened) {
      const blank = await page.evaluate(() => document.body.innerText.trim() === '').catch(() => false);
      journal.push({ type: 'pathRetried', lesson: stats.lessonsEntered + 1, blank });
      console.log(`    the path did not come up${blank ? ' (the page was blank)' : ''} — reloading once`);
      /**
       * An explicit timeout, because `setDefaultTimeout(1500)` governs
       * navigation too.
       *
       * The first version of this retry called a bare `page.reload()`, which
       * gave up after 1.5 seconds, threw into its own `.catch`, and left the
       * page half-navigated — so the retry reliably produced the blank
       * document it was written to recover from. Measured directly: a reload
       * with room to finish comes back with 4,786 characters and 88 buttons.
       */
      await page.reload({ timeout: 30000 }).catch(() => {});
      await page
        .waitForFunction(
          () =>
            Array.from(document.querySelectorAll('[role="button"]')).some((n) =>
              /start this lesson/i.test(n.getAttribute('aria-label') || '')
            ),
          { timeout: 25000 }
        )
        .catch(() => {});
      opened = await openNext();
    }
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
    await page.waitForTimeout(2200);

    const outcome = await playSession(page, ctx, lessonName);
    if (outcome.stopped) stopped = true;
    flush();
    const answers = journal.filter((e) => e.type === 'answer').length;
    console.log(
      `  lesson ${stats.lessonsEntered}: ${lessonName} — ${answers} answered so far, ` +
        `${stats.lessonsFinished} finished, ${outcome.seconds}s`
    );
    if (stopped) break;

    // Off the path and back again. After the lesson rather than before it, so
    // a practice session has the words this lesson just taught to draw on.
    if (PRACTICE_EVERY > 0 && stats.lessonsEntered % PRACTICE_EVERY === 0) {
      const p = await practiceSession(page, ctx, stats.practiceSessions);
      flush();
      if (p && p.stopped) break;
    }
    if (SETTINGS_EVERY > 0 && stats.lessonsEntered % SETTINGS_EVERY === 0) {
      await settingsSession(page, ctx);
      flush();
    }
  }

  flush();
  const answered = journal.filter((e) => e.type === 'answer');
  console.log(
    `playtest — ${stats.lessonsEntered} lessons entered, ${stats.lessonsFinished} finished, ` +
      `${stats.practiceSessions} practice visit(s), ${stats.settingsPasses} settings pass(es), ` +
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

module.exports = {
  Memory,
  lessonDoneText,
  surfaceFindings,
  revealFrom,
  record,
  classify,
  knewRevealedAnswer,
  chooseOption,
  findings,
  tripwires,
  asContent,
};
