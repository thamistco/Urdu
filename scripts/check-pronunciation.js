/**
 * Does each clip actually say the word?
 *
 * `check:voice` proves a clip can be heard. `check:voice-fidelity` proves the
 * course asked for the right text in the right voice and that nothing has
 * drifted since. Neither has ever heard the audio, and a clip that says the
 * wrong word in the right voice at a healthy volume passes both.
 *
 * So this listens: every clip goes through speech-to-text and the transcript
 * is held against the text the generator recorded asking for
 * (`spoken.json`). The comparison is `scripts/lib/urdu-compare.js`, which has
 * its own unit test — it has to forgive a great deal (a recogniser never
 * returns the synthesised string character for character) without forgiving
 * the aspirate, which is the distinction this course exists to teach.
 *
 * ## This does not gate anything yet, on purpose
 *
 * Round-tripping synthesised speech is a noisy signal and the noise is worst
 * exactly here: 2,461 of these clips are single words and 40 are bare letters,
 * spoken with no sentence around them for a recogniser's language model to
 * lean on. A threshold picked before measuring would flag a few hundred
 * perfectly good clips, and a check that cries wolf is a check that gets
 * switched off.
 *
 * So the default run *reports*: it prints the distribution of agreement across
 * whatever it transcribed and lists the worst offenders, and exits 0. Once
 * that distribution has been seen on real data, `--fail-below N` turns it into
 * a gate at a threshold that came from the data rather than from an opinion.
 * `--calibrate N` transcribes a random sample instead of everything, which is
 * how to get that distribution for a few cents rather than a few dollars.
 *
 * ## Cost, and not paying it twice
 *
 * Every transcript is cached in `heard.json` beside the clips — the mirror of
 * `spoken.json`, which records what each clip was *asked* to say. A rerun
 * transcribes only what is new or has been regenerated since (the cache is
 * keyed by the text that was spoken, so a regenerated clip invalidates its own
 * entry). Deleting `heard.json` forces a full re-listen.
 *
 * ## Providers
 *
 *   ELEVENLABS_API_KEY   → ElevenLabs Scribe. A plain key, strong on Urdu.
 *   GOOGLE_STT_API_KEY   → Google Cloud Speech-to-Text. Note this is a
 *                          *different* product from the Text-to-Speech key
 *                          `gen:voice` uses and usually needs its own
 *                          credentials; if it rejects a plain API key, use
 *                          ElevenLabs, which does not.
 *
 * No key set → prints what it would have done and exits 0, so this is safe to
 * run anywhere.
 *
 *   node scripts/check-pronunciation.js                 everything, cached
 *   node scripts/check-pronunciation.js --calibrate 60  a random sample first
 *   node scripts/check-pronunciation.js --set male      one voice only
 *   node scripts/check-pronunciation.js --fail-below 0.6   gate, once calibrated
 *   node scripts/check-pronunciation.js --dry-run       exercise everything but the network
 */

const fs = require('fs');
const path = require('path');
const { similarity } = require('./lib/urdu-compare');

const ROOT = path.join(__dirname, '..');
const SETS = {
  female: path.join(ROOT, 'assets', 'voice'),
  male: path.join(ROOT, 'assets', 'voice-m'),
};

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const CONCURRENCY = Number(arg('concurrency', 6));
const DRY_RUN = has('dry-run');
const CALIBRATE = arg('calibrate') ? Number(arg('calibrate')) : null;
const FAIL_BELOW = arg('fail-below') ? Number(arg('fail-below')) : null;

/** Deterministic shuffle, so `--calibrate` samples the same clips every run. */
function seededPick(items, n, seed = 20260829) {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// ---------------------------------------------------------------- providers
async function elevenLabs(file, key) {
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'urd');
  form.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), path.basename(file));
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': key },
    body: form,
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).text ?? '';
}

