/* eslint-disable */
/**
 * One consistent, natural pronunciation clip per word, phrase and letter.
 *
 * Without this the app falls back to the device's own text-to-speech, which
 * differs on every phone and is missing entirely on many — so two learners hear
 * two different Urdu, or none. Generating the clips once and bundling them
 * means everyone who installs the app hears the same voice, offline, with no
 * API key in the build and nothing to pay per play.
 *
 * Needs open internet and a TTS API key, so it runs on your machine or in
 * GitHub Actions — never inside the sandboxed session.
 *
 * Providers (chosen by whichever env var is set):
 *   GOOGLE_TTS_API_KEY   → Google Cloud Text-to-Speech.
 *                          Optional VOICE_NAME (default ur-IN-Chirp3-HD-Zephyr)
 *                          and LANG_CODE (default ur-IN).
 *   ELEVENLABS_API_KEY   → ElevenLabs (+ ELEVENLABS_VOICE_ID, multilingual v2).
 *
 * No key set → prints a notice and exits 0, so the build still works.
 *
 *   node scripts/generate-voice.js            generate anything not done yet
 *   node scripts/generate-voice.js --force    regenerate everything
 *   node scripts/generate-voice.js --voices   list the Urdu voices your key can use
 *   node scripts/generate-voice.js --audition record a sample line in every candidate
 *                                            voice, to choose a narrator by ear
 *   node scripts/generate-voice.js --manifest rebuild the manifest from disk only
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { bufferProblem, ffmpegAvailable, BYTES_PER_SECOND } = require('./lib/audio');

const ROOT = path.join(__dirname, '..');
/**
 * Which recorded voice this run produces.
 *
 * `f` is the original narrator and lives in `assets/voice/`, where every clip
 * and every `require` in the manifest already points. `m` is the second set,
 * generated into `assets/voice-m/`, so a learner can pick the voice they would
 * rather be taught by — several languages read very differently in a male and
 * a female voice, and being able to choose is the difference between audio you
 * listen to and audio you skip.
 *
 * Each set carries its own ledger, because they are generated independently and
 * a word changed in one is not automatically stale in the other.
 *
 *   VOICE_SET=m npm run gen:voice
 */
const VOICE_SET = process.env.VOICE_SET === 'm' ? 'm' : 'f';
const SET_DIR = { f: 'voice', m: 'voice-m' };
const OUT_DIR = path.join(ROOT, 'assets', SET_DIR[VOICE_SET]);
/** The other voice's directory: its clip for the same id speaks identical text. */
const TWIN_DIR = path.join(ROOT, 'assets', SET_DIR[VOICE_SET === 'm' ? 'f' : 'm']);
const MANIFEST = path.join(ROOT, 'src', 'lib', 'voiceManifest.ts');

/**
 * What each clip on disk was actually asked to say, and who said it.
 *
 * Generating is keyed by id and skips anything already on disk, which is what
 * makes adding words cheap — but it also meant that *changing* a word could
 * never reach the audio. Giving کہنی the diacritics that stop the voice saying
 * "kehni" left `w-kohni.mp3` sitting there still saying "kehni", and nothing
 * anywhere would have noticed.
 *
 * So the request is recorded next to the clips. A clip whose recorded text,
 * voice or pace no longer matches the course is stale and regenerates on the
 * next run, without anyone having to remember what they touched. The voice half
 * matters as much as the text: giving a dialogue's two speakers different voices
 * changes nothing about the words, so text alone would have called every one
 * of those clips up to date.
 *
 * Pace is recorded for the same reason and was very nearly left out. Changing
 * how fast a line is read changes the recording and not a character of the text,
 * so a ledger without it would have reported every clip up to date while the
 * course asked for a delivery none of them had — the identical failure to the
 * کہنی one this ledger exists to prevent, one field along.
 */
const LEDGER = path.join(OUT_DIR, 'spoken.json');

