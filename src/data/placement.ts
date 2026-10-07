import type { LearnTrack } from '../store/useSettingsStore';

/*
 * Data, not a screen: kept out of OnboardingScreen.tsx so a check can read the
 * answers without rendering React. check:controls drives a speaker through
 * the quick check with every answer right, which is the only way to reach the
 * longest "You're all set" screen (2026-10-08).
 */

/**
 * The placement check.
 *
 * Each question is tagged with the writing system it is asked in, because the
 * question immediately before this one is "do you want to learn the script?".
 * Answering "no" and then being shown four Nastaliq letters and asked whether
 * you recognise them is the app not listening — and it also measures nothing,
 * since the honest answer is "no" by construction. The Roman questions test
 * the same thing (how much Urdu do you already have?) in the alphabet the
 * learner just said they read.
 */
/**
 * The placement questions.
 *
 * Two things were wrong with these. The correct answer was written first in
 * every single one, and they were rendered in written order — so the whole
 * placement test could be passed by tapping the top option four times without
 * reading a word of it. They are shuffled at render now (see
 * `placementQuestions` in OnboardingScreen.tsx), and the answers are no longer written first here either, so the file
 * does not *look* like a key even though the shuffle is what makes it safe.
 *
 * And two of them were yes/no self-assessments. A learner's opinion of whether
 * they can read a word is weaker evidence than whether they actually can, and a
 * two-option question is a coin flip: guessing put someone a level up half the
 * time. Every question now demonstrates something, over exactly four options —
 * four fills the two-per-row grid, where a fifth sits alone on its own line.
 */
export const PLACEMENT: {
  q: string;
  sub: string;
  kind: 'script' | 'roman';
  options: { label: string; c: boolean }[];
}[] = [
  {
    q: 'Which letter is this?',
    sub: 'س',
    kind: 'script',
    options: [
      { label: 'sheen', c: false },
      { label: 'seen', c: true },
      { label: 'saad', c: false },
      { label: 'noon', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'پانی',
    kind: 'script',
    options: [
      { label: 'Bread', c: false },
      { label: 'Fire', c: false },
      { label: 'Water', c: true },
      { label: 'Door', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'کتاب',
    kind: 'script',
    options: [
      { label: 'Chair', c: false },
      { label: 'Book', c: true },
      { label: 'Road', c: false },
      { label: 'Hand', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'ghar',
    kind: 'roman',
    options: [
      { label: 'Tea', c: false },
      { label: 'Moon', c: false },
      { label: 'House', c: true },
      { label: 'Friend', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'paani',
    kind: 'roman',
    options: [
      { label: 'Book', c: false },
      { label: 'Water', c: true },
      { label: 'Night', c: false },
      { label: 'Rice', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'shukriya',
    kind: 'roman',
    options: [
      { label: 'Sorry', c: false },
      { label: 'Hello', c: false },
      { label: 'Goodbye', c: false },
      { label: 'Thank you', c: true },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'maañ',
    kind: 'roman',
    options: [
      { label: 'Father', c: false },
      { label: 'Mother', c: true },
      { label: 'Sister', c: false },
      { label: 'Daughter', c: false },
    ],
  },
];

/** The four questions a given track asks. */
export const placementFor = (track: LearnTrack) =>
  (track === 'roman' ? PLACEMENT.filter((p) => p.kind === 'roman') : PLACEMENT).slice(0, 4);
