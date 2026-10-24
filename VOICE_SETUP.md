# One voice for everybody

When a word is answered correctly the app says it. By default that is the
**device's** text-to-speech — which sounds different on every phone, and on many
Android devices has no Urdu voice at all, so the app quietly falls back to
reading the transliteration in an English accent.

The fix is to synthesise every word **once**, bundle the clips into the app, and
play those. Then every learner hears the same voice, it works offline, no API
key ships in the build, and nothing is paid per play.

There are **2,096 clips** — 2,028 words, 28 phrases and 40 letters — totalling
about **11,000 characters** of speech.

---

## What it costs

Google Cloud Text-to-Speech bills per character, with a monthly free allowance
per voice type (at the time of writing: 1 million characters for WaveNet and
Neural2, 4 million for Standard). The whole course is ~11,000 characters — a
little over **1% of the free WaveNet allowance** — so generating the complete
set is free, and you only ever do it once.

Check the current tiers at <https://cloud.google.com/text-to-speech/pricing>
before a large run.

---

## Step by step

### 1. Turn on the API and get a key

1. Go to <https://console.cloud.google.com/> and create a project, or pick one.
2. **APIs & Services → Library**, search for **Cloud Text-to-Speech API**, press
   **Enable**. Google asks you to attach a billing account — you stay inside the
   free allowance, but the API will not enable without one.
3. **APIs & Services → Credentials → Create credentials → API key**. Copy it.
4. Press **Restrict key** and, under _API restrictions_, limit it to
   **Cloud Text-to-Speech API**. An unrestricted key that leaks can be used for
   anything on the project.

### 2. See which Urdu voices your key can use

Voice availability changes, so ask rather than guess:

```bash
GOOGLE_TTS_API_KEY=... node scripts/generate-voice.js --voices
```

It prints every Urdu voice the key can reach, with gender and language code —
`ur-IN-Wavenet-A`, `ur-IN-Standard-A` and so on. Pick one. A WaveNet or Neural2
voice sounds markedly better than Standard and, at this size, costs the same:
nothing.

### 3. Generate the clips

```bash
GOOGLE_TTS_API_KEY=...     \
VOICE_NAME=ur-IN-Wavenet-A \
LANG_CODE=ur-IN            \
npm run gen:voice -- --approved   # only once the owner has said yes to the cost
```

A few minutes. It writes `assets/voice/<id>.mp3` and rebuilds
`src/lib/voiceManifest.ts`.

The run is **idempotent** — it skips anything already on disk. If it stops
half-way, run it again and it carries on. Add vocabulary later and only the new
words are synthesised. `--force` regenerates everything; use it when you change
voice.

`npm run gen:voice -- --cost` (add `--force` for a full re-record, and
`VOICE_SET=m` for the second voice) prints what the same run would send and
cost, with no key and no request. On 2026-10-24 a full re-record was 20,095
characters a voice: nothing inside the month's free million, $0.60 a voice
past it.

Listen to a few before going on:

```bash
ls assets/voice | head        # w-paani.mp3, w-kitaab.mp3, …
```

### 4. Commit them, so it really is once

The clips are git-ignored by default. To ship them:

```bash
git add -f assets/voice
git commit -m "Bundle the pronunciation clips"
```

Now every build — yours, CI's, anyone's clone — already has the voice, and the
API is never called again. Roughly 11 MB.

### 5. Build

```bash
npm start                                  # or
npx expo export --platform web
```

`src/lib/speech.ts` plays the bundled clip whenever one exists for the item's
id, and falls back to device TTS only for anything without one.

---

## CI does not generate (2026-10-24)

The owner asked to be asked, with the cost, before every use of the key. A
build cannot ask, so the **Deploy web preview** workflow no longer synthesises,
even when a `GOOGLE_TTS_API_KEY` secret exists: it runs `--cost` for both voices
and prints what is missing and what recording it would cost. Clips are made by
hand (step 3) once the owner says yes, and committed (step 4). A key left in the
repository's secrets is no longer read by any workflow and can be deleted.

---

## ElevenLabs instead

Set `ELEVENLABS_API_KEY` **and** `ELEVENLABS_VOICE_ID` and the same script uses
the multilingual v2 model, which handles Urdu text. Better prosody, but not free
at this volume — check their pricing against 11,000 characters first.

---

## How it fits together

- `scripts/generate-voice.js` loads the real content modules — the vocabulary
  lives across `src/data/vocab/`, not only `words.ts` — calls the API, writes
  `assets/voice/<id>.mp3`, and rebuilds the manifest **from the directory**, so
  the manifest always describes what is actually there.
- `src/lib/speech.ts` → `announce(id, urdu, roman)` plays the bundled clip if the
  id is in the manifest, else device TTS, else reads the Roman. It never throws
  into the UI.
- `npm run gen:voice -- --manifest` rebuilds the manifest alone, when the clips
  are already present.

## If something goes wrong

| Symptom                        | Cause                                                     |
| ------------------------------ | --------------------------------------------------------- |
| `403 … API has not been used`  | The API is not enabled on that project — step 1.2.        |
| `400 … voice … does not exist` | Wrong `VOICE_NAME` for the `LANG_CODE`. Run `--voices`.   |
| `429`                          | Rate limited. Run it again; finished clips are skipped.   |
| Clips exist but nothing plays  | Manifest not rebuilt — `npm run gen:voice -- --manifest`. |
