/* eslint-disable */
/**
 * The playtester's own rules, checked without driving a browser.
 *
 * `playtest.js` is a tool rather than a gate, so it is deliberately not part of
 * `check:all` and neither is this. It exists because the tool's first full run
 * produced a report whose headline finding — "121 wrong answers where the app
 * revealed nothing" — was entirely manufactured by a bug in the tool. Not one
 * of the 121 was an answer. The app was fine; the driver was recording screens
 * the app had never graded, and a confident report was about to be written on
 * top of that.
 *
 * The lesson is not "be careful". It is that a playtester's findings are only
 * worth as much as its bookkeeping, and the bookkeeping was untestable: the
 * rules lived inline in an async loop that needed a browser, a built bundle and
 * two hours to execute once. So the rules were pulled out into pure functions,
 * and this file holds them to their contracts.
 *
 *   node scripts/playtest-selftest.js
 *
 * Every assertion here has been checked by breaking the rule it covers and
 * watching it fail: dropping the graded gate, trusting the caller's verdict
 * over the screen's, collapsing "forgot" into "never taught", tying
 * `couldHaveKnown` back to the dice, un-skipping matching in the reveal
 * finding, removing either harness finding, and rejecting one-line reveals.
 *
 * A green run means those mistakes are not present. It says nothing about
 * whether the driver can still read a screen, which only a real run tells you —
 * and the two harness findings exist because that is the failure this file
 * cannot see.
 */

const fs = require('fs');
const path = require('path');

const {
  record,
  classify,
  revealFrom,
  findings,
  knewRevealedAnswer,
  Memory,
  tripwires,
  chooseOption,
  asContent,
  surfaceFindings,
  lessonDoneText,
  windBackADay,
  caveats,
} = require('./playtest.js');

let fails = 0;
const ok = (name, cond) => {
  console.log(`${cond ? 'ok   ' : 'FAIL '}${name}`);
  if (!cond) fails++;
};

// -- only a graded screen is an answer ---------------------------------------

{
  const j = [];
  const kept = record(j, { graded: false, right: false }, { lesson: 'L', step: 1, promptShape: 'type this word' });
  ok('a screen the app never graded is not recorded as an answer', kept === false && j[0].type === 'ungraded');
}
{
  const j = [];
  record(j, { graded: true, right: false }, { lesson: 'L', step: 1, promptShape: 'x' });
  ok('a graded wrong answer is recorded as wrong', j[0].type === 'answer' && j[0].correct === false);
}
{
  const j = [];
  record(j, { graded: true, right: true }, { lesson: 'L', step: 1, promptShape: 'x' });
  // The verdict comes from the screen, never from what the caller believed.
  record(j, { graded: true, right: true }, { lesson: 'L', step: 2, promptShape: 'x', correct: false });
  ok('the screen decides the verdict, not the caller', j[0].correct === true && j[1].correct === true);
}

// -- taught and remembered are different questions ---------------------------

{
  const t = classify(true, true);
  const f = classify(true, false);
  const n = classify(false, false);
  ok('taught and produced is a recall', t.how === 'recalled' && t.couldHaveKnown === true);
  ok('taught but not produced is a lapse, not an unknown', f.how === 'forgot' && f.couldHaveKnown === true);
  ok('never taught is a guess', n.how === 'guessed' && n.couldHaveKnown === false);
}
{
  // `knewAnswer` is whether the app had ever shown the answer it has just
  // revealed; `how` is whether the learner could produce it at the time. The
  // first line is a word met before and lost, the second one never shown.
  const j = [
    { type: 'answer', correct: false, knewAnswer: true, how: 'forgot', reveal: ['a', 'b'] },
    { type: 'answer', correct: false, knewAnswer: false, how: 'guessed', reveal: ['a', 'b'] },
  ];
  const f = findings(j);
  const untaught = f.find((x) => x.kind === 'tested before taught');
  const forgot = f.find((x) => /met once/.test(x.kind));
  // These two want opposite fixes — reorder the course, or space it out — so
  // counting a lapse as an unknown points the reader at the wrong repair.
  ok(
    'a forgotten word is a pacing finding, not an ordering one',
    !!untaught && untaught.count === 1 && !!forgot && forgot.count === 1
  );
}

