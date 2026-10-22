import { describe, it, expect } from 'vitest';

import { TOPIC_ICON } from './topicIcons';
import { TOPICS } from '../data/words';

/** Topics drawn specially, not from this map (see LessonIcon and TopicArt). */
const DRAWN_ELSEWHERE = new Set(['numbers', 'numbers-more', 'colours']);

describe('topic icons', () => {
  it('gives every topic a drawn icon', () => {
    const missing = TOPICS.filter((t) => !DRAWN_ELSEWHERE.has(t.id) && !TOPIC_ICON[t.id]).map((t) => t.id);
    expect(missing).toEqual([]);
  });
});