/** Older ledgers stored a bare string; every one of those clips was Zephyr. */
const FIRST_VOICE = 'ur-IN-Chirp3-HD-Zephyr';
/**
 * Everything recorded before pace was tracked was generated at one flat rate, so
 * that is what a missing `pace` means. Reading it as "unknown" instead would
 * mark all 5,786 clips stale and regenerate the entire course to change a few
 * hundred of them.
 */
const LEGACY_PACE = 0.92;
const entryOf = (v) => (typeof v === 'string' ? { text: v, voice: FIRST_VOICE } : v);

/**
 * How long the other voice takes over the same words, or 0 if it has no clip
 * yet. At a constant 32 kbps the file size is the duration, so this costs a
 * stat rather than a decode.
 */
function twinSeconds(id) {
  try {
    return fs.statSync(path.join(TWIN_DIR, `${id}.mp3`)).size / BYTES_PER_SECOND;
  } catch {
    return 0;
  }
}

const readLedger = () => {
  try {
    const raw = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, entryOf(v)]));
  } catch {
    return {};
  }
};
const writeLedger = (l) => fs.writeFileSync(LEDGER, JSON.stringify(l, null, 0) + '\n');

// ---- load the real content modules --------------------------------------
/**
 * The previous version scraped `words.ts` with a regular expression, which
 * silently found 376 of the 2,056 items: the other 1,652 words live in
 * `data/vocab/` and are re-exported. Transpiling the modules and reading their
 * exports is the only way to be sure the clip set matches the course.
 */
const cache = new Map();
function load(rel) {
  const resolved = [rel, rel + '.ts', path.join(rel, 'index.ts')]
    .map((p) => path.join(ROOT, p))
    .find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!resolved) throw new Error(`cannot resolve ${rel}`);
  if (cache.has(resolved)) return cache.get(resolved);
  const js = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(resolved, mod.exports);
  const here = path.relative(ROOT, path.dirname(resolved));
  new Function('exports', 'module', 'require', js)(mod.exports, mod, (id) =>
    id.startsWith('.') ? load(path.join(here, id)) : require(id)
  );
  cache.set(resolved, mod.exports);
  return mod.exports;
}

/**
 * The cast.
 *
 * `narrator` reads the course — every word, phrase, sentence and letter — and
 * is the voice the app has always had. The other three exist only so that a
 * conversation sounds like more than one person: a speaker takes the primary
 * voice of their gender, and a second speaker of the *same* gender takes the
 * understudy rather than the same voice twice, which is the case (Ahmed and
 * Bilal; Nadia and Rabia) that a naive male/female split would still get wrong.
 *
 * All Chirp3-HD in ur-IN, so they sit together tonally.
 *
 * ## Why the male voices changed
 *
 * They were Puck and Fenrir, and the male narrator was reported as robotic.
 * That was a casting mistake rather than a synthesis problem. Google publishes a
 * character for every Chirp3-HD voice, and those two are **Upbeat** and
 * **Excitable** — performance registers, bright and declamatory. On connected
 * speech that merely sounds energetic; on two thousand isolated vocabulary words
 * it is an announcer reading a list, which is exactly what "robotic" describes.
 * Nothing about the model was wrong. It was doing an unwarm voice accurately.
 *
 * The replacements are chosen for the opposite quality: **Achird is
 * "Friendly"** and **Algieba is "Smooth"** — conversational registers, which is
 * what warmth actually is. Enceladus ("Breathy") and Umbriel ("Easy-going") are
 * the next candidates if these still read as flat.
 *
 * The female side is left alone: nobody complained about it, and changing it
 * would mean regenerating and re-listening to another two and a half thousand
 * clips to fix something that is not broken.
 */
const CAST = {
  // The narrator for whichever set is being generated. The dialogue cast below
  // is unchanged: a two-speaker conversation needs two distinguishable voices
  // whichever narrator the learner picked, or it stops being a conversation.
  narrator: process.env.VOICE_NAME || (VOICE_SET === 'm' ? 'ur-IN-Chirp3-HD-Achird' : FIRST_VOICE),
  f: ['ur-IN-Chirp3-HD-Zephyr', 'ur-IN-Chirp3-HD-Kore'],
  m: ['ur-IN-Chirp3-HD-Achird', 'ur-IN-Chirp3-HD-Algieba'],
};

