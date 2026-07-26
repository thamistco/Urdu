/** Shared vocabulary types. Topic modules import these. */

export type Level = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

export type Word = {
  id: string;
  urdu: string;
  roman: string;
  meaning: string;
  emoji: string;
  topic: string;
  /** Defaults to the topic's level when omitted. */
  level?: Level;
  /**
   * A diacritic-marked variant of `urdu`, fed to the voice generator instead
   * of the plain spelling. Undotted Urdu script can't tell سر the head from
   * سر the musical note, or کل "yesterday" from کل "total" — same letters,
   * different vowels nobody writes down. Text-to-speech has to guess at a
   * bare heteronym like that, and guesses wrong as often as right, so the
   * pairs that actually collide in this vocabulary get an explicit reading
   * here. The learner never sees this string; the display stays plain.
   */
  pronounce?: string;
};

export type Topic = {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  level: Level;
};

/** A topic plus its words, so each module keeps them together. */
export type TopicPack = { topic: Topic; words: Word[] };

/**
 * Build a pack concisely: w('id','اردو','roman','meaning','emoji'), with an
 * optional 6th element — a diacritic-marked reading — for the rare word
 * whose bare script collides with another one in the course (see `Word.pronounce`).
 */
export function pack(
  topic: Topic,
  rows: [string, string, string, string, string, string?][]
): TopicPack {
  return {
    topic,
    words: rows.map(([id, urdu, roman, meaning, emoji, pronounce]) => ({
      id,
      urdu,
      roman,
      meaning,
      emoji,
      topic: topic.id,
      ...(pronounce ? { pronounce } : {}),
    })),
  };
}
