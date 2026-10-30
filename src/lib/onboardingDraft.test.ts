import { describe, expect, it } from 'vitest';
import { resumableDraft } from './onboardingDraft';

const DAILY = ['casual', 'steady', 'serious'];
const saved = {
  step: 'track',
  goal: 'family',
  track: 'roman',
  voice: 'm',
  background: null,
  daily: 'serious',
  placement: null,
};

describe('resuming onboarding after a reload (Q-103)', () => {
  it('picks up where the learner was, with their answers', () => {
    expect(resumableDraft(saved, DAILY)).toEqual({ ...saved });
  });

  it('starts again from nothing, rubbish or the welcome', () => {
    expect(resumableDraft(null, DAILY)).toBeNull();
    expect(resumableDraft('track', DAILY)).toBeNull();
    expect(resumableDraft({ ...saved, step: 'somewhere' }, DAILY)).toBeNull();
    expect(resumableDraft({ ...saved, step: 'welcome' }, DAILY)).toBeNull();
  });

  it('sends a speaker past the quick check back to it only when its score was not kept', () => {
    for (const step of ['daily', 'ready']) {
      expect(resumableDraft({ ...saved, step, background: 'speaker' }, DAILY)?.step).toBe('placement');
    }
    expect(resumableDraft({ ...saved, step: 'ready', background: 'new' }, DAILY)?.step).toBe('ready');
  });

  it('keeps a finished quick check, so a reload after it does not ask it again (Q-141)', () => {
    for (const step of ['daily', 'ready']) {
      const d = resumableDraft({ ...saved, step, background: 'speaker', placement: 3 }, DAILY);
      expect([d?.step, d?.placement]).toEqual([step, 3]);
    }
    for (const placement of [-1, 1.5, '3', 'all']) {
      expect(resumableDraft({ ...saved, step: 'ready', background: 'speaker', placement }, DAILY)?.step).toBe(
        'placement'
      );
    }
  });

  it('goes back to the question a later step needs answered', () => {
    expect(resumableDraft({ ...saved, step: 'voice', goal: null }, DAILY)?.step).toBe('goal');
    expect(resumableDraft({ ...saved, step: 'daily', background: 'maybe' }, DAILY)?.step).toBe('background');
  });

  it('falls back to defaults for values it does not recognise', () => {
    const d = resumableDraft({ ...saved, track: 'klingon', voice: 7, daily: 'extreme' }, DAILY)!;
    expect([d.track, d.voice, d.daily]).toEqual(['both', 'f', 'steady']);
  });
});
