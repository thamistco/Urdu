import * as Speech from 'expo-speech';

/**
 * Best-effort pronunciation via the device's text-to-speech. Urdu ('ur')
 * voices exist on many devices but not all — if unavailable the UI still shows
 * the Roman transliteration, so nothing breaks. Never throws into the UI.
 */
export function speak(urdu: string, roman?: string) {
  try {
    Speech.stop();
    Speech.speak(urdu, {
      language: 'ur',
      rate: 0.85,
      pitch: 1.0,
      onError: () => {
        // fall back to reading the roman with the default voice
        if (roman) Speech.speak(roman, { rate: 0.9 });
      },
    });
  } catch {
    // ignore
  }
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}