// -- the reveal finding only judges exercises that use the reveal panel ------

{
  const j = [
    { type: 'answer', correct: false, gradesInPlace: true, reveal: null, promptShape: 'match each word' },
    { type: 'answer', correct: false, reveal: null, promptShape: 'what does it mean' },
  ];
  const f = findings(j).find((x) => x.kind === 'got it wrong and was shown nothing');
  ok('matching, which corrects in place, is not held to the reveal panel', !!f && f.count === 1);
}
{
  const f = findings([{ type: 'ungraded', promptShape: 'type this word' }]);
  // A driver that quietly stops reading screens would otherwise look like a
  // learner having a clean run.
  ok('dropped screens are reported rather than swallowed', !!f.find((x) => /^harness:/.test(x.kind)));
}

// -- reveals ------------------------------------------------------------------

{
  // "Which position is this letter showing" is answered by one word. An earlier
  // reading of that as a parser artifact was wrong, and nearly led to a fix
  // that would have thrown away thirteen genuine reveals.
  ok(
    'a one-line answer is a real reveal',
    JSON.stringify(revealFrom(['x', 'The answer', 'Start', 'Continue'])) === '["Start"]'
  );
  ok('no reveal panel means no reveal', revealFrom(['x', 'Not quite', 'Continue']) === null);
}

// -- the run owns up to its own gaps -----------------------------------------

{
  const f = findings([{ type: 'lessonTimedOut', lesson: 'L', step: 9, seconds: 400 }]);
  // A lesson cut short makes every count in the report an undercount, so the
  // report has to say so rather than quietly reporting the smaller number.
  ok('an abandoned lesson is reported, not hidden', !!f.find((x) => /abandoned on the clock/.test(x.kind)));
}

{
  const j = [];
  const kept = record(
    j,
    { graded: false, right: false, outOfHearts: true },
    { lesson: 'L', step: 1, promptShape: 'x' }
  );
  // A heart is only ever lost by being wrong, so the wall is a verdict even
  // though it has painted over the banner that carried it.
  ok(
    'the hearts wall counts as a wrong answer, not a dropped screen',
    kept === true && j[0].type === 'answer' && j[0].correct === false && j[0].endedOnHeartsWall === true
  );
  ok('and it is reported as its own finding', !!findings([j[0]]).find((x) => /hearts wall/.test(x.kind)));
}

// -- tested before taught is asked of the answer, not the prompt -------------

{
  const M = { knows: (t) => t === 'seen' };
  // Nothing to judge: no reveal, or a reveal with no Urdu in it. A question
  // like "which position is this letter showing" is answered by looking at the
  // glyph, so it has no vocabulary to have been taught and must not be counted.
  ok('no reveal is not evidence of anything', knewRevealedAnswer(M, null) === null);
  ok('an answer with no Urdu in it is not counted', knewRevealedAnswer(M, ['Start']) === null);
  ok('an Urdu answer never shown counts as untaught', knewRevealedAnswer(M, ['\u0644\u0627\u0644', 'laal']) === false);
  ok(
    'an Urdu answer already shown does not',
    knewRevealedAnswer({ knows: () => true }, ['\u0644\u0627\u0644']) === true
  );
  // "Which tile is alif?" reveals \u067e\u0627\u0646 \u2014 one letter wrapped in its neighbours,
  // a slice of the word on screen rather than a word. The learner was never
  // taught it and never will be; 25 of one run's 64 "tested before taught"
  // were this shape.
  ok(
    'a tile is a slice of a word, not vocabulary',
    knewRevealedAnswer(M, ['\u067e\u0627\u0646'], 'Which tile is alif?') === null &&
      knewRevealedAnswer(M, ['\u067e\u0627\u0646'], 'Which word means this?') === false
  );
}
{
  // null must not be counted as "never taught" — that is the bug this rule
  // exists to prevent, and `=== false` is the whole of the defence.
  const f = findings([
    { type: 'answer', correct: false, knewAnswer: null, reveal: ['Start'] },
    { type: 'answer', correct: false, knewAnswer: false, reveal: ['\u0644\u0627\u0644'] },
  ]).find((x) => x.kind === 'tested before taught');
  ok('a question with nothing to judge is left out of the count', !!f && f.count === 1);
}