/**
 * Where to turn when Chirp3-HD will not say a word at all.
 *
 * The near-silent responses are not evenly spread: measured over repeated
 * attempts, ہاں and ں came back silent 8 times out of 8 and کیا 5 times out of 8,
 * while every Chirp3-HD voice — Zephyr, Kore, Leda — failed on all three. The
 * model simply does not handle one- to three-character Urdu input. The older
 * Wavenet voices produce all three cleanly, every time.
 *
 * So a clip that stays silent falls back to the Wavenet voice of the same
 * gender. It is a slightly different timbre on a handful of very short items —
 * eight letters and a few words — which is a far smaller cost than a course
 * whose alphabet cards play nothing.
 */
const FALLBACK_VOICE = {
  'ur-IN-Chirp3-HD-Zephyr': 'ur-IN-Wavenet-A',
  'ur-IN-Chirp3-HD-Kore': 'ur-IN-Wavenet-A',
  'ur-IN-Chirp3-HD-Achird': 'ur-IN-Wavenet-B',
  'ur-IN-Chirp3-HD-Algieba': 'ur-IN-Wavenet-B',
};

/**
 * How fast a thing is said, and why there are two answers.
 *
 * Everything used to be generated at 0.92 — a shade under natural pace, on the
 * reasoning that these are words being learned rather than speech being listened
 * to. That is right for a word standing on its own and wrong for everything
 * longer, and it is the second reason the voice sounded mechanical.
 *
 * Prosody is what makes a voice sound human: the rise and fall across a clause,
 * where the stress lands, where a speaker breathes. It exists only in connected
 * speech, and slowing connected speech flattens it — the sentence stops being
 * spoken and starts being dictated. Sentences, phrases, passages and dialogue
 * lines therefore run at natural pace, where the model has room to perform them;
 * single words and letters keep the deliberate reading a learner needs.
 *
 * The split is by *kind*, decided in `collectItems` where the kind is known. A
 * first attempt keyed it off text length instead, which the content disproves:
 * words run up to 24 characters and sentences start at 10, so no threshold
 * separates them — the length rule would have caught 83 of the 427 connected
 * items and left every short sentence dictated.
 */
const PACE = { citation: 0.92, connected: 1.0 };

/** Which voice a dialogue's speaker gets, given who else is in the scene. */
function castFor(dialogue, speaker) {
  const gender = dialogue.voices[speaker];
  const other = speaker === 'A' ? 'B' : 'A';
  const understudy = dialogue.voices[other] === gender && speaker === 'B';
  return CAST[gender][understudy ? 1 : 0];
}

function collectItems() {
  const { WORDS, PHRASES } = load('src/data/words.ts');
  const { LETTERS } = load('src/data/letters.ts');
  const { SENTENCES, PASSAGES, DIALOGUES } = load('src/data/sentences.ts');
  const items = [];
  const seen = new Set();
  const add = (id, text, voice = CAST.narrator, pace = PACE.citation) => {
    if (!id || !text || seen.has(id)) return;
    seen.add(id);
    items.push({ id, text, voice, pace });
  };
  // `pronounce`, when a word carries one, is a diacritic-marked reading for
  // a script that collides with another word in the course (سر head vs سر
  // musical note, and the like) — the audio should say that, not the bare
  // spelling the TTS engine would otherwise have to guess at.
  for (const w of WORDS) add(w.id, w.pronounce || w.urdu);
  for (const p of PHRASES) add(p.id, p.pronounce || p.urdu, CAST.narrator, PACE.connected);
  // Sentence-building and reading content is spoken too, one clip per full
  // sentence and per passage/dialogue line. Passage and dialogue lines have
  // no id of their own in the data, so the exercises and this script both
  // derive one the same way — from the line's position — rather than
  // requiring the data to carry an id nothing else needs.
  for (const s of SENTENCES) add(s.id, s.pronounce || s.words.join(' '), CAST.narrator, PACE.connected);
  for (const p of PASSAGES) p.lines.forEach((l, i) => add(`${p.id}-${i}`, l.urdu, CAST.narrator, PACE.connected));
  for (const d of DIALOGUES)
    d.lines.forEach((l, i) => add(`${d.id}-${i}`, l.urdu, castFor(d, l.speaker), PACE.connected));
  // Letters are announced by id too, when a traced letter is accepted. Two of
  // them carry `pronounce` for the same reason a word does: `ھ` and `ں` are
  // silent on their own, so the isolated glyph is not something a voice can
  // read — see that field's own comment in `letters.ts`, and
  // `check:voice-fidelity`, which is what found the clips it produced.
  for (const l of LETTERS) add(l.id, l.pronounce || l.forms?.isolated || l.glyph || l.forms?.initial);
  return items;
}

