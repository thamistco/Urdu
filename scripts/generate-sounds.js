/* eslint-disable */
/**
 * Generates the UI feedback sounds for Harf as small mono 16-bit WAV files.
 *
 * Design follows the sound-feedback research in the brief:
 *   Correct  → harmonious, rising major-key arpeggio (C5→E5→G5→C6),
 *              bell-like, quick & snappy (~0.32s). A sense of reward.
 *   Incorrect→ subdued, soft falling tone (G4→C4), short & unobtrusive.
 *              Acknowledges the miss without scolding.
 *   Level-up → a longer triumphant major arpeggio for milestones.
 *   Tap      → tiny soft click for selection feedback.
 *   Streak   → warm two-note lift for the daily streak bump.
 *
 * No external audio deps — we write the PCM WAV bytes directly so the repo
 * stays self-contained and the sounds are reproducible.
 *
 * Run: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

// ---- tiny synth ----------------------------------------------------------

// ADSR-ish envelope: quick attack, gentle exponential decay → bell-like.
function envAt(t, dur, { attack = 0.006, release = 0.08 } = {}) {
  let a = 1;
  if (t < attack) a = t / attack;
  const relStart = dur - release;
  if (t > relStart) a = Math.max(0, (dur - t) / release);
  // exponential body decay for a soft, natural fade
  const decay = Math.exp(-3.2 * (t / dur));
  return a * decay;
}

// A single sine partial with light 2nd/3rd harmonics for a marimba/bell timbre.
function toneSample(freq, t, dur, harmonics = [1, 0.28, 0.12]) {
  let s = 0;
  harmonics.forEach((amp, i) => {
    s += amp * Math.sin(2 * Math.PI * freq * (i + 1) * t);
  });
  return s * envAt(t, dur);
}

/**
 * notes: [{ freq, start, dur, gain }]
 * total duration inferred from the notes.
 */
function renderNotes(notes, tail = 0.06) {
  const total = Math.max(...notes.map((n) => n.start + n.dur)) + tail;
  const n = Math.floor(total * SAMPLE_RATE);
  const buf = new Float32Array(n);
  for (const note of notes) {
    const startIdx = Math.floor(note.start * SAMPLE_RATE);
    const len = Math.floor(note.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= n) break;
      const t = i / SAMPLE_RATE;
      buf[idx] += (note.gain ?? 0.7) * toneSample(note.freq, t, note.dur);
    }
  }
  // soft-clip / normalize
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const norm = peak > 0 ? 0.82 / peak : 1;
  for (let i = 0; i < n; i++) buf[i] = Math.tanh(buf[i] * norm);
  return buf;
}

function floatToWav(float32) {
  const numSamples = float32.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    buffer.writeInt16LE(Math.round(s * 32767), offset);
    offset += 2;
  }
  return buffer;
}

// ---- note tables (equal temperament) ------------------------------------
const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
  C6: 1046.5, E6: 1318.51, G6: 1567.98,
};

// ---- sound definitions ---------------------------------------------------
const SOUNDS = {
  // Correct: rising C-major arpeggio, sparkling & quick (~0.32s).
  correct: renderNotes([
    { freq: N.C5, start: 0.0, dur: 0.11, gain: 0.7 },
    { freq: N.E5, start: 0.07, dur: 0.11, gain: 0.7 },
    { freq: N.G5, start: 0.14, dur: 0.13, gain: 0.75 },
    { freq: N.C6, start: 0.2, dur: 0.16, gain: 0.8 },
  ]),

  // Incorrect: soft falling two-note (G4 → C4), muffled & short. Neutral, not harsh.
  incorrect: renderNotes(
    [
      { freq: N.G4, start: 0.0, dur: 0.13, gain: 0.55 },
      { freq: N.C4, start: 0.09, dur: 0.2, gain: 0.5 },
    ],
    0.04
  ),

  // Level up / lesson complete: fuller triumphant arpeggio.
  levelup: renderNotes([
    { freq: N.C5, start: 0.0, dur: 0.12, gain: 0.65 },
    { freq: N.E5, start: 0.09, dur: 0.12, gain: 0.65 },
    { freq: N.G5, start: 0.18, dur: 0.12, gain: 0.7 },
    { freq: N.C6, start: 0.27, dur: 0.14, gain: 0.72 },
    { freq: N.E6, start: 0.36, dur: 0.16, gain: 0.72 },
    { freq: N.G6, start: 0.45, dur: 0.34, gain: 0.8 },
  ]),

  // Streak bump: warm two-note lift (A4 → E5).
  streak: renderNotes([
    { freq: N.A4, start: 0.0, dur: 0.14, gain: 0.6 },
    { freq: N.E5, start: 0.1, dur: 0.28, gain: 0.72 },
  ]),

  // Tap: tiny soft click for selection.
  tap: renderNotes(
    [{ freq: N.A5, start: 0.0, dur: 0.05, gain: 0.35 }],
    0.02
  ),
};

// ---- write ---------------------------------------------------------------
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  const wav = floatToWav(samples);
  const file = path.join(OUT_DIR, `${name}.wav`);
  fs.writeFileSync(file, wav);
  console.log(`  ✓ ${name}.wav  (${(wav.length / 1024).toFixed(1)} KB)`);
}
console.log('Done. Sounds written to assets/sounds/');