{
  // A card between two questions is a change of scene, so it breaks the run.
  const same = (n) =>
    Array.from({ length: n }, () => ({ type: 'answer', promptShape: 'how do you say it', lesson: 'L' }));
  const straight = findings(same(5)).find((x) => /several times running/.test(x.kind));
  ok('four of the same question in a row is a finding', !!straight);
  const broken = [...same(2), { type: 'taught', lesson: 'L' }, ...same(3)];
  ok('a teaching card between them is not', !findings(broken).find((x) => /several times running/.test(x.kind)));
}

{
  // The opening question about a word is followed by that word's card. It is
  // unanswerable on purpose, so it is not a complaint about lesson order.
  const wrong = { type: 'answer', correct: false, knewAnswer: false, reveal: ['\u0644\u0627\u0644'] };
  const opener = { type: 'answer', correct: false, knewAnswer: false, reveal: ['\u06af\u06be\u0631'] };
  const f = findings([opener, { type: 'taught', lesson: 'L' }, wrong]).find((x) => x.kind === 'tested before taught');
  ok('a question answered by the card after it is not counted as untaught', !!f && f.count === 1);
}

// -- a cluster is one meaning, and stays one ---------------------------------

{
  // The bug this file was extended for: every screen in the app carries the
  // same close button, so one shared string chained every cluster that had
  // ever been learned beside one into a single blob. Two lessons in, the
  // largest held 21 strings; over 34 the learner answered "Book" with "alif".
  const m = new Memory();
  m.learn(['کتاب', 'kitaab', 'book', '✕']);
  m.learn(['پانی', 'paani', 'water', '✕']);
  ok('screen chrome never joins a cluster', !m.knows('✕'));
  ok('and cannot merge two words through itself', m.clusterFor('book') !== m.clusterFor('water'));
  ok('the words themselves are still learned', m.knows('book') && m.knows('paani'));
}

{
  // One shared string is a coincidence — a header above an unrelated question,
  // a gloss that happens to repeat. Two is the same word said twice.
  const m = new Memory();
  m.learn(['الف', 'alif']);
  m.learn(['alif', 'these look alike']);
  ok('one shared string does not merge two meanings', m.clusterFor('these look alike') !== m.clusterFor('الف'));
  m.learn(['الف', 'alif', 'a / aa']);
  ok('two shared strings do', m.clusterFor('a / aa') === m.clusterFor('الف'));
}

{
  // A string can sit in more than one meaning. Recall reads the best of them,
  // because a learner who knows either one knows this string.
  const m = new Memory();
  m.learn(['ایک', 'ek', 'one']);
  for (let i = 0; i < 6; i++) m.learn(['ایک', 'ek', 'one']);
  m.learn(['one another', 'one']);
  ok('a token in two meanings recalls the better one', m.recall('one') > 0.8);
}

// -- a question about a sentence is answerable -------------------------------

{
  // A sentence is remembered under its whole text, so a reader that only ever
  // looks up the individual words never finds it. A learner resumed at lesson
  // 31, where the course has turned to sentences, guessed 100 times out of 100
  // with the answer sitting in its memory.
  const m = new Memory();
  m.learn(['میں خوش ہوں', 'main khush hoon', 'I am happy']);
  const options = [{ lines: ['📝', 'We are friends'] }, { lines: ['📝', 'I am happy'] }];
  const d = chooseOption(m, ['What does it mean?', '✕', 'میں خوش ہوں'], options);
  ok('a whole sentence on screen is looked up as itself', d.couldHaveKnown === true);
  // And the words inside a line still are, which is how every single-word
  // question has always worked.
  const w = new Memory();
  w.learn(['پانی', 'paani', 'water']);
  ok(
    'and the words within it still are',
    chooseOption(w, ['What does it mean?', '✕', 'پانی'], [{ lines: ['Water'] }, { lines: ['Book'] }]).couldHaveKnown ===
      true
  );
}

