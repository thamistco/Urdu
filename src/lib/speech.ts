import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { VOICE } from './voiceManifest';

/**
 * Pronunciation. Prefers a bundled, pre-generated voice clip (one consistent,
 * natural voice everywhere — see VOICE_SETUP.md); if no clip exists for the
 * item it falls back to the device's text-to-speech, and if that has no Urdu
 * voice it reads the Roman transliteration. Never throws into the UI.
 */
let muted = false;
export function setSpeechMuted(value: boolean) {
  muted = value;
}

/**
 * Correct feedback delays its pronunciation by a few hundred ms so the chime
 * and the voice don't collide (see feedback.ts). That delay is real time a
 * quick learner can spend tapping "Continue" — so without this, a word's
 * audio could still be in flight when the next question was already on
 * screen, and land on top of it sounding like a mispronunciation of the new
 * word. Every screen transition bumps this so stale audio never plays late.
 */
let epoch = 0;
export function speechEpoch() {
  return epoch;
}

const clipCache: Record<string, Audio.Sound> = {};
let lastSound: Audio.Sound | null = null;

/**
 * Play a bundled clip, returning how long it runs for — or null if there is no
 * clip. `replayAsync` resolves when playback *starts*, so anything that has to
 * follow the audio needs the duration rather than the promise.
 */
async function playClip(id: string): Promise<number | null> {
  const asset = VOICE[id];
  if (!asset) return null;
  try {
    let sound = clipCache[id];
    if (!sound) {
      const created = await Audio.Sound.createAsync(asset, { volume: 1 });
      sound = created.sound;
      clipCache[id] = sound;
    }
    lastSound = sound;
    const status = await sound.replayAsync();
    return status.isLoaded && typeof status.durationMillis === 'number' ? status.durationMillis : 0;
  } catch {
    return null;
  }
}

function deviceSpeak(urdu: string, roman?: string) {
  try {
    Speech.stop();
    Speech.speak(urdu, {
      language: 'ur',
      rate: 0.85,
      pitch: 1.0,
      onError: () => {
        if (roman) Speech.speak(roman, { rate: 0.9 });
      },
    });
  } catch {
    // ignore
  }
}

/** Pronounce an item, preferring its bundled clip. `id` is the word/letter id. */
export async function announce(id: string | undefined, urdu: string, roman?: string) {
  if (muted) return;
  if (id && (await playClip(id)) !== null) return;
  deviceSpeak(urdu, roman);
}

let glossEnabled = true;
export function setGlossEnabled(value: boolean) {
  glossEnabled = value;
}

/**
 * Pronounce an item, then say what it means.
 *
 * Getting an answer right is the moment the pair is worth hearing as a pair —
 * the app said دماغ and stopped, leaving the learner to read "brain" off the
 * screen in silence. The gloss follows the clip rather than overlapping it,
 * timed off the clip's real duration, and uses the device's English voice
 * because the bundled clips are Urdu only.
 *
 * Guarded by the same epoch as everything else: tap Continue before the gloss
 * has started and it is dropped rather than spoken over the next question.
 */
export async function announceWithMeaning(
  id: string | undefined,
  urdu: string,
  roman: string | undefined,
  meaning: string
) {
  if (muted) return;
  const epochAtCall = epoch;
  const ms = id ? await playClip(id) : null;
  if (ms === null) deviceSpeak(urdu, roman);
  if (!glossEnabled || !meaning) return;
  // No clip means device TTS is mid-sentence with no duration to wait on, so
  // the gloss is skipped rather than talked over.
  if (ms === null) return;
  setTimeout(() => {
    if (epoch !== epochAtCall || muted || !glossEnabled) return;
    try {
      Speech.speak(meaning, { language: 'en', rate: 0.95 });
    } catch {
      // ignore
    }
  }, ms + 220);
}

/** Direct device TTS (used where there is no id, e.g. free text). */
export function speak(urdu: string, roman?: string) {
  if (muted) return;
  deviceSpeak(urdu, roman);
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}

/** Call when the screen moves on from the word being spoken about — cancels
 *  anything queued and stops anything already playing, so it never lands on
 *  whatever comes next. */
export function invalidateSpeech() {
  epoch += 1;
  stopSpeaking();
  lastSound?.stopAsync().catch(() => {});
}
