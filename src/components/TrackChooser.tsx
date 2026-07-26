import { View, Pressable } from 'react-native';
import { Txt, Bold, Eyebrow } from './Text';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { SCRIPT_LESSON_COUNT, TOTAL_LESSON_COUNT } from '../data/units';
import type { LearnTrack } from '../store/useSettingsStore';

/**
 * Choosing how to learn.
 *
 * This is the only setting in the app that changes what the course *is* rather
 * than how it looks, so it is the one that has to be explained rather than
 * labelled. Picking Roman removes the alphabet lessons from the path and
 * rewrites every exercise into transliteration; picking Script takes the
 * transliteration away entirely. A learner who reads "Roman Urdu — a faster
 * start" has no way to know either of those things, and will find out by being
 * surprised.
 *
 * So each option says what it gives, what it costs, and who it is for, in that
 * order — and the numbers are read from the path itself rather than typed in,
 * so they cannot drift away from the truth.
 */

type Option = {
  key: LearnTrack;
  label: string;
  /** one line: what this track is */
  summary: string;
  /** what you get, and what you give up */
  gains: string[];
  costs: string[];
  /** who should pick it */
  forWhom: string;
  recommended?: boolean;
};

export const TRACK_OPTIONS: Option[] = [
  {
    key: 'script',
    label: 'Script first',
    summary: 'Learn the Urdu alphabet, and read everything the way it is really written.',
    gains: ['All 40 letters, in each of their four shapes', 'Tracing practice: you write them yourself'],
    costs: ['No transliteration to fall back on'],
    forWhom: 'Best if you want to read signs, books and messages.',
  },
  {
    key: 'both',
    label: 'Both together',
    summary: 'Every word in Nastaliq with the Roman underneath it.',
    gains: ['The alphabet, but never on its own', 'You pick up the letters while you learn to speak'],
    costs: ['Slower at the start than Roman alone'],
    forWhom: 'Best if you are not sure: this is the whole course, with the most help.',
    recommended: true,
  },
  {
    key: 'roman',
    label: 'Roman Urdu',
    summary: 'No alphabet. Everything in Latin letters: “aap kaise hain?”',
    gains: [
      'Straight into words, sentences and conversation',
      'Listening and answering, all in Roman',
    ],
    costs: [
      `Skips the ${SCRIPT_LESSON_COUNT} alphabet lessons and all tracing`,
      'You will not be able to read Urdu writing',
    ],
    forWhom: 'Best if you mainly want to speak and understand.',
  },
];

function Bullet({ text, kind }: { text: string; kind: 'gain' | 'cost' }) {
  const colour = kind === 'gain' ? palette.jadeLight : withAlpha(palette.cream, 0.45);
  return (
    <View className="mt-1 flex-row gap-2">
      <Txt style={{ color: colour }} className="text-xs leading-5">
        {kind === 'gain' ? '✓' : '·'}
      </Txt>
      <Txt style={{ color: colour }} className="flex-1 text-xs leading-5">
        {text}
      </Txt>
    </View>
  );
}

export function TrackChooser({
  value,
  onChange,
  /** the compact form used in Settings, where the choice has already been made once */
  compact = false,
}: {
  value: LearnTrack;
  onChange: (t: LearnTrack) => void;
  compact?: boolean;
}) {
  return (
    <View>
      <Txt className="mb-4 text-xs leading-5 text-paper/55">
        This changes what the course teaches, not just how it looks: the {TOTAL_LESSON_COUNT}
        -lesson path is rebuilt around your answer. You can switch whenever you like, in
        Settings; nothing you have already learned is lost.
      </Txt>

      <View className="gap-3">
        {TRACK_OPTIONS.map((t) => {
          const sel = value === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${t.label}. ${t.summary} ${t.forWhom}`}
              onPress={() => {
                feedback.tap();
                onChange(t.key);
              }}
            >
              <View
                className="rounded-2xl border p-4"
                style={{
                  borderColor: sel ? palette.gold : withAlpha(palette.white, 0.1),
                  backgroundColor: sel ? withAlpha(palette.gold, 0.1) : palette.ink700,
                  borderWidth: 2,
                }}
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <Bold style={{ color: sel ? palette.gold : palette.cream }} className="text-[15px]">
                    {t.label}
                  </Bold>
                  {t.recommended ? (
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: withAlpha(palette.jade, 0.2) }}
                    >
                      <Eyebrow style={{ color: palette.jadeLight, fontSize: 9 }}>Recommended</Eyebrow>
                    </View>
                  ) : null}
                </View>

                <Txt className="text-xs leading-5 text-paper/70">{t.summary}</Txt>

                {/* The detail is only worth the space on the screen where the
                    decision is actually being made for the first time. */}
                {compact && !sel ? null : (
                  <View className="mt-2">
                    {t.gains.map((g) => (
                      <Bullet key={g} text={g} kind="gain" />
                    ))}
                    {t.costs.map((c) => (
                      <Bullet key={c} text={c} kind="cost" />
                    ))}
                    <Txt className="mt-2 text-[11px] italic leading-4 text-paper/45">{t.forWhom}</Txt>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
