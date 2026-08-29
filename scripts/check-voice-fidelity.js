/**
 * Is each clip the recording the course asked for?
 *
 * `check:voice` proves every clip can be *heard* — it measures length and peak
 * dB, and proves the set is complete and committed. It has no opinion about
 * what is on the recording. A clip can be 1.5 seconds at −3 dB, in the
 * manifest, tracked by git, and be the wrong voice saying an outdated word;
 * every other check in this repo calls that healthy.
 *
 * This is the other half, for everything provable without listening. It reads
 * the generator's own ledger — the `spoken.json` beside each voice's clips,
 * which records the text, voice and pace every clip was asked for — and holds
 * it against the corpus as it stands today. The ledger was written so a
 * *changed* word regenerates; nothing until now read it back to ask whether
 * the request was honoured, or whether the request made sense in the first
 * place.
 *
 * Seven rules, below, each exact and each with no threshold to tune. Two found
 * real defects in the shipped set on the day they were written; the other five
 * were green on arrival and are here so they stay that way — the corpus grows
 * by hand, and every one of them is a mistake a future edit can make silently.
 * Every rule was broken on purpose and watched to fail before being trusted
 * (this project's non-negotiable #2), including the five that had nothing to
 * report.
 *
 * ## What this cannot do
 *
 * It never hears the audio. It proves the course asked for the right thing, in
 * the right voice, and that nothing has drifted since — not that the engine
 * rendered it correctly. A clip that says the wrong word in the right voice
 * passes every rule here. That is `check:pronunciation`'s job (speech-to-text,
 * needs an API key); this runs everywhere, offline, in under a second.
 *
 * ## The signal deliberately not gated on
 *
 * The same text read by two voices should take roughly the same time, so a
 * wide gap suggests one is wrong. Measured across all 2,748 twinned clips:
 *
 *     p50 1.16x · p90 1.40x · p95 1.50x · p99 1.64x · p99.5 1.71x · max 3.17x
 *
 * `do-chashmi-he` (3.17x) stands right out, but the next dozen — 1.7x to 2.1x
 * — are ordinary words where one voice simply reads slower, and a threshold
 * low enough to catch a real defect in that band would fail on them. Setting
 * it just under 3.17 would only ever re-find the clip that motivated it, which
 * is a check that cannot fail. So the ratio is *reported*, ranked, as the
 * shortlist worth transcribing first — not asserted.
 *
 * Durations come from file size at the encoder's fixed bitrate, the same
 * approximation `scripts/lib/audio.js` falls back to without ffmpeg. Absolute
 * seconds are approximate; the ratio between two clips of identical encoding
 * is not.
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
/**
 * Urdu/Arabic script and whitespace, plus the full stop the corpus's own
 * sentence and dialogue lines use. Written as escapes rather than literal
 * characters: the Presentation Forms-B range ends at U+FEFF, and pasting that
 * literally puts an invisible zero-width no-break space in the source, which
 * `no-irregular-whitespace` rightly rejects.
 */
const SPEAKABLE_SCRIPT = /^[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s.]+$/;

/**
 * What the course would ask the generator to say today.
 *
 * Deliberately mirrors `collectItems()` in `generate-voice.js` rather than
 * importing it — that function is not exported, and a copy that drifts is
 * exactly what rule 3 exists to catch, so a drift here shows up as a false
 * `stale` rather than as silence.
 */
function corpusWants() {
  const { WORDS, PHRASES } = load('src/data/words.ts');
  const { LETTERS } = load('src/data/letters.ts');
  const { SENTENCES, PASSAGES, DIALOGUES } = load('src/data/sentences.ts');
  const want = new Map();
  const add = (id, text) => {
    if (id && text && !want.has(id)) want.set(id, text);
  };
  for (const w of WORDS) add(w.id, w.pronounce || w.urdu);
  for (const p of PHRASES) add(p.id, p.pronounce || p.urdu);
  for (const s of SENTENCES) add(s.id, s.pronounce || s.words.join(' '));
  for (const p of PASSAGES) p.lines.forEach((l, i) => add(`${p.id}-${i}`, l.urdu));
  for (const d of DIALOGUES) d.lines.forEach((l, i) => add(`${d.id}-${i}`, l.urdu));
  for (const l of LETTERS) add(l.id, l.pronounce || l.forms?.isolated);
  return want;
}

/** 1. The clip came back in a different voice than the course asked for. */
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
 * 2. A letter the course itself calls silent, recorded from its bare glyph.
 * `functionNote` (URD-071) is set exactly on the letters whose note describes
 * them modifying a neighbour rather than carrying a sound of their own, so a
 * future silent letter is caught without this rule being edited.
 */
function unspeakableLetter(ledger, setName, letters) {
  const out = [];
  for (const l of letters) {
    if (!l.functionNote) continue;
    if (ledger[l.id]?.text !== l.forms.isolated) continue;
    out.push(
      `${l.id} (${setName}): recorded from the bare glyph "${l.forms.isolated}", but ${l.name} has no ` +
        `standalone pronunciation — its own note says so. Give it a \`pronounce\` and regenerate.`
    );
  }
  return out;
}

/** 3. The corpus changed after the clip was made, so the audio is out of date. */
function stale(ledger, setName, want) {
  const out = [];
  for (const [id, text] of want) {
    const was = ledger[id];
    if (was && was.text !== text)
      out.push(`${id} (${setName}): recorded "${was.text}", the course now says "${text}" — the clip is out of date`);
  }
  return out;
}

