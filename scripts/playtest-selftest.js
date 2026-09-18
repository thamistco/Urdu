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

  // Names are not. This is the shape the real blob had: separate meanings
  // dragged together by what was printed above them.
  const blob = new Memory();
  blob.learn(['happy', 'خوش', 'which one did you hear?', 'tap to hear']);
  blob.learn(['family', 'خاندان', 'which one did you hear?', 'tap to hear']);
  const fired = tripwires([], blob, limits);
  ok('one meaning answering to four names is', fired.length === 1 && /memory/.test(fired[0].name));
}

console.log(fails ? `\n${fails} failed` : '\nall good');
process.exit(fails ? 1 : 0);
