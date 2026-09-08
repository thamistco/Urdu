/* eslint-disable */
/**
 * Every number the store copy claims, counted from the content instead.
 *
 * `docs/store-listing.md` opens by promising exactly this: "Every number here
 * is counted from the data by `npm run audit`, not estimated. If the content
 * changes, these change with it." Nothing enforced it, so it did not happen.
 * By the time anyone looked, the listing claimed 237 lessons across 39 units
 * and `app.json` claimed 608, while the course held 350 across 41. The
 * in-app welcome screen was right the whole time, because it counts
 * `ALL_LESSONS.length` at runtime rather than repeating a number a person
 * typed.
 *
 * `app.json`'s description is the urgent one. It is not just store copy: it is
 * read by `app.config.js` and written into the deployed page's meta
 * description by `scripts/inject-web-meta.js`, so a wrong number there is
 * being served to everyone who finds the site, right now, and is what a search
 * result shows.
 *
 * ## What is checked, and what is deliberately not
 *
 * Only `<number> <noun>` pairs whose noun is in `CLAIMS` below. Everything
 * else in the prose is left alone, which is what keeps this precise: the store
 * listing also discusses twelve-character launcher labels, 100-character
 * keyword fields and 160 letter shapes, and a check that argued about those
 * would be a check somebody turns off.
 *
 * This holds the copy to the content, not the other way round. If a number
 * here fails, the content is right and the sentence is stale.
 *
 * Run with:  npm run check:claims
 */

const fs = require('fs');
const path = require('path');
const { load } = require('./lib/load-ts');

const ROOT = path.join(__dirname, '..');

const { WORDS, TOPICS } = load('src/data/words.ts');
const { LETTERS } = load('src/data/letters.ts');
const { GRAMMAR } = load('src/data/grammar.ts');
const { SENTENCES, PASSAGES, DIALOGUES } = load('src/data/sentences.ts');
const { ALL_LESSONS, UNITS } = load('src/data/units.ts');

const clips = fs.existsSync(path.join(ROOT, 'assets', 'voice'))
  ? fs.readdirSync(path.join(ROOT, 'assets', 'voice')).filter((f) => f.endsWith('.mp3')).length
  : null;

/**
 * Noun a learner might read → what the content actually holds.
 *
 * Several spellings per count, because the copy says "conversations" in one
 * field and "dialogues" in another and both are the same twelve things.
 */
const CLAIMS = {
  letters: LETTERS.length,
  words: WORDS.length,
  topics: TOPICS.length,
  grammar: GRAMMAR.length,
  sentences: SENTENCES.length,
  passages: PASSAGES.length,
  conversations: DIALOGUES.length,
  dialogues: DIALOGUES.length,
  lessons: ALL_LESSONS.length,
  units: UNITS.length,
  ...(clips === null ? {} : { clips }),
};

/** Where the copy that ships lives. */
const SOURCES = [
  ['app.json', JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo.description || ''],
  ['docs/store-listing.md', fs.readFileSync(path.join(ROOT, 'docs', 'store-listing.md'), 'utf8')],
];

// "2,281 words", "17 reading passages", "25 grammar ideas": a number, then up
// to two describing words, then the noun that says what was counted.
const NOUNS = Object.keys(CLAIMS).join('|');
const CLAIM_RE = new RegExp(String.raw`(\d[\d,]*)\s+(?:[A-Za-z]+\s+){0,2}?(${NOUNS})\b`, 'gi');

const findings = [];
for (const [where, text] of SOURCES) {
  for (const m of text.matchAll(CLAIM_RE)) {
    const claimed = Number(m[1].replace(/,/g, ''));
    const noun = m[2].toLowerCase();
    const real = CLAIMS[noun];
    if (claimed !== real) {
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ where, line, said: m[0].trim(), noun, claimed, real });
    }
  }
}

if (!findings.length) {
  const n = Object.entries(CLAIMS)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
  console.log(`check:claims — every number the store copy claims matches the content: ${n}.`);
  process.exit(0);
}

console.error(`check:claims — ${findings.length} claim(s) the content does not support:\n`);
for (const f of findings) {
  console.error(`  ${f.where}:${f.line}  says “${f.said}” — there are ${f.real}`);
}
console.error(
  `\n  These numbers are counted from the content, so the content is right and the\n` +
    `  sentence is stale. \`npm run audit\` prints the same counts.`
);
process.exit(1);
