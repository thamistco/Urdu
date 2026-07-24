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

const clipCache: Record<string, Audio.Sound> = {};

async function playClip(id: string): Promise<boolean> {
  const asset = VOICE[id];
  if (!asset) return false;
  try {
    let sound = clipCache[id];
    if (!sound) {
      const created = await Audio.Sound.createAsync(asset, { volume: 1 });
      sound = created.sound;
      clipCache[id] = sound;
    }
    await sound.replayAsync();
    return true;
  } catch {
    return false;
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
  if (id && (await playClip(id))) return;
  deviceSpeak(urdu, roman);
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