// -- what a screen asks is not what it is about ------------------------------

{
  // "Tap to hear" and "Which one did you hear?" head every listening question
  // in the course, so learning them beside the answer joined `happy`, `family`
  // and `name` into one meaning inside sixteen lessons.
  const chrome = ['Tap to hear', 'Which one did you hear?', '✕'];
  const m = new Memory();
  m.learn(['happy', 'خوش', ...asContent(chrome)]);
  m.learn(['family', 'خاندان', ...asContent(chrome)]);
  ok(
    'an instruction cannot join two words',
    !!m.clusterFor('happy') && !!m.clusterFor('family') && m.clusterFor('happy') !== m.clusterFor('family')
  );
  ok('and is not learned at all', !m.knows('tap to hear') && !m.knows('which one did you hear?'));
  // A real gloss beside the answer still is.
  ok('a word beside its meaning still is', asContent(['Water', 'پانی']).length === 2);
}

// -- the run is allowed to fail ----------------------------------------------

{
  const limits = { zeroShapeAfter: 20, clusterMax: 8 };
  const quiet = new Memory();
  const typed = (n, right, couldHaveKnown = true) =>
    Array.from({ length: n }, (_, i) => ({
      type: 'answer',
      promptShape: 'type this word',
      couldHaveKnown,
      correct: i < right,
    }));

  ok('a shape being lost is not by itself a tripwire', tripwires(typed(19, 0), quiet, limits).length === 0);
  ok('twenty in a row the learner should have known is', tripwires(typed(20, 0), quiet, limits).length === 1);
  ok('one of them going right is not', tripwires(typed(40, 1), quiet, limits).length === 0);
  // A real beginner does get its first twenty typed words wrong, and that is
  // the finding, not a fault. Only questions the model believed were
  // answerable count.
  ok('a beginner guessing badly is not a fault', tripwires(typed(40, 0, false), quiet, limits).length === 0);
}

