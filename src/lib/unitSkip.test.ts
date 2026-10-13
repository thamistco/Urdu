import { describe, expect, it } from 'vitest';
import { lessonsToSkip, UNIT_SKIP_MIN_ASKED } from './unitSkip';
import type { Lesson } from '../data/units';

const L = (id: string, kind: Lesson['kind'] = 'vocab') => ({ id, kind }) as Lesson;
const unit = [L('l-a', 'letters'), L('v-b'), L('v-c'), L('rev-x', 'review')];
const none = () => false;

describe('lessonsToSkip', () => {
  it('skips nothing on a review that asked too few of the unit’s own items, however well it went', () => {
    // A learner who jumped ahead: the review asked about earlier units only.
    expect(lessonsToSkip(unit, 'rev-x', { asked: 0, right: 0 }, none, false)).toEqual([]);
    expect(lessonsToSkip(unit, 'rev-x', { asked: UNIT_SKIP_MIN_ASKED - 1, right: 9 }, none, false)).toEqual([]);
    expect(lessonsToSkip(unit, 'rev-x', undefined, none, false)).toEqual([]);
  });
  it('skips nothing under 80% on the unit’s own items', () => {
    expect(lessonsToSkip(unit, 'rev-x', { asked: 10, right: 7 }, none, false)).toEqual([]);
  });
  it('skips the unfinished lessons on enough evidence, never the review or what is done', () => {
    expect(lessonsToSkip(unit, 'rev-x', { asked: 10, right: 8 }, (id) => id === 'v-b', false)).toEqual(['l-a', 'v-c']);
  });
  it('leaves letter lessons alone on the Roman track', () => {
    expect(lessonsToSkip(unit, 'rev-x', { asked: 12, right: 12 }, none, true)).toEqual(['v-b', 'v-c']);
  });
});