// ---- providers ----------------------------------------------------------
const LANG = process.env.LANG_CODE || 'ur-IN';

async function googleTTS(text, name, pace = PACE.citation) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: LANG, name },
      audioConfig: { audioEncoding: 'MP3', speakingRate: pace },
    }),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return Buffer.from(json.audioContent, 'base64');
}

/** Every voice this run could ask for, including the fallbacks. */
function voicesUsedBy(items) {
  const names = new Set(items.map((i) => i.voice));
  for (const n of [...names]) if (FALLBACK_VOICE[n]) names.add(FALLBACK_VOICE[n]);
  return [...names].sort();
}

/**
 * Fail before the run, not four hundred clips into it.
 *
 * Voice names are strings in a config object, and a wrong one is not caught by
 * anything until the API rejects it — by which time a long, paid, half-finished
 * run has already happened. Recasting the male narrator is exactly the change
 * that makes that likely, and it is the change most likely to be made by someone
 * choosing a voice from a documentation page without checking it exists in
 * `ur-IN`.
 *
 * So the cast is checked against what the key can actually see, up front, and a
 * bad name prints the real list rather than a 400 from inside the loop.
 */
async function assertVoicesExist(items) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${key}`);
  if (!res.ok) {
    console.error(`Could not check the voice list — ${res.status}: ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  const { voices = [] } = await res.json();
  const available = new Set(voices.map((v) => v.name));
  const wanted = voicesUsedBy(items);
  const missing = wanted.filter((n) => !available.has(n));
  if (!missing.length) {
    console.log(`Cast checked against the API: ${wanted.join(', ')}\n`);
    return;
  }
  console.error(`These voices are not available to this key:\n  ${missing.join('\n  ')}\n`);
  const urdu = voices
    .filter((v) => (v.languageCodes || []).some((c) => c.startsWith('ur')))
    .map((v) => `  ${v.name.padEnd(30)} ${v.ssmlGender}`);
  console.error(urdu.length ? `Urdu voices this key can use:\n${urdu.join('\n')}` : 'This key sees no Urdu voices.');
  process.exit(1);
}

/**
 * Record the same two lines in every candidate voice, so a narrator can be
 * chosen by ear instead of from adjectives.
 *
 * "Warm", "kind" and "robotic" are judgements about how something *sounds*, and
 * the only evidence that settles them is listening. Google's published character
 * words ("Upbeat", "Friendly", "Smooth") are a reasonable place to start and
 * they are not the same thing as hearing the voice say Urdu — the current recast
 * away from Puck was argued entirely from those adjectives, which is the best
 * anyone can do without ears on the audio.
 *
 * So this writes one short sample per voice into `assets/voice-audition/`,
 * ignored by git and required by nothing. Play them, pick one, set it:
 *
 *   npm run gen:voice -- --audition
 *   VOICE_SET=m VOICE_NAME=ur-IN-Chirp3-HD-Umbriel npm run gen:voice
 *
 * Two lines rather than one, and deliberately not a single word: a word cannot
 * show you warmth, because warmth lives in the contour across a phrase. The
 * second line is a full sentence at connected pace for exactly that reason.
 */
