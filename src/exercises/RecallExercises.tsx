import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Choice, PromptCard, Question, palette, withAlpha } from './common';
import { Txt, Bold } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { WordArt } from '../components/Illustration';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { matchesWord } from '../lib/roman';
import type { ExerciseProps, Exercise } from './types';

type TypeEx = Extract<Exercise, { kind: 'typeWord' }>;
type ReverseEx = Extract<Exercise, { kind: 'wordFromMeaning' }>;

/**
 * Type the word from memory.
 *
 * Every other exercise in the app is recognition — pick one of four, or
 * reassemble pieces you were handed. This is the only one that asks the learner
 * to produce the word with nothing to choose from, which is both much harder
 * and much better evidence that they know it.
 *
 * Roman input is accepted (and expected — few learners have an Urdu keyboard),
 * with the spelling matched loosely; see `lib/roman.ts` for why.
 */
export function TypeWordExercise({ exercise, track, locked, onGraded }: ExerciseProps<TypeEx>) {
  const { word } = exercise;
  const [text, setText] = useState('');
  const [graded, setGraded] = useState<boolean | null>(null);
  const [focused, setFocused] = useState(false);

  const check = () => {
    if (graded != null || locked || !text.trim()) return;
    const correct = matchesWord(text, word.urdu, word.roman);
    setGraded(correct);
    correct ? feedback.correctAnnounce(word.id, word.urdu, word.roman) : feedback.incorrect();
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  const border =
    graded === true ? palette.jade : graded === false ? palette.rose : focused ? palette.gold : withAlpha(palette.white, 0.15);

  return (
    <View>
      <PromptCard height={150}>
        <WordArt word={word} size={76} />
        <Txt style={{ color: palette.ink }} className="mt-2 text-base font-semibold capitalize">
          {word.meaning}
        </Txt>
      </PromptCard>

      <View className="h-4" />
      <Question>Type this word</Question>

      <View
        className="mb-2 rounded-2xl bg-ink-700 px-4 py-3"
        style={{ borderWidth: 1.5, borderColor: border }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={check}
          editable={graded == null && !locked}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          returnKeyType="done"
          placeholder="type it in Roman or Urdu"
          placeholderTextColor={withAlpha(palette.cream, 0.3)}
          accessibilityLabel={`Type the Urdu for ${word.meaning}`}
          style={[
            { color: palette.cream, fontFamily: 'PublicSans', fontSize: 18, paddingVertical: 4 },
            { outlineStyle: 'none' } as object, // react-native-web only
          ]}
        />
      </View>
      <Txt className="mb-5 text-[11px] text-paper/40">
        Spelling is forgiving, kitab, kitaab and کتاب all count.
      </Txt>

      {graded == null && (
        <Button variant={text.trim() ? 'primary' : 'ghost'} disabled={!text.trim()} onPress={check}>
          Check
        </Button>
      )}

      {graded != null && (
        <View className="items-center">
          <Bold style={{ color: graded ? palette.jade : palette.rose }} className="mb-1">
            {graded ? 'From memory ✓' : 'The word is'}
          </Bold>
          {/* A wrong answer always gets the transliteration, whatever the
              track: being told only the shape you failed to recall teaches
              nothing about how to say it. */}
          <Lexeme urdu={word.urdu} roman={word.roman} track={graded ? track : 'both'} size={32} />
        </View>
      )}
    </View>
  );
}

/**
 * English prompt → pick the Urdu.
 *
 * The mirror of "pick the meaning", and the harder direction: recognising a
 * word you are shown is much easier than retrieving it from its meaning. It
 * also covers the large part of the vocabulary — ideas, qualities, abstractions
 * — that no picture can carry.
 */
export function WordFromMeaningExercise({ exercise, track, locked, onGraded }: ExerciseProps<ReverseEx>) {
  const { word, options } = exercise;
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    const correct = id === word.id;
    correct ? feedback.correctAnnounce(word.id, word.urdu, word.roman) : feedback.incorrect();
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  return (
    <View>
      <PromptCard height={130}>
        <Txt style={{ color: palette.ink }} className="text-center text-2xl font-semibold capitalize">
          {word.meaning}
        </Txt>
      </PromptCard>

      <View className="h-4" />
      <Question>How do you say it?</Question>

      <View className="flex-row flex-wrap justify-between">
        {options.map((o) => {
          const state =
            picked == null ? 'idle' : o.id === word.id ? 'correct' : o.id === picked ? 'wrong' : 'muted';
          return (
            <Choice
              key={o.id}
              state={state}
              disabled={picked != null || locked}
              onPress={() => choose(o.id)}
              className="mb-3 w-[48%]"
            >
              <Lexeme urdu={o.urdu} roman={o.roman} track={track} size={26} />
            </Choice>
          );
        })}
      </View>
    </View>
  );
}