{
  const limits = { zeroShapeAfter: 20, clusterNames: 3, clusterMax: 16 };
  const m = new Memory();
  m.learn(['کتاب', 'kitaab', 'book']);
  ok('a word, its reading and its meaning is not a collapse', tripwires([], m, limits).length === 0);

  // Shapes are free. Baṛī ye is written with choṭī ye's forms at the start of
  // a word and in the middle of one, so the two letters honestly share two of
  // their faces and the model merges them — eight strings under two names,
  // which is correct Urdu and stopped a real run five lessons early when this
  // was counted by size.
  const ye = new Memory();
  ye.learn(['choṭī ye', 'ی', 'یـ', 'ـیـ', 'ـی']);
  ye.learn(['baṛī ye', 'ے', 'یـ', 'ـیـ', 'ـے']);
  ok('two letters sharing their faces is not a collapse', tripwires([], ye, limits).length === 0);
  ok('even at eight strings', ye.clusterFor('یـ').tokens.size === 8);
  // And each of them brings a sound as well as a name. A sound is neither a
  // shape nor a name — it is how the letter is pronounced, written in curly
  // quotes — and counting the pair's two sounds as names stopped a second run.
  ye.learn(['choṭī ye', 'ی', '“y / ee”']);
  ye.learn(['baṛī ye', 'ے', '“e / ai”']);
  ok('nor are the sounds they are read with', tripwires([], ye, limits).length === 0);

  /**
   * A word the course teaches twice, the second gloss qualifying the first.
   *
   * ہفتہ is "Week" in Time & day and "Saturday (also: week)" in Days &
   * months, and its card shows a keycap digit for the sixth day. Five strings
   * and a memory that has not collapsed at all — this stopped a 24-lesson
   * slice at lesson 23 before the rule knew it.
   *
   * Checked at a limit of two names rather than the shipped three, and that is
   * the point rather than a convenience: at three, dropping the picture and
   * folding the qualifier each take the count from four to three on their own,
   * so the pair of assertions passed with either rule deleted. Two names makes
   * each one load-bearing — which is how this was found, by deleting them one
   * at a time and watching nothing fail.
   */
  const strict = { ...limits, clusterNames: 2 };
  const hafta = new Memory();
  hafta.learn(['ہفتہ', 'hafta', 'week']);
  hafta.learn(['ہفتہ', 'hafta', 'Saturday (also: week)', '6️⃣']);
  ok('a second gloss that qualifies the first is not a collapse', tripwires([], hafta, strict).length === 0);
  ok('the picture on the card is not a name either', hafta.clusterFor('hafta').tokens.size === 5);
  // And the shipped limit agrees, which is what the run actually uses.
  ok('nor is it one at the limit the run is played with', tripwires([], hafta, limits).length === 0);
  // The honest two names are still two: a word and its reading do not fold
  // into each other just because both are written in Latin letters.
  const book = new Memory();
  book.learn(['کتاب', 'kitaab', 'book']);
  ok(
    'a word and its reading still count as two names',
    tripwires([], book, { ...limits, clusterNames: 1 }).length === 1
  );

  // Names are not. This is the shape the real blob had: separate meanings
  // dragged together by what was printed above them.
  const blob = new Memory();
  blob.learn(['happy', 'خوش', 'which one did you hear?', 'tap to hear']);
  blob.learn(['family', 'خاندان', 'which one did you hear?', 'tap to hear']);
  const fired = tripwires([], blob, limits);
  ok('one meaning answering to four names is', fired.length === 1 && /memory/.test(fired[0].name));
}

