import { play } from './sound';
import { haptics } from './haptics';
import { announce, speechEpoch } from './speech';

/**
 * Speak once the feedback chime has had room, without letting a stale word
 * land on the next question (see `invalidateSpeech` in speech.ts).
 *
 * Was 650ms, which testing found too long a gap between answering and hearing
 * the word — long enough that the two stopped feeling connected. 400ms still
 * clears the chime's attack while keeping them one event.
 */
function speakAfterChime(voiceId: string | undefined, urdu: string, roman?: string) {
  const epochAtCall = speechEpoch();
  setTimeout(() => {
    if (speechEpoch() === epochAtCall) announce(voiceId, urdu, roman);
  }, 400);
}

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
    speakAfterChime(voiceId, urdu, roman);
  },
  incorrect() {
    play('incorrect');
    haptics.incorrect();
  },
  /**
   * A wrong answer still hears the word.
   *
   * Getting it wrong is the moment the correct pronunciation is worth most,
   * and until now that was the one moment the app stayed silent — the reveal
   * showed the word in script and said nothing. Same timing and the same
   * staleness guard as the correct-answer path.
   */
  incorrectAnnounce(voiceId: string | undefined, urdu: string, roman?: string) {
    play('incorrect');
    haptics.incorrect();
    speakAfterChime(voiceId, urdu, roman);
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
