/**
 * Onboarding's answers so far, kept so a reload does not start it again.
 *
 * Every answer lived in the screen's own state, so a reload partway through
 * (a tab put away, a phone that killed the page) went back to the welcome with
 * the goal gone (design review and testers, Q-103). The draft is a field of
 * the existing settings store, never a new storage key, and is cleared when
 * onboarding finishes.
 *
 * The quick check's score is kept once it is finished, since it decides
 * whether a speaker is offered the alphabet skip: a reload on the daily goal
 * or ready step reran all four questions (QA, 2026-10-29, Q-141). A reload
 * partway through it still starts it again from the first question. The skip
 * itself is opt-in and starts off again.
 */

export type DraftStep = 'welcome' | 'goal' | 'track' | 'voice' | 'background' | 'placement' | 'daily' | 'ready';

export type OnboardingDraft = {
  step: DraftStep;
  goal: 'family' | 'read' | 'heritage' | 'curious' | null;
  track: 'script' | 'roman' | 'both';
  voice: 'f' | 'm';
  background: 'new' | 'speaker' | null;
  daily: string;
  /** Right answers in the finished quick check; null until it is finished. */
  placement: number | null;
};

const STEPS: readonly DraftStep[] = ['welcome', 'goal', 'track', 'voice', 'background', 'placement', 'daily', 'ready'];
const GOALS = ['family', 'read', 'heritage', 'curious'] as const;
const TRACKS = ['script', 'roman', 'both'] as const;

const oneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value);

/**
 * A saved draft made safe to resume, or null to start from the welcome.
 *
 * Anything unrecognised starts again rather than guessing. A speaker saved
 * past the quick check without its score goes back to it; a step that needs
 * an earlier answer the draft lacks goes back to the step that asks it.
 */
export function resumableDraft(saved: unknown, dailyIds: readonly string[]): OnboardingDraft | null {
  if (!saved || typeof saved !== 'object') return null;
  const d = saved as Record<string, unknown>;
  if (!oneOf(STEPS, d.step) || d.step === 'welcome') return null;
  return backToAnswered(answersIn(d, d.step, dailyIds));
}

/** The draft's answers, each kept only if it is one the screen could have given. */
function answersIn(d: Record<string, unknown>, step: DraftStep, dailyIds: readonly string[]): OnboardingDraft {
  return {
    step,
    goal: oneOf(GOALS, d.goal) ? d.goal : null,
    track: oneOf(TRACKS, d.track) ? d.track : 'both',
    voice: d.voice === 'm' ? 'm' : 'f',
    background: d.background === 'new' || d.background === 'speaker' ? d.background : null,
    daily: typeof d.daily === 'string' && dailyIds.includes(d.daily) ? d.daily : 'steady',
    placement: Number.isInteger(d.placement) && (d.placement as number) >= 0 ? (d.placement as number) : null,
  };
}

/** Back to the first step whose answer a later one needs and the draft lacks. */
function backToAnswered(draft: OnboardingDraft): OnboardingDraft {
  const at = STEPS.indexOf(draft.step);
  if (!draft.goal && at > STEPS.indexOf('goal')) return { ...draft, step: 'goal' };
  if (!draft.background && at > STEPS.indexOf('background')) return { ...draft, step: 'background' };
  if (draft.background === 'speaker' && draft.placement === null && at > STEPS.indexOf('placement')) {
    return { ...draft, step: 'placement' };
  }
  return draft;
}