/**
 * The Practice and Settings rules.
 *
 * Each of these is one promise the interface makes, and each pair below is the
 * same promise kept and broken — because a rule that has only ever been handed
 * the passing case is a rule nobody has seen work. The kept case matters as
 * much as the broken one here: the first draft of the search rule fired on
 * every single search, including the ones that found exactly what they were
 * asked for, and a report that complains about a working screen is worse than
 * one that says nothing.
 */
{
  const only = (j) => surfaceFindings(j);

  const shelf = (claims, lists) => [{ type: 'practiceShelf', shelf: 'topics', claims, lists, first: [] }];
  ok('a shelf that lists what it claims is not a finding', only(shelf(78, 78)).length === 0);
  ok(
    'a shelf that claims more than it lists is',
    /says 78 items, the shelf under it lists 54/.test(only(shelf(78, 54))[0] || '')
  );
  ok(
    'an empty shelf is named as empty',
    only(shelf(0, 0)).some((s) => /is empty/.test(s))
  );

  const search = (of, hits, sawEmptyState) => [
    { type: 'practiceSearch', shelf: 'topics', term: 'colours', of, hits, sawEmptyState },
  ];
  ok(
    'a search that finds the card it was copied from is not a finding',
    only(search('Colours', 3, false)).length === 0
  );
  ok(
    'a search that loses it is',
    /found nothing, though it was taken from "Colours"/.test(only(search('Colours', 0, false))[0] || '')
  );
  ok(
    'nonsense matching nothing, with the empty state shown, is not a finding',
    only(search(null, 0, true)).length === 0
  );
  ok(
    'nonsense matching nothing silently is',
    /nothing on screen to say why/.test(only(search(null, 0, false))[0] || '')
  );
  ok('nonsense that still lists things is', /still listed 7 items/.test(only(search(null, 7, false))[0] || ''));

  const review = (dueClaimed, asked) => [{ type: 'reviewPlayed', pass: 0, dueClaimed, asked, seconds: 30 }];
  ok('a review that asks about what it said was due is not a finding', only(review(12, 12)).length === 0);
  ok('a review that asks about fewer than it said is not either', only(review(12, 5)).length === 0);
  ok(
    'a review that says twelve are due and then asks nothing is',
    /said 12 item\(s\) were due and then asked nothing/.test(only(review(12, 0))[0] || '')
  );

  const toggled = (from, to) => [
    { type: 'settingToggled', label: 'Haptics', from, to, stuck: to !== from, rowsAfter: 5 },
  ];
  ok('a switch that moves is not a finding', only(toggled(true, false)).length === 0);
  ok('a switch that does not is', /"Haptics" did not change/.test(only(toggled(true, true))[0] || ''));

  /**
   * Onboarding decides two things for a learner who already speaks Urdu, and
   * nothing else in the app decides them: the basic vocabulary is skipped, and
   * the self-report is what is recorded. A beginner gets neither, and a
   * beginner who somehow got the skip is just as wrong.
   */
  const onboarded = (over) => [
    {
      type: 'onboarded',
      persona: 'knows-urdu',
      speaker: true,
      steps: [],
      asked: 4,
      reachedHome: true,
      onboarded: true,
      background: 'speaker',
      startLevel: 2,
      skipped: 30,
      ...over,
    },
  ];
  ok('a speaker who lands on the path with lessons skipped is not a finding', only(onboarded({})).length === 0);
  ok('a speaker whose basics were not skipped is', /no lesson skipped/.test(only(onboarded({ skipped: 0 }))[0] || ''));
  ok('a speaker recorded as something else is', /recorded "new"/.test(only(onboarded({ background: 'new' }))[0] || ''));
  ok('a short placement quiz is', /asked 2 question\(s\), not 4/.test(only(onboarded({ asked: 2 }))[0] || ''));
  ok(
    'finishing without reaching the path is',
    /did not land on the learn path/.test(only(onboarded({ reachedHome: false }))[0] || '')
  );
  ok(
    'a beginner handed a skip is',
    /starting from scratch had 30 lesson/.test(
      only(onboarded({ speaker: false, persona: 'beginner', background: 'new' }))[0] || ''
    )
  );
  ok(
    'and a beginner with nothing skipped is not',
    only(onboarded({ speaker: false, persona: 'beginner', background: 'new', skipped: 0 })).length === 0
  );

  const reset = (tapped, confirmed) => [{ type: 'resetOffered', tapped, confirmed, stillOnSettings: true }];
  ok('a reset that asks first is not a finding', only(reset(true, true)).length === 0);
  ok('a reset that does not ask is', /ran without asking for confirmation/.test(only(reset(true, false))[0] || ''));
  ok('a reset control that cannot be found is', /could not be found/.test(only(reset(false, false))[0] || ''));
}

