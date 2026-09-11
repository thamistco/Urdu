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

const { record, classify, revealFrom, findings, knewRevealedAnswer } = require('./playtest.js');

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

console.log(fails ? `\n${fails} failed` : '\nall good');
process.exit(fails ? 1 : 0);
