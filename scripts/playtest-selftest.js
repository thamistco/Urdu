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
 * Each assertion here has been checked by breaking the rule it covers and
 * watching it fail — dropping the graded gate, trusting the caller's verdict
 * over the screen's, collapsing "forgot" into "never taught", un-skipping
 * matching in the reveal finding, removing the harness finding, and rejecting
 * one-line reveals. A green run of this file means those six mistakes are not
 * present. It says nothing about whether the driver can still read the screen,
 * which only a real run can tell you.
 */

const { record, classify, revealFrom, findings } = require('./playtest.js');

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
  const j = [
    { type: 'answer', correct: false, couldHaveKnown: true, how: 'forgot', reveal: ['a', 'b'] },
    { type: 'answer', correct: false, couldHaveKnown: false, how: 'guessed', reveal: ['a', 'b'] },
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

console.log(fails ? `\n${fails} failed` : '\nall good');
process.exit(fails ? 1 : 0);