/** 4. A speakable item the generator has never been asked to record. */
function missing(ledger, setName, want) {
  return [...want.keys()]
    .filter((id) => !ledger[id])
    .map((id) => `${id} (${setName}): the course speaks this but the ledger has no record of recording it`);
}

/** 5. TTS input that is not Urdu — a stray Latin word or digit an Urdu voice cannot read. */
function notUrdu(ledger, setName) {
  return Object.entries(ledger)
    .filter(([, v]) => !SPEAKABLE_SCRIPT.test(v.text))
    .map(([id, v]) => `${id} (${setName}): "${v.text}" is not all Urdu script — an Urdu voice cannot read it`);
}

/**
 * 6. The two voices were given different words for the same id.
 *
 * They are generated in separate runs against the corpus at whatever state it
 * was in, so an edit between the two runs leaves one voice saying the old word
 * and the other the new one — and a learner who switches voices mid-course is
 * the only one who would ever notice.
 */
function divergent(ledgers) {
  const [a, b] = ledgers;
  if (!a.ledger || !b.ledger) return [];
  return Object.keys(a.ledger)
    .filter((id) => b.ledger[id] && b.ledger[id].text !== a.ledger[id].text)
    .map(
      (id) =>
        `${id}: the two voices were recorded saying different things — ` +
        `${a.name} "${a.ledger[id].text}" vs ${b.name} "${b.ledger[id].text}"`
    );
}

/**
 * 7. Two entries whose spoken form is identical but whose Roman differs.
 *
 * Unvowelled Urdu is ambiguous — سر is both "sar" (head) and "sur" (a musical
 * note) — so a single recording cannot be right for both readings. `pronounce`
 * exists to break exactly this tie with an explicit diacritic-marked reading;
 * this is what notices when a newly added word creates a collision and nobody
 * reached for it.
 */
function ambiguousSpelling(words) {
  const bySpoken = new Map();
  for (const w of words) {
    const t = w.pronounce || w.urdu;
    if (!t) continue;
    if (!bySpoken.has(t)) bySpoken.set(t, []);
    bySpoken.get(t).push(w);
  }
  const out = [];
  for (const [text, ws] of bySpoken) {
    const romans = new Set(ws.map((w) => (w.roman || '').toLowerCase()).filter(Boolean));
    if (romans.size < 2) continue;
    out.push(
      `"${text}" is recorded once but read ${romans.size} ways (${[...romans].join(', ')}) — ` +
        `${ws.map((w) => w.id).join(', ')} need a \`pronounce\` to tell them apart`
    );
  }
  return out;
}

/** Approximate seconds, from file size at the encoder's fixed bitrate. */
function seconds(dir, id) {
  try {
    return fs.statSync(path.join(dir, `${id}.mp3`)).size / BYTES_PER_SECOND;
  } catch {
    return null;
  }
}

/** The same text in two voices, ranked by how far apart the recordings are. */
function durationOutliers(ledger) {
  const rows = [];
  for (const id of Object.keys(ledger)) {
    const a = seconds(SETS[0].dir, id);
    const b = seconds(SETS[1].dir, id);
    if (a && b) rows.push({ id, a, b, ratio: Math.max(a, b) / Math.min(a, b), text: ledger[id].text });
  }
  return rows.sort((x, y) => y.ratio - x.ratio);
}

function readLedger(dir) {
  const file = path.join(dir, 'spoken.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

// ---------------------------------------------------------------- the run
const want = corpusWants();
const { LETTERS } = load('src/data/letters.ts');
const { WORDS, PHRASES } = load('src/data/words.ts');
const loaded = SETS.map((s) => ({ ...s, ledger: readLedger(s.dir) }));
const present = loaded.filter((s) => s.ledger);

if (!present.length) {
  console.log('No voice ledger on disk — nothing to check.');
  process.exit(0);
}

const problems = [];
for (const { name, ledger } of present) {
  problems.push(
    ...wrongVoice(ledger, name),
    ...unspeakableLetter(ledger, name, LETTERS),
    ...stale(ledger, name, want),
    ...missing(ledger, name, want),
    ...notUrdu(ledger, name)
  );
}
problems.push(...divergent(loaded), ...ambiguousSpelling([...WORDS, ...PHRASES]));

const orphans = present[0] ? Object.keys(present[0].ledger).filter((id) => !want.has(id)) : [];
console.log(
  `check:voice-fidelity — ${want.size} speakable items against ${present.length} voice ledger(s)` +
    (orphans.length ? `, ${orphans.length} ledger entries left over from removed content` : '')
);

const ranked = durationOutliers(present[0].ledger);
if (ranked.length) {
  console.log('\nWidest gap between the two voices reading the same text — not a failure, the');
  console.log("shortlist worth transcribing first (see this file's header for why it cannot gate):");
  for (const r of ranked.slice(0, SHORTLIST))
    console.log(`  ${r.ratio.toFixed(2)}x  ${r.id.padEnd(18)} ${r.a.toFixed(2)}s / ${r.b.toFixed(2)}s  "${r.text}"`);
}

if (problems.length) {
  console.log(`\n${problems.length} clip${problems.length === 1 ? '' : 's'} not what the course asked for:\n`);
  for (const p of problems.sort()) console.log('  •', p);
  console.log('\nRegenerate with `npm run gen:voice` (a key set); a changed word goes stale on its own.');
  process.exit(1);
}

console.log('every clip is the voice and the text the course asks for today');
