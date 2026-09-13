import { useState, useEffect } from 'react';
import { View } from 'react-native';

import { PromptCard, palette, withAlpha } from './common';
import { Txt, Bold, Eyebrow, Urdu, urduGlyph } from '../components/Text';
import { Button } from '../components/Button';
import { SpeakerButton } from './common';
import { feedback } from '../lib/feedback';
import { announce } from '../lib/speech';
import { POSITIONS } from '../data/letters';
import type { ExerciseProps, Exercise } from './types';

type TeachEx = Extract<Exercise, { kind: 'letterTeach' }>;

/**
 * A letter, introduced.
 *
 * The four joining forms are what this course is for, and until now they were
 * only ever asked about. A beginner met 34 position questions in one run, got
 * 8, and finished still not knowing the rule — reasonably, since no screen had
 * ever stated it. Seeing alone, start, middle and end laid out together, with
 * the same letter in each, is the whole explanation and takes one look.
 *
 * The forms are shown in the course's own reading direction, right to left, so
 * the row reads the way the word it describes does.
 *
 * Not graded, and covered by `isTeaching`, so it costs no heart and cannot be
 * failed — the treatment `grammarTeach` has always had.
 */
export function LetterTeachExercise({ exercise, onGraded }: ExerciseProps<TeachEx>) {
  const { letter } = exercise;
  const [done, setDone] = useState(false);

  useEffect(() => {
    announce(letter.id, letter.forms.isolated, letter.name);
  }, [letter.id, letter.forms.isolated, letter.name]);

  const go = () => {
    if (done) return;
    setDone(true);
    feedback.tap();
    // Nothing here is evidence of recall, so no item is graded: scheduling a
    // letter as known on the strength of having been looked at would push its
    // first real review out before it had one.
    onGraded({ items: [], correct: true });
  };

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-3 text-center">
        A new letter
      </Eyebrow>

      <PromptCard height={170}>
        <Urdu style={{ ...urduGlyph(64), color: palette.ink }}>{letter.forms.isolated}</Urdu>
        <Txt style={{ color: palette.ink }} className="mt-2 text-center text-base opacity-70">
          {letter.name} · sounds like “{letter.sound}”
        </Txt>
        <View className="mt-2">
          <SpeakerButton
            onPress={() => announce(letter.id, letter.forms.isolated, letter.name)}
            label={`Hear ${letter.name}`}
          />
        </View>
      </PromptCard>

      {/* The rule, shown rather than described. Right to left, so the row
          reads in the direction the forms are talking about. */}
      <Txt className="mb-2 mt-5 text-center text-xs text-paper/60">It changes shape depending on where it sits</Txt>
      <View className="flex-row-reverse justify-center gap-2">
        {POSITIONS.map((p) => (
          <View
            key={p.key}
            className="min-w-[68px] flex-1 items-center rounded-2xl px-2 py-3"
            style={{ backgroundColor: withAlpha(palette.paper, 0.07) }}
          >
            <Urdu style={{ ...urduGlyph(30) }}>{letter.forms[p.key]}</Urdu>
            <Bold className="mt-2 text-[11px] text-paper/75">{p.label}</Bold>
            <Txt className="text-center text-[10px] leading-3 text-paper/45">{p.hint}</Txt>
          </View>
        ))}
      </View>

      {/* One real word, so the letter is met inside something before it is
          asked about on its own. */}
      <View className="mt-5 items-center">
        <Txt className="mb-1 text-xs text-paper/55">As in</Txt>
        <Urdu style={{ ...urduGlyph(30) }}>{letter.word}</Urdu>
        <Txt className="mt-1 text-xs text-paper/70">
          {letter.roman} · {letter.meaning}
        </Txt>
      </View>

      {letter.functionNote ? <Txt className="mt-4 text-center text-xs text-paper/55">{letter.functionNote}</Txt> : null}

      <View className="h-6" />
      <Button onPress={go} disabled={done}>
        Got it
      </Button>
    </View>
  );
}
