import { play } from './sound';
import { haptics } from './haptics';

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
