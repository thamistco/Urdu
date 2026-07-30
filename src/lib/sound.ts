import { Audio } from 'expo-av';

/**
 * Lightweight audio-feedback layer.
 *
 * Sounds are pre-loaded once and replayed on demand so feedback is instant
 * (latency kills the "reward" feeling). Respects a global mute flag driven by
 * the settings store. Playback failures never throw into the UI.
 */

export type SoundName = 'correct' | 'incorrect' | 'levelup' | 'streak' | 'tap';

const sources: Record<SoundName, number> = {
  correct: require('../../assets/sounds/correct.wav'),
  incorrect: require('../../assets/sounds/incorrect.wav'),
  levelup: require('../../assets/sounds/levelup.wav'),
  streak: require('../../assets/sounds/streak.wav'),
  tap: require('../../assets/sounds/tap.wav'),
};

const players: Partial<Record<SoundName, Audio.Sound>> = {};
let ready = false;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

export async function initSound() {
  if (ready) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    await Promise.all(
      (Object.keys(sources) as SoundName[]).map(async (name) => {
        const { sound } = await Audio.Sound.createAsync(sources[name], {
          volume: name === 'tap' ? 0.4 : 0.85,
        });
        players[name] = sound;
      })
    );
    ready = true;
  } catch {
    // Audio is a nice-to-have; the app must still work without it.
  }
}

export async function play(name: SoundName) {
  if (muted) return;
  try {
    const s = players[name];
    if (!s) return;
    await s.stopAsync().catch(() => {});
    await s.setPositionAsync(0).catch(() => {});
    await s.playAsync();
  } catch {
    // ignore playback errors
  }
}

export async function unloadSound() {
  await Promise.all(Object.values(players).map((s) => s?.unloadAsync().catch(() => {})));
  ready = false;
}
