import { play } from './sound';
import { haptics } from './haptics';
import { announce } from './speech';

/**
 * Combined sensory feedback — one call fires the matched sound + haptic so
 * screens don't have to coordinate them. Multi-sensory reinforcement (audio +
 * touch) strengthens the memory of the interaction (see Drops' multi-sensory
 * approach).
 */
export const feedback = {
  correct() {
    play('correct');
    haptics.correct();
  },
  /**
   * Correct feedback that also pronounces the answer (letter or word) a beat
   * later, so the chime and the voice don't collide — extra reinforcement.
   * `voiceId` selects the bundled clip; falls back to device TTS of urdu/roman.
   */
  correctAnnounce(voiceId: string | undefined, urdu: string, roman?: string) {
    play('correct');
    haptics.correct();
    // The chime blooms for about 850ms. Speaking at 420ms landed the word on
    // top of its last note; this lets the sound settle first.
    setTimeout(() => announce(voiceId, urdu, roman), 650);
  },
  incorrect() {
    play('incorrect');
    haptics.incorrect();
  },
  levelUp() {
    play('levelup');
    haptics.celebrate();
  },
  streak() {
    play('streak');
    haptics.medium();
  },
  tap() {
    play('tap');
    haptics.select();
  },
};