async function googleSTT(file, key) {
  const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      config: { encoding: 'MP3', sampleRateHertz: 24000, languageCode: 'ur-PK' },
      audio: { content: fs.readFileSync(file).toString('base64') },
    }),
  });
  if (!res.ok) throw new Error(`Google STT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return (j.results ?? []).map((r) => r.alternatives?.[0]?.transcript ?? '').join(' ');
}

function pickProvider() {
  if (DRY_RUN) return { name: 'dry-run', fn: null };
  if (process.env.ELEVENLABS_API_KEY)
    return { name: 'ElevenLabs Scribe', fn: (f) => elevenLabs(f, process.env.ELEVENLABS_API_KEY) };
  if (process.env.GOOGLE_STT_API_KEY)
    return { name: 'Google Speech-to-Text', fn: (f) => googleSTT(f, process.env.GOOGLE_STT_API_KEY) };
  return null;
}

// ------------------------------------------------------------------- the run
/** One transcript per clip, with a bounded pool and per-clip failure isolation. */
async function transcribeAll(jobs, provider, cache) {
  let done = 0;
  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        const heard = DRY_RUN ? job.said : await provider.fn(job.file);
        cache[job.id] = { said: job.said, heard };
      } catch (e) {
        cache[job.id] = { said: job.said, heard: '', error: String(e.message || e).slice(0, 160) };
      }
      done++;
      if (done % 25 === 0 || done === jobs.length) process.stdout.write(`\r  transcribed ${done}/${jobs.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
  if (jobs.length) process.stdout.write('\n');
}

function report(rows, setName) {
  const scored = rows.map((r) => ({ ...r, score: similarity(r.said, r.heard) })).sort((a, b) => a.score - b.score);
  const q = (p) => scored[Math.min(scored.length - 1, Math.floor(scored.length * p))].score;
  console.log(`\n${setName}: ${scored.length} clips compared`);
  console.log(
    `  agreement  p05 ${q(0.05).toFixed(2)} · p25 ${q(0.25).toFixed(2)} · median ${q(0.5).toFixed(2)} · ` +
      `p75 ${q(0.75).toFixed(2)} · exact ${scored.filter((r) => r.score === 1).length}`
  );
  const errs = scored.filter((r) => r.error);
  if (errs.length) console.log(`  ${errs.length} could not be transcribed at all — e.g. ${errs[0].error}`);
  console.log('  worst agreement (transcribe-then-listen candidates):');
  for (const r of scored.slice(0, 15))
    console.log(`    ${r.score.toFixed(2)}  ${r.id.padEnd(20)} said "${r.said}"  heard "${r.heard}"`);
  return scored;
}

(async () => {
  const provider = pickProvider();
  const setNames = arg('set') ? [arg('set')] : Object.keys(SETS);
  let worst = [];

  for (const setName of setNames) {
    const dir = SETS[setName];
    const ledgerFile = path.join(dir, 'spoken.json');
    if (!fs.existsSync(ledgerFile)) continue;
    const ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
    const cacheFile = path.join(dir, 'heard.json');
    const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};

    let ids = Object.keys(ledger).filter((id) => fs.existsSync(path.join(dir, `${id}.mp3`)));
    if (CALIBRATE) ids = seededPick(ids, CALIBRATE);
    // A cached transcript is only good for the text that was spoken at the
    // time; a regenerated clip changes that text and re-transcribes itself.
    const jobs = ids
      .filter((id) => !cache[id] || cache[id].said !== ledger[id].text)
      .map((id) => ({ id, said: ledger[id].text, file: path.join(dir, `${id}.mp3`) }));

    // A committed `heard.json` is the point of caching: CI can hold the whole
    // corpus to a threshold without a key and without paying again. So a
    // missing key only stops *new* transcription — everything already heard is
    // still reported and still gated below.
    if (jobs.length && !provider) {
      console.log(
        `check:pronunciation — ${setName}: ${jobs.length} of ${ids.length} clips have never been ` +
          `transcribed, and no key is set (ELEVENLABS_API_KEY or GOOGLE_STT_API_KEY) to do it now.`
      );
    } else if (jobs.length) {
      console.log(`check:pronunciation — ${setName}, ${provider.name}: ${jobs.length} to transcribe of ${ids.length}`);
      await transcribeAll(jobs, provider, cache);
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
    }

    const rows = ids.map((id) => ({ id, ...cache[id] })).filter((r) => r.said !== undefined);
    if (rows.length) worst = worst.concat(report(rows, setName).map((r) => ({ ...r, set: setName })));
  }

  if (!worst.length) {
    console.log('check:pronunciation — nothing transcribed yet, so nothing to compare. Set a key and run again.');
    process.exit(0);
  }

  if (FAIL_BELOW === null) {
    console.log(
      `\nReporting only — no --fail-below given. Read the distribution above, then gate at a\n` +
        `threshold it justifies (see this file's header for why one is not hardcoded).`
    );
    process.exit(0);
  }
  const failed = worst.filter((r) => r.score < FAIL_BELOW);
  if (failed.length) {
    console.log(`\n${failed.length} clips below --fail-below ${FAIL_BELOW}:`);
    for (const r of failed.slice(0, 40))
      console.log(`  ${r.score.toFixed(2)}  ${r.set}/${r.id}  said "${r.said}"  heard "${r.heard}"`);
    process.exit(1);
  }
  console.log(`\nevery clip transcribes back to what it was asked to say, at or above ${FAIL_BELOW}`);
})();
