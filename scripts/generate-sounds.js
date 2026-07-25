/* eslint-disable */
/**
 * Generates Harf's UI feedback sounds — tuned to be PEACEFUL and NATURE-LIKE
 * rather than gamey.
 *
 *   Correct   → a soft, warm ocarina/koto-like bloom rising through a major
 *               PENTATONIC (the most consonant, calming scale). Slow attack,
 *               long mellow decay, gentle vibrato, a faint echo for air.
 *   Incorrect → a very soft, low wooden tone that gently glides down a whole
 *               step. Quiet and unobtrusive — acknowledges the miss, never scolds.
 *   Level-up  → a slow pentatonic wind-chime settle.
 *   Streak    → a warm two-note lift.
 *   Tap       → a barely-there soft blip.
 *
 * Pure sine-dominant timbre (only a whisper of 2nd harmonic) = rounded, flute-
 * like, no sparkle. No external audio deps — PCM WAV bytes written directly.
 *
 * Run: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

// ---- envelope: soft attack, gentle exponential body, smooth release --------
function envAt(t, dur, attack, release, decay) {
  let a = 1;
  if (t < attack) a = t / attack;
  const relStart = dur - release;
  let r = 1;
  if (t > relStart) r = Math.max(0, (dur - t) / release);
  const body = Math.exp(-decay * (t / dur));
  return a * r * body;
}

/**
 * Render notes with per-sample phase accumulation so we can do smooth pitch
 * glides and gentle vibrato (organic, breathing quality).
 * note: { freq, start, dur, gain, glideTo?, vibrato?, vibratoDepth?, attack?, release?, decay? }
 */
function renderNotes(notes, { tail = 0.4, echo = 0.22, echoMs = 130, level = 1 } = {}) {
  const total = Math.max(...notes.map((n) => n.start + n.dur)) + tail;
  const n = Math.floor(total * SAMPLE_RATE);
  const buf = new Float32Array(n);

  for (const note of notes) {
    const startIdx = Math.floor(note.start * SAMPLE_RATE);
    const len = Math.floor(note.dur * SAMPLE_RATE);
    const attack = note.attack ?? 0.025;
    const release = note.release ?? 0.12;
    const decay = note.decay ?? 2.2;
    const vib = note.vibrato ?? 5.0;
    const vibDepth = note.vibratoDepth ?? 0.004;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= n) break;
      const t = i / SAMPLE_RATE;
      const prog = t / note.dur;
      let f = note.glideTo ? note.freq + (note.glideTo - note.freq) * prog : note.freq;
      f *= 1 + vibDepth * Math.sin(2 * Math.PI * vib * t);
      phase += (2 * Math.PI * f) / SAMPLE_RATE;
      // sine + a whisper of 2nd harmonic → warm, rounded, flute-like
      const s = Math.sin(phase) + 0.12 * Math.sin(2 * phase);
      buf[idx] += (note.gain ?? 0.6) * s * envAt(t, note.dur, attack, release, decay);
    }
  }

  // soft single echo → a sense of gentle space (like a room / open air)
  if (echo > 0) {
    const d = Math.floor((echoMs / 1000) * SAMPLE_RATE);
    for (let i = n - 1; i >= d; i--) buf[i] += echo * buf[i - d];
  }

  // Normalise to a common peak, then apply the sound's own level.
  //
  // Normalising alone made every cue exactly as loud as every other one, which
  // quietly undid the whole point of a "subdued" wrong answer: a miss
  // acknowledged at full volume is a telling-off. `level` is what actually sets
  // how loud a sound is relative to the others, so it is set deliberately per
  // sound rather than falling out of how many notes happen to overlap.
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const norm = peak > 0 ? (0.62 * level) / peak : 1;
  for (let i = 0; i < n; i++) buf[i] = Math.tanh(buf[i] * norm);
  return buf;
}

function floatToWav(float32) {
  const numSamples = float32.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    buffer.writeInt16LE(Math.round(s * 32767), offset);
    offset += 2;
  }
  return buffer;
}

// ---- notes (C major pentatonic: C D E G A) --------------------------------
const N = {
  E3: 164.81, G3: 196.0, A3: 220.0, C4: 261.63, D4: 293.66, E4: 329.63,
  G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  A5: 880.0, C6: 1046.5, D6: 1174.66,
};

const soft = { attack: 0.03, release: 0.18, decay: 1.9 };

const SOUNDS = {
  // Correct: warm pentatonic bloom C5 → E5 → G5 with a faint A5 shimmer.
  correct: renderNotes(
    [
      { freq: N.C5, start: 0.0, dur: 0.5, gain: 0.5, ...soft },
      { freq: N.E5, start: 0.11, dur: 0.5, gain: 0.5, ...soft },
      { freq: N.G5, start: 0.22, dur: 0.55, gain: 0.55, ...soft },
      { freq: N.A5, start: 0.34, dur: 0.5, gain: 0.28, ...soft },
    ],
    { tail: 0.5, echo: 0.24, level: 1 }
  ),

  // Incorrect: low, soft wooden tone gliding gently down a whole step. Calm,
  // and noticeably quieter than the correct chime — the miss is acknowledged,
  // not announced.
  incorrect: renderNotes(
    [
      { freq: N.A3, glideTo: N.G3, start: 0.0, dur: 0.42, gain: 0.5, attack: 0.02, release: 0.2, decay: 2.6, vibratoDepth: 0.002 },
    ],
    { tail: 0.35, echo: 0.16, echoMs: 110, level: 0.55 }
  ),

  // Level-up: a slow wind-chime settle up the pentatonic.
  levelup: renderNotes(
    [
      { freq: N.C5, start: 0.0, dur: 0.6, gain: 0.42, ...soft },
      { freq: N.E5, start: 0.14, dur: 0.6, gain: 0.42, ...soft },
      { freq: N.G5, start: 0.28, dur: 0.6, gain: 0.45, ...soft },
      { freq: N.A5, start: 0.42, dur: 0.6, gain: 0.45, ...soft },
      { freq: N.C6, start: 0.56, dur: 0.8, gain: 0.5, ...soft },
      { freq: N.D6, start: 0.7, dur: 0.9, gain: 0.32, ...soft },
    ],
    { tail: 0.8, echo: 0.28, level: 1 }
  ),

  // Streak: warm two-note lift A4 → E5.
  streak: renderNotes(
    [
      { freq: N.A4, start: 0.0, dur: 0.45, gain: 0.45, ...soft },
      { freq: N.E5, start: 0.12, dur: 0.6, gain: 0.5, ...soft },
    ],
    { tail: 0.5, echo: 0.22, level: 0.9 }
  ),

  // Tap: a barely-there soft blip.
  tap: renderNotes(
    [{ freq: N.C5, start: 0.0, dur: 0.09, gain: 0.22, attack: 0.006, release: 0.05, decay: 3.5 }],
    // a UI tick fires on every single press; it should sit well under the
    // sounds that actually mean something
    { tail: 0.06, echo: 0, level: 0.4 }
  ),
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  const wav = floatToWav(samples);
  fs.writeFileSync(path.join(OUT_DIR, `${name}.wav`), wav);
  console.log(`  ✓ ${name}.wav  (${(wav.length / 1024).toFixed(1)} KB)`);
}
console.log('Done. Calm, nature-like sounds written to assets/sounds/');