/**
 * "The lesson is over" has to mean what the app says it means.
 *
 * Read out of `LessonComplete.tsx` rather than written down here, because
 * writing it down here is exactly how this broke twice. The first time, every
 * wording was a guess and one happened to be right, so a run that finished
 * eight lessons reported none. The second time, the guess that was right
 * covered only half of what the screen can say: it prints "Flawless session"
 * when nothing was missed, and a lesson the learner got entirely right was
 * never recognised as finished — the driver walked past the completion screen
 * into the Letter Lab and spent eight screens there with nothing to answer.
 *
 * So the strings come from the one line that decides them. A rename that this
 * file cannot find fails loudly rather than silently teaching the driver to
 * walk past the end of a lesson.
 */
{
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/screens/LessonComplete.tsx'), 'utf8');
  const line = /result\.perfect \? '([^']+)' : '([^']+)'/.exec(src);
  ok('the completion screen still decides its wording in one place', !!line);
  for (const said of line ? [line[1], line[2]] : []) {
    // Upper-cased on screen by its own style, so both cases are checked.
    ok(`"${said}" is recognised as the end of a lesson`, lessonDoneText(said) && lessonDoneText(said.toUpperCase()));
  }
  ok('and an ordinary screen is not', !lessonDoneText('READING · COLOURS AROUND ME'));
}

/**
 * The staleness a question was asked at, measured before the answer teaches.
 *
 * It was computed after the fact and read 0 on 2,069 of the 2,071 answers that
 * carried it — a number that looked like evidence and was an artefact of when
 * it was taken.
 */
{
  const m = new Memory();
  m.learn(['کتاب', 'kitaab', 'book']);
  for (let i = 0; i < 12; i++) m.step++;
  const options = [
    { i: 0, lines: ['کتاب'] },
    { i: 1, lines: ['پانی'] },
  ];
  const d = chooseOption(m, ['How do you say it?', 'book'], options);
  ok('the gap is the distance since the last sighting, not zero', d.gapSteps === 12);
  // And a question about something never met carries no gap rather than a 0.
  const blank = chooseOption(new Memory(), ['How do you say it?', 'book'], options);
  ok('a word never met has no gap at all', blank.gapSteps === null);
}

/**
 * The fluent learner's own wire.
 *
 * The fixtures are the measurements, not invented numbers: three healthy
 * knows-urdu slices got 96%, 97% and 96% of what they knew; a beginner over
 * the same measure gets 63%; a letters-only stretch dipped to 77% over 13
 * questions, which is the small sample the window exists to ignore.
 */
{
  const L = { zeroShapeAfter: 20, clusterNames: 3, clusterMax: 16, fluentFloor: 0.8, fluentWindow: 60, fluent: true };
  const run = (n, share) =>
    Array.from({ length: n }, (_, i) => ({ type: 'answer', couldHaveKnown: true, correct: i < Math.round(n * share) }));
  const fire = (j, over) => tripwires(j, new Memory(), { ...L, ...over });

  ok('a fluent run at 96% of what it knows is fine', fire(run(60, 0.96)).length === 0);
  ok('and at 97%', fire(run(60, 0.97)).length === 0);
  ok(
    'a fluent run scoring like a beginner is stopped',
    /scoring like a beginner/.test((fire(run(60, 0.63))[0] || {}).name || '')
  );
  ok('the letters-only dip is too small a sample to fire', fire(run(13, 0.77)).length === 0);
  // The same numbers on a beginner are the beginner working, not a fault.
  ok('a beginner scoring like a beginner is not', fire(run(60, 0.63), { fluent: false }).length === 0);
  // Guesses are not misses: a speaker on the letter lessons guesses a lot and
  // knows little, and none of that reaches this wire.
  const guessing = Array.from({ length: 200 }, () => ({ type: 'answer', couldHaveKnown: false, correct: false }));
  ok('questions it never had the answer for leave the wire alone', fire(guessing).length === 0);
}

// -- the calendar actually moves ---------------------------------------------

/**
 * `--day-every` exists because the app's schedule is measured in days and a
 * playtest is measured in minutes. `srs.ts` hands out one day, then three,
 * then interval times ease; the only shorter step is the sixty seconds a
 * missed card waits. So in every run made before this flag, no card answered
 * correctly ever came due again, and the gap distribution the harness
 * reported described an app with spaced repetition switched off. The 21-to-100
 * screen hole in that distribution — 304 asks against 6,528 repeats overall —
 * was partly the harness's own shadow.
 *
 * These hold the arithmetic that decides whether a simulated day did anything,
 * because "the calendar turned" and "cards came due" are different claims and
 * only the second one is worth running for.
 */
{
  const now = 1_700_000_000_000;
  const DAY = 24 * 60 * 60 * 1000;
  const state = {
    heartsUpdatedAt: now,
    srs: {
      tomorrow: { due: now + DAY - 1000, lastSeen: now, interval: 1 },
      inThreeDays: { due: now + 3 * DAY, lastSeen: now, interval: 3 },
      alreadyDue: { due: now - 5000, lastSeen: now - DAY, interval: 0 },
    },
  };
  const moved = windBackADay(state, now);
  ok("a day passing brings tomorrow's card due", state.srs.tomorrow.due <= now);
  ok('a day passing does not bring a card due in three days due', state.srs.inThreeDays.due > now);
  ok('only the card that crossed the line is counted', moved.becameDue === 1 && moved.cards === 3);
  ok(
    'a card already due is not counted again',
    windBackADay({ srs: { alreadyDue: { due: now - 5000, lastSeen: now } } }, now).becameDue === 0
  );
  ok('lastSeen moves with due, so recency is not silently aged', state.srs.tomorrow.lastSeen === now - DAY);
  ok('the learner got their hearts back overnight', state.heartsUpdatedAt === now - DAY);
}
{
  ok('a store with no cards reports none rather than throwing', windBackADay({}, 1).cards === 0);
  ok('no state at all is not a day', windBackADay(null, 1) === null);
  ok(
    'a card with no timestamp is left alone rather than turned into NaN',
    !Number.isNaN(
      (() => {
        const st = { srs: { odd: { lastSeen: 5 } } };
        windBackADay(st, 10);
        return st.srs.odd.due === undefined ? 0 : st.srs.odd.due;
      })()
    )
  );
}

// -- a report says what it is not evidence for -------------------------------

/**
 * Two findings from this harness were measured against a precondition that was
 * not met, and in both cases the number looked fine: "0 hearts walls in 8
 * lessons" over eight lessons where `hearts.ts` makes hearts free, and a gap
 * distribution over 12,108 answers taken in an afternoon, where the schedule's
 * shortest successful interval is a day. A report that states a number and not
 * its precondition reads identically either way, which is why nothing caught
 * either one.
 */
{
  const inGrace = caveats({ resumeAfter: 0, lessonsEntered: 8, graceLessons: 9, dayEvery: 4, practiceSessions: 1 });
  ok(
    'a run entirely inside the free-hearts grace says so',
    inGrace.some((c) => /Hearts prove nothing/.test(c))
  );

  const past = caveats({ resumeAfter: 30, lessonsEntered: 12, graceLessons: 9, dayEvery: 4, practiceSessions: 1 });
  ok('a run past the grace does not cry wolf about hearts', !past.some((c) => /Hearts/.test(c)));

  const straddles = caveats({ resumeAfter: 5, lessonsEntered: 10, graceLessons: 9, dayEvery: 4, practiceSessions: 1 });
  ok(
    'a run straddling the grace says which lessons the walls came from',
    straddles.some((c) => /only measurable for part/.test(c) && /10-15/.test(c))
  );

  const noClock = caveats({ resumeAfter: 30, lessonsEntered: 12, graceLessons: 9, dayEvery: 0, practiceSessions: 1 });
  ok(
    'a run with no calendar says its spacing numbers describe an inert scheduler',
    noClock.some((c) => /No day passed/.test(c))
  );

  const clocked = caveats({
    resumeAfter: 30,
    lessonsEntered: 12,
    graceLessons: 9,
    dayEvery: 4,
    practiceSessions: 1,
    journal: [{ type: 'dayPassed', becameDue: 26 }],
  });
  ok('a clocked run with cards coming due carries no caveat at all', clocked.length === 0);

  const deadClock = caveats({
    resumeAfter: 30,
    lessonsEntered: 12,
    graceLessons: 9,
    dayEvery: 4,
    practiceSessions: 1,
    journal: [{ type: 'dayPassed', becameDue: 0 }],
  });
  ok(
    'a calendar that turns with nothing coming due is reported',
    deadClock.some((c) => /no card ever came due/.test(c))
  );

  const noReview = caveats({ resumeAfter: 30, lessonsEntered: 12, graceLessons: 9, dayEvery: 4, practiceSessions: 0 });
  ok(
    'a run that never opened Daily Review says so',
    noReview.some((c) => /Daily Review was never opened/.test(c))
  );

  ok('a run that played nothing claims nothing', caveats({ lessonsEntered: 0 }).length === 0);
}

console.log(fails ? `\n${fails} failed` : '\nall good');
process.exit(fails ? 1 : 0);