const AUDITION = [
  { id: 'word', text: 'خدا حافظ', pace: PACE.citation },
  { id: 'line', text: 'میں آپ سے مل کر بہت خوش ہوا۔', pace: PACE.connected },
];

async function auditionVoices(gender) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) {
    console.log('Set GOOGLE_TTS_API_KEY to record auditions.');
    process.exit(1);
  }
  const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${key}`);
  if (!res.ok) {
    console.error(`Could not list voices — ${res.status}: ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  const { voices = [] } = await res.json();
  const want = (gender || '').toUpperCase();
  const urdu = voices
    .filter((v) => (v.languageCodes || []).some((c) => c.startsWith('ur')))
    .filter((v) => !want || String(v.ssmlGender) === want)
    .filter((v) => v.name.includes('Chirp3-HD'));
  if (!urdu.length) {
    console.log('No Chirp3-HD Urdu voices available to this key.');
    return;
  }
  const dir = path.join(ROOT, 'assets', 'voice-audition');
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Recording ${urdu.length} voices × ${AUDITION.length} lines into assets/voice-audition/\n`);
  for (const v of urdu) {
    const short = v.name.replace('ur-IN-Chirp3-HD-', '');
    for (const line of AUDITION) {
      const audio = await googleTTS(line.text, v.name, line.pace);
      fs.writeFileSync(path.join(dir, `${short}-${line.id}.mp3`), audio);
    }
    console.log(`  ${short.padEnd(16)} ${v.ssmlGender}`);
  }
  console.log(`\nPlay them, pick one, then:\n  VOICE_SET=m VOICE_NAME=ur-IN-Chirp3-HD-<name> npm run gen:voice`);
}

/** Ask Google which voices the key can actually use, rather than guessing. */
async function listGoogleVoices() {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) {
    console.log('Set GOOGLE_TTS_API_KEY to list voices.');
    process.exit(1);
  }
  const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${key}`);
  if (!res.ok) {
    console.error(`Could not list voices — ${res.status}: ${(await res.text()).slice(0, 400)}`);
    process.exit(1);
  }
  const { voices = [] } = await res.json();
  const urdu = voices.filter((v) => (v.languageCodes || []).some((c) => c.startsWith('ur')));
  if (!urdu.length) {
    console.log('This key returned no Urdu voices at all. Check the API is enabled on the project.');
    return;
  }
  console.log(`Urdu voices available to this key (${urdu.length}):\n`);
  for (const v of urdu) {
    console.log(`  ${v.name.padEnd(28)} ${String(v.ssmlGender).padEnd(8)} ${v.languageCodes.join(', ')}`);
  }
  console.log('\nUse one with:  VOICE_NAME=<name> LANG_CODE=<code> npm run gen:voice');
}

async function elevenTTS(text, _voice) {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!voice) throw new Error('ELEVENLABS_VOICE_ID is required with ELEVENLABS_API_KEY');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

