import { useState, useEffect } from 'react';
import { View } from 'react-native';

import { PromptCard, palette } from './common';
import { Txt, Eyebrow } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { WordArt } from '../components/Illustration';
import { SpeakerButton } from './common';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { announce } from '../lib/speech';
import { glossOf } from '../data/words';
import type { ExerciseProps, Exercise } from './types';

type TeachEx = Extract<Exercise, { kind: 'wordTeach' }>;

/**
 * A word, introduced. Picture, script, reading, meaning, sound — and no
 * question.
 *
 * This is the screen the course did not have. Every other word exercise asks
 * something, and for a word's first appearance there was no fair way to answer:
 * the picture in `multipleChoice` says what the thing is but not which of four
 * Urdu strings names it, and the script in `meaningPick` says nothing at all
 * about what it means. The learner guessed, lost a heart, and *then* got the
 * explanation, as a correction. A playtest run scored 20% on words the app had
 * never shown against 73% on words it had — the app teaches well and was only
 * doing it after the fact.
 *
 * Deliberately not graded, and `isTeaching` in `LessonScreen` covers it, so it
 * costs no heart and cannot be failed — the same treatment `grammarTeach` has
 * always had.
 *
 * The word is spoken on arrival rather than waiting to be asked for. This is
 * the one screen where the learner has nothing to do, so a sound they did not
 * request is information rather than interruption, and hearing it alongside the
 * script is most of what the screen is for. The speaker stays for a second
 * listen.
 */
export function WordTeachExercise({ exercise, track, onGraded }: ExerciseProps<TeachEx>) {
  const { word } = exercise;
  const [done, setDone] = useState(false);

  useEffect(() => {
    announce(word.id, word.urdu, word.roman);
  }, [word.id, word.urdu, word.roman]);

  // Long phrases need smaller type to stay on one line; the sizes match
  // `meaningPick`, which shows the same strings in the same card.
  const len = word.urdu.length;
  const fs = len > 16 ? 26 : len > 9 ? 36 : 56;

  const go = () => {
    if (done) return;
    setDone(true);
    feedback.tap();
    // A card cannot be failed, and nothing here is evidence of recall, so no
    // item is graded: scheduling this as a correct answer would push the word's
    // next review out on the strength of having been looked at.
    onGraded({ items: [], correct: true });
  };

  return (
    <View>
      <Eyebrow style={{ color: palette.gold }} className="mb-3 text-center">
        A new word
      </Eyebrow>

      <PromptCard height={len > 9 ? 232 : 248}>
        <WordArt word={word} size={72} />
        <View className="mt-2">
          <Lexeme urdu={word.urdu} roman={word.roman} track={track} size={fs} color={palette.ink} />
        </View>
        <Txt style={{ color: palette.ink }} className="mt-2 text-center text-base capitalize opacity-70">
          {glossOf(word)}
        </Txt>
        <View className="mt-3">
          <SpeakerButton onPress={() => announce(word.id, word.urdu, word.roman)} label={`Hear ${word.roman}`} />
        </View>
      </PromptCard>

      <View className="h-6" />
      <Button onPress={go} disabled={done}>
        Got it
      </Button>
    </View>
  );
}
