/* eslint-disable */
/**
 * Does a unit's name tell you what is inside it?
 *
 * A learner opening the path sees a unit header and a list of lesson rows. The
 * header is the only place that says what the unit is *for*, and this course's
 * script-track headers had drifted into naming only their letters: "Unit 2 ·
 * Hooks & Throats" held the jeem family, family words and numbers, and said so
 * about one of the three. Measured across the course, 52 of 131 vocabulary and
 * letter topics were invisible from the name of the unit holding them, and one
 * unit was named for something it did not contain at all ("Days & Things" held
 * bigger numbers, clothing and question-asking, no days anywhere).
 *
 * The idea is Drops', who broke their categories into short units named for the
 * scenario they cover after finding that learners could not match their
 * content to a goal. It is not a claim about how words are *learned*: the
 * multilevel meta-analysis of semantic clustering (21 studies, 37 effect sizes)
 * puts that at g = 0.01, which is nothing. This is about being able to find
 * what you want and know what you just finished.
 *
 * The rule: every vocabulary, phrase and letter lesson in a unit must have a
 * content word of its title echoed in that unit's title or subtitle, on each
 * track that shows it. Readings and conversations are exempt, because the row
 * already says "Reading:" or "Talk:" and names the passage; so are reviews,
 * grammar lessons and sentence drills, which are formats rather than topics.
 *
 * Words are matched on their first four letters so that "Numbers" answers for
 * "numbers past a hundred" and "teeth" does not answer for "toothed".
 *
 * ## And the review ids, which are the same question asked of the source
 *
 * A review has no content of its own to be named after, so it takes the unit's
 * slug as its id — the one id in `units.ts` written out by hand rather than
 * derived. Sixteen of the 41 had stopped matching their unit, two of them
 * before the regrouping that prompted this, because renaming a unit does not
 * touch a hand-written string and nothing looked.
 *
 * Run with:  npm run check:unit-names
 */

const { load } = require('./lib/load-ts');
const { UNITS } = load('src/data/units.ts');

/** Words too common to be evidence that a topic was named. */
const STOP = new Set([
  'the',
  'and',
  'a',
  'an',
  'of',
  'to',
  'in',
  'on',
  'your',
  'you',
  'it',
  'is',
  'are',
  'for',
  'with',
  'more',
  'how',
  'what',
  'who',
  'their',
  'they',
  'its',
  'this',
  'that',
  'first',
  'second',
  'part',
  'mixed',
  'practice',
  'review',
  'unit',
  'amp',
]);

const words = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

/** A topic counts as named when one of its content words is echoed. */
const echoes = (haystack, topic) => {
  const ws = words(topic);
  if (!ws.length) return true; // a title that is all punctuation, like "k, q and g"
  return ws.some((w) => haystack.some((h) => h.startsWith(w.slice(0, 4)) || w.startsWith(h.slice(0, 4))));
};

const NAMEABLE = new Set(['vocab', 'phrases', 'letters']);

const gaps = [];
let checked = 0;

for (const track of ['script', 'roman']) {
  for (const unit of UNITS) {
    const title = track === 'roman' ? unit.romanTitle || unit.title : unit.title;
    const subtitle = track === 'roman' ? unit.romanSubtitle || unit.subtitle : unit.subtitle;
    const hay = words(`${title} ${subtitle}`);

    const topics = [
      ...new Set(
        unit.lessons
          .filter((l) => NAMEABLE.has(l.kind))
          // The Roman track never shows the letter lessons, so its header owes
          // them nothing.
          .filter((l) => !(track === 'roman' && l.kind === 'letters'))
          .filter((l) => !/^(Reading|Talk):/.test(l.title))
          .map((l) => l.title)
      ),
    ];

    for (const topic of topics) {
      checked++;
      if (!echoes(hay, topic)) {
        gaps.push(`${unit.id} (${track}) "${title}" does not name "${topic}"`);
      }
    }
  }
}

/**
 * `rev-<slug of the unit's title>`, with "Unit 7 · " dropped and "&" spelled
 * out — the spelling `REV(...)` is called with in `units.ts`.
 *
 * Deliberately exact rather than fuzzy, unlike the topic rule above. A review
 * id is not read by a learner and nothing resolves a unit through it
 * (`taughtInUnit` matches on which lessons a unit holds), so the only thing it
 * can cost is a reader who cannot tell whether the id or the title is the stale
 * one. A rule that accepts "close enough" would not have caught the sixteen.
 */
const revSlug = (title) =>
  title
    .replace(/^Unit\s+\d+\s*·\s*/, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const stale = [];
let reviews = 0;
for (const unit of UNITS) {
  for (const lesson of unit.lessons) {
    if (lesson.kind !== 'review') continue;
    reviews++;
    const want = `rev-${revSlug(unit.title)}`;
    if (lesson.id !== want) {
      stale.push(`${unit.id} review id is "${lesson.id}", but "${unit.title}" slugs to "${want}"`);
    }
  }
}

console.log(
  `check:unit-names — ${checked} topics across ${UNITS.length} units, on both tracks; ${reviews} review ids.`
);

if (gaps.length) {
  console.error(`\n${gaps.length} topic(s) a learner cannot see from the unit header:`);
  for (const g of gaps.slice(0, 25)) console.error(`  ${g}`);
  if (gaps.length > 25) console.error(`  … and ${gaps.length - 25} more`);
  console.error(
    `\nName it in the unit's title or subtitle. The header is the only place that says what the unit is for.`
  );
}

if (stale.length) {
  console.error(`\n${stale.length} review id(s) that no longer say which unit they close:`);
  for (const s of stale) console.error(`  ${s}`);
  console.error(`\nRename the id to match the unit. Nothing resolves a unit through it, so nothing breaks.`);
}

if (gaps.length || stale.length) process.exit(1);

console.log('  Every topic a unit teaches is named by the unit that holds it, and every review id is its unit.');