function pickProvider() {
  if (process.env.GOOGLE_TTS_API_KEY) return { name: 'Google Cloud TTS', fn: googleTTS };
  if (process.env.ELEVENLABS_API_KEY) return { name: 'ElevenLabs', fn: elevenTTS };
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Rebuild the manifest from whatever clips are on disk.
 *
 * Static `require`s, so Metro bundles the files. Written from the directory
 * rather than from this run, so a partial run still produces a correct manifest
 * and a second run picks up where it stopped.
 */
function idsIn(dirName) {
  const dir = path.join(ROOT, 'assets', dirName);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mp3'))
    .map((f) => f.replace(/\.mp3$/, ''))
    .sort();
}

function writeManifest() {
  const block = (dirName, ids) =>
    ids.map((id) => `  '${id}': require('../../assets/${dirName}/${id}.mp3'),`).join('\n');

  const f = idsIn(SET_DIR.f);
  const m = idsIn(SET_DIR.m);

  fs.writeFileSync(
    MANIFEST,
    `/** AUTO-GENERATED by scripts/generate-voice.js — do not edit by hand. */\n\n` +
      `/** The default narrator. */\n` +
      `export const VOICE: Record<string, number> = {\n${block(SET_DIR.f, f)}\n};\n\n` +
      `/**\n * The second voice, for learners who would rather be taught by it.\n *\n` +
      ` * Empty until \`VOICE_SET=m npm run gen:voice\` has been run with a TTS key.\n` +
      ` * The app checks \`MALE_VOICE_AVAILABLE\` before offering the choice, so a\n` +
      ` * half-generated set never becomes a setting that silently falls back to the\n` +
      ` * device's own voice — which, having no Urdu, would read the script in English.\n */\n` +
      `export const VOICE_M: Record<string, number> = {\n${block(SET_DIR.m, m)}\n};\n\n` +
      `/** Whether the app may offer the second voice at all. */\n` +
      `export const MALE_VOICE_AVAILABLE = ${m.length > 0 && m.length === f.length};\n`
  );
  return { f: f.length, m: m.length };
}

// ---- main ---------------------------------------------------------------
(async () => {
  const args = process.argv.slice(2);

  if (args.includes('--voices')) return listGoogleVoices();
  if (args.includes('--audition')) return auditionVoices(process.env.GENDER || 'MALE');

  if (args.includes('--manifest')) {
    {
      const n = writeManifest();
      console.log(`Manifest rebuilt from disk: ${n.f} clips, ${n.m} in the second voice.`);
    }
    return;
  }

  const provider = pickProvider();
  if (!provider) {
    console.log('No TTS API key set (GOOGLE_TTS_API_KEY or ELEVENLABS_API_KEY).');
    console.log('Skipping voice generation — the app will use device TTS. See VOICE_SETUP.md.');
    // Still refresh the manifest, in case clips were committed to the repo.
    const n = writeManifest();
    if (n.f) console.log(`Found ${n.f} clips already on disk (${n.m} in the second voice); manifest written.`);
    process.exit(0);
  }

  const force = args.includes('--force');
  const all = collectItems();
  if (provider.name === 'Google Cloud TTS') await assertVoicesExist(all);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Generating is idempotent: anything already on disk *that still says what
  // the course says* is left alone unless --force. That is what makes this a
  // one-time job — add words later and only the new ones cost anything — while
  // still letting a changed word reach the audio.
  const ledger = readLedger();
  const missing = [];
  const stale = [];
  for (const i of all) {
    if (!fs.existsSync(path.join(OUT_DIR, `${i.id}.mp3`))) missing.push(i);
    else {
      const was = ledger[i.id];
      // `actual` is set when the API answered in a voice other than the one
      // asked for — a retry landing on an older model, which leaves one word
      // audibly in a different voice from the rest of the course. Recorded
      // since this ledger was written and never acted on, so eight shipped
      // clips (ہاں among them, in both voices) were narrated by a stranger
      // until `check:voice-fidelity` went looking. Counting it as stale is
      // what lets an ordinary incremental run repair them: they are not
      // stale by text, so nothing else would ever re-record them, and
      // --force would re-record all 5,496 to fix 8.
      const wrongVoice = was && was.actual && was.actual !== i.voice;
      if (was && (was.text !== i.text || was.voice !== i.voice || (was.pace ?? LEGACY_PACE) !== i.pace || wrongVoice))
        stale.push(i);
    }
  }
  const todo = force ? all : [...missing, ...stale];
  const chars = todo.reduce((n, i) => n + i.text.length, 0);

  console.log(
    `${all.length} items in the course · ${all.length - missing.length - stale.length} already done` +
      (stale.length ? ` · ${stale.length} stale (the text or the voice changed since the clip was made)` : '')
  );
  for (const s of stale.slice(0, 8)) {
    const was = ledger[s.id];
    let what;
    if (was.text !== s.text) what = `“${was.text}” \u2192 “${s.text}”`;
    else if (was.voice !== s.voice) what = `${was.voice} \u2192 ${s.voice}`;
    else if (was.actual && was.actual !== s.voice) what = `was recorded in ${was.actual}, not ${s.voice}`;
    else what = `pace ${was.pace ?? LEGACY_PACE} \u2192 ${s.pace}`;
    console.log(`    stale: ${s.id} — ${what}`);
  }
  if (!todo.length) {
    const n = writeManifest();
    console.log(`Nothing to generate. Manifest: ${n.f} clips, ${n.m} in the second voice.`);
    return;
  }
  console.log(`Generating ${todo.length} clips with ${provider.name} (${chars} characters)…\n`);

  let ok = 0;
  let retried = 0;
  const fellBack = [];
  const failed = [];
  if (!ffmpegAvailable())
    console.log('  (ffmpeg not found — clips are checked by length only; install it to catch long silences)\n');
  for (const { id, text, voice, pace } of todo) {
    try {
      // The API answers a bad synthesis with 200 and a fragment of near-silence
      // (see lib/audio.js), and every one of those succeeds on a retry — so the
      // clip is inspected before it is written, and a silent one is asked for
      // again rather than shipped.
      let audio = null;
      let problem = null;
      let actual = voice;
      const attempts = [voice, voice, voice];
      const fallback = FALLBACK_VOICE[voice];
      if (fallback) attempts.push(fallback, fallback);
      for (let i = 0; i < attempts.length; i++) {
        actual = attempts[i];
        audio = await provider.fn(text, actual, pace);
        problem = bufferProblem(audio, path.join(OUT_DIR, `.${id}.probe`), twinSeconds(id));
        if (!problem) break;
        retried++;
        const next = attempts[i + 1];
        console.log(`  ↻ ${id} came back ${problem}` + (next && next !== actual ? ` — falling back to ${next}` : ''));
        await sleep(400);
      }
      if (problem) throw new Error(`still ${problem} after ${attempts.length} attempts`);
      if (actual !== voice) fellBack.push(`${id} (${actual})`);

      fs.writeFileSync(path.join(OUT_DIR, `${id}.mp3`), audio);
      // Written per clip, not at the end, so a run that dies half way leaves a
      // ledger that matches the disk rather than one that lies about it.
      //
      // `voice` is what was asked for and is what staleness compares against;
      // `actual` records what produced the file. Storing only `actual` would
      // make a fallen-back clip differ from the course's intent on every run
      // and regenerate for ever.
      ledger[id] = actual === voice ? { text, voice, pace } : { text, voice, pace, actual };
      writeLedger(ledger);
      ok++;
      if (ok % 100 === 0 || ok === 1) console.log(`  ${ok}/${todo.length}  ${id} “${text}”`);
      await sleep(60); // gentle on rate limits
    } catch (e) {
      failed.push(`${id}: ${e.message}`);
      // A run that dies on the first bad key should say so once, not 2,000 times.
      if (failed.length === 1) console.error(`  ✗ ${failed[0]}`);
      if (failed.length > 20) {
        console.error(`\nStopping: ${failed.length} failures. Fix the error above and run again.`);
        break;
      }
    }
  }

  // writeManifest reports both voices now, so this destructures rather than
  // interpolating the object — which printed "[object Object] clips on disk".
  const { f: totalF, m: totalM } = writeManifest();
  console.log(
    `\n${ok} generated · ${failed.length} failed · ${totalF} clips on disk` +
      (totalM ? ` · ${totalM} in the second voice` : '') +
      (retried ? ` · ${retried} silent responses retried` : '') +
      '.'
  );
  if (fellBack.length) {
    console.log(`\n${fellBack.length} needed the Wavenet fallback (Chirp3-HD will not speak text this short):`);
    console.log('  ' + fellBack.join(', '));
  }
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST)}`);
  if (failed.length) {
    console.log(`\nFailures (first 5):`);
    failed.slice(0, 5).forEach((f) => console.log('  •', f));
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error('Voice generation failed:', e);
  process.exit(1);
});
