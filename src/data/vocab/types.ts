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

/** Build a pack concisely: w('id','اردو','roman','meaning','emoji') */
export function pack(
  topic: Topic,
  rows: [string, string, string, string, string][]
): TopicPack {
  return {
    topic,
    words: rows.map(([id, urdu, roman, meaning, emoji]) => ({
      id,
      urdu,
      roman,
      meaning,
      emoji,
      topic: topic.id,
    })),
  };
}
