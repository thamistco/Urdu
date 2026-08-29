/**
 * Is each clip the recording the course actually asked for?
 *
 * `check:voice` proves every clip can be *heard* — it measures length and peak
 * dB, and it proves the set is complete and committed. It has no opinion about
 * what is on the recording. A clip can be 1.5 seconds at −3 dB, present in the
 * manifest, tracked by git, and be the wrong voice saying the wrong thing;
 * every check in this repo would call that healthy. That is the gap this fills,
 * for the two failures that can be proven from what is already on disk.
 *
 * Both come out of the generator's own ledger — the `spoken.json` beside each
 * voice's clips — which records the text, the voice and the pace asked for,
 * written so a *changed* word regenerates. Nothing until now read it back to
 * ask whether the request was honoured, or whether the request made sense.
 *
 * ## 1. The clip is in a different voice from the rest of the course
 *
 * `generate-voice.js` records `actual` when the voice it asked for is not the
 * voice it got, and then nothing looks at it. Measured on the shipped set: 8
 * clips across the two voices came back on `ur-IN-Wavenet-*` instead of the
 * `Chirp3-HD` narrator every other clip uses, including ہاں ("yes") — a
 * first-lesson word — in *both* voices. The two sets disagree about which
 * clips fell back, so this is retry flakiness rather than anything about the
 * text: a rerun would very likely land on a different eight.
 *
 * A learner hears the narrator change mid-lesson for one word. It is exact,
 * needs no threshold, and is the kind of thing that is invisible in review and
 * obvious in the hand.
 *
 * ## 2. The course asked for a sound the letter does not have
 *
 * Letter clips are synthesised from the bare glyph (`ب` → "be"), which is
 * right for 38 of the 40 letters and impossible for the other two. `ھ`
 * (do chashmī he) and `ں` (noon ghunna) have no standalone pronunciation at
 * all — they modify the letter or vowel *before* them, which is exactly what
 * URD-071 taught the corpus to say out loud in `functionNote`. Handed a bare
 * `ھ`, Google's TTS refused the narrator voice, fell back to Wavenet, and
 * produced 3.12 seconds against a 1.13s median for letter clips — 3.17x its
 * own twin in the other voice, the single largest such gap in the corpus and
 * nearly double the next one.
 *
 * So the rule is read off the corpus rather than a hardcoded pair: a letter
 * carrying a `functionNote` is one the course itself describes as silent on
 * its own, and asking a speech engine to pronounce it in isolation is asking
 * for something that does not exist. If a future letter gains a
 * `functionNote`, this catches it without being edited.
 *
 * ## What this deliberately does not gate on
 *
 * The obvious third signal — the same text read by two voices should take
 * roughly the same time, so a big gap means one of them is wrong — was
 * measured across all 2,748 twinned clips and is too blunt to gate:
 *
 *     p50 1.16x · p90 1.40x · p95 1.50x · p99 1.64x · p99.5 1.71x · max 3.17x
 *
 * `do-chashmi-he` (3.17x) stands right out, but the next dozen — 1.7x to
 * 2.1x — are ordinary words where one voice simply reads slower, and a
 * threshold low enough to catch a real defect in that band would fail on
 * them. Setting it just under 3.17 instead would only ever re-find the clip
 * that motivated it, which is a check that cannot fail. So the ratio is
 * *reported*, ranked, as the shortlist worth transcribing when the
 * speech-to-text pass runs — not asserted.
 *
 * Durations come from file size at a fixed bitrate, the same approximation
 * `scripts/lib/audio.js` falls back to without ffmpeg. Absolute seconds are
 * approximate; the ratio between two clips of identical encoding is not.
 *
 * Run with:  npm run check:voice-fidelity
 */

const fs = require('fs');
const path = require('path');
const { BYTES_PER_SECOND } = require('./lib/audio');
const { load } = require('./lib/load-ts');

const ROOT = path.join(__dirname, '..');
const SETS = [
  { name: 'female', dir: path.join(ROOT, 'assets', 'voice') },
  { name: 'male', dir: path.join(ROOT, 'assets', 'voice-m') },
];
/** How many ranked duration outliers to print. Not a threshold — a page size. */
const SHORTLIST = 12;

function readLedger(dir) {
  const file = path.join(dir, 'spoken.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Approximate seconds, from file size at the encoder's fixed bitrate. */
function seconds(dir, id) {
  try {
    return fs.statSync(path.join(dir, `${id}.mp3`)).size / BYTES_PER_SECOND;
  } catch {
    return null;
  }
}

/** Clips whose TTS answered in a different voice than the course asked for. */
function wrongVoice(ledger, setName) {
  return Object.entries(ledger)
    .filter(([, v]) => v.actual && v.actual !== v.voice)
    .map(
      ([id, v]) =>
        `${id} (${setName}): asked for ${v.voice}, recorded ${v.actual} — ` +
        `"${v.text}" is spoken by a different voice than the rest of the course`
    );
}

/**
 * Letters the course itself calls silent, recorded from the bare glyph.
 * `functionNote` (URD-071) is set exactly on the letters whose note describes
 * them modifying a neighbour rather than carrying a sound of their own.
 */
function unspeakableLetters(ledger, setName, letters) {
  const problems = [];
  for (const letter of letters) {
    if (!letter.functionNote) continue;
    const entry = ledger[letter.id];
    if (!entry || entry.text !== letter.forms.isolated) continue;
    problems.push(
      `${letter.id} (${setName}): recorded from the bare glyph "${entry.text}", but ${letter.name} ` +
        `has no standalone pronunciation — its own note says so. Record its name instead.`
    );
  }
  return problems;
}

/** The same text in two voices, ranked by how far apart the recordings are. */
function durationOutliers(ledger) {
  const rows = [];
  for (const id of Object.keys(ledger)) {
    const a = seconds(SETS[0].dir, id);
    const b = seconds(SETS[1].dir, id);
    if (!a || !b) continue;
    rows.push({ id, a, b, ratio: Math.max(a, b) / Math.min(a, b), text: ledger[id].text });
  }
  return rows.sort((x, y) => y.ratio - x.ratio);
}

const letters = load('src/data/letters.ts').LETTERS;
const problems = [];
let compared = 0;

for (const set of SETS) {
  const ledger = readLedger(set.dir);
  if (!ledger) {
    console.log(`No ${set.name} ledger (${path.relative(ROOT, set.dir)}/spoken.json) — nothing to check.`);
    continue;
  }
  compared += Object.keys(ledger).length;
  problems.push(...wrongVoice(ledger, set.name), ...unspeakableLetters(ledger, set.name, letters));
}

if (!compared) process.exit(0);

const ranked = durationOutliers(readLedger(SETS[0].dir) ?? {});
console.log(`check:voice-fidelity — ${compared} ledger entries read across ${SETS.length} voices.`);

if (ranked.length) {
  console.log(`\nWidest gap between the two voices reading the same text (not a failure — the`);
  console.log(`shortlist worth transcribing first; see this file's header for why it cannot gate):`);
  for (const r of ranked.slice(0, SHORTLIST))
    console.log(`  ${r.ratio.toFixed(2)}x  ${r.id.padEnd(18)} ${r.a.toFixed(2)}s / ${r.b.toFixed(2)}s  "${r.text}"`);
}

if (problems.length) {
  console.log(`\n${problems.length} clip${problems.length === 1 ? '' : 's'} not what the course asked for:\n`);
  for (const p of problems.sort()) console.log('  •', p);
  console.log('\nRegenerate these with `npm run gen:voice` (a key set, `--force` for the ids above).');
  process.exit(1);
}

console.log('every clip is the voice and the text the course asked for');
