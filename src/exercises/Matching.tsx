import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Choice, Question, palette, type ChoiceState } from './common';
import { Txt, Bold } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { WordArt } from '../components/Illustration';
import { feedback } from '../lib/feedback';
import type { ExerciseProps, Exercise } from './types';
import { glossOf } from '../data/words';

type MatchEx = Extract<Exercise, { kind: 'matching' }>;
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** Drops-style matching board: pair each Urdu word with its picture. */
export function MatchingExercise({ exercise, track, locked, onGraded }: ExerciseProps<MatchEx>) {
  const { words } = exercise;
  const left = useMemo(() => shuffle(words), [words]);
  const right = useMemo(() => shuffle(words), [words]);

  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);

  const finish = (misses: number) => {
    setDone(true);
    const correct = misses === 0;
    correct ? feedback.correct() : feedback.incorrect();
    onGraded({ items: words.map((w) => ({ id: w.id, type: 'word' as const })), correct });
  };

  const tryPair = (l: string | null, r: string | null) => {
    if (!l || !r) return;
    if (l === r) {
      feedback.tap();
      const next = new Set(matched).add(l);
      setMatched(next);
      setSelLeft(null);
      setSelRight(null);
      if (next.size === words.length) finish(mistakes);
    } else {
      feedback.incorrect();
      setWrong(`${l}|${r}`);
      const m = mistakes + 1;
      setMistakes(m);
      setTimeout(() => {
        setWrong(null);
        setSelLeft(null);
        setSelRight(null);
      }, 550);
    }
  };

  const pickLeft = (id: string) => {
    if (locked || done || matched.has(id)) return;
    const next = selLeft === id ? null : id;
    setSelLeft(next);
    tryPair(next, selRight);
  };
  const pickRight = (id: string) => {
    if (locked || done || matched.has(id)) return;
    const next = selRight === id ? null : id;
    setSelRight(next);
    tryPair(selLeft, next);
  };

  const stateFor = (id: string, side: 'l' | 'r'): ChoiceState => {
    if (matched.has(id)) return 'correct';
    const sel = side === 'l' ? selLeft : selRight;
    if (wrong && wrong.includes(id) && sel === id) return 'wrong';
    // A tile you have tapped but not yet paired had no state of its own, so
    // the board looked identical before and after the first tap.
    if (sel === id) return 'selected';
    return 'idle';
  };

  return (
    <View>
      <Question>Match each word to its picture</Question>
      <View className="flex-row justify-between">
        <View className="w-[48%] gap-3">
          {left.map((w) => (
            <Choice
              key={w.id}
              state={stateFor(w.id, 'l')}
              disabled={matched.has(w.id) || done || locked}
              onPress={() => pickLeft(w.id)}
            >
              <Lexeme urdu={w.urdu} roman={w.roman} track={track} size={26} />
            </Choice>
          ))}
        </View>
        <View className="w-[48%] gap-3">
          {right.map((w) => (
            <Choice
              key={w.id}
              state={stateFor(w.id, 'r')}
              disabled={matched.has(w.id) || done || locked}
              onPress={() => pickRight(w.id)}
            >
              <WordArt word={w} size={40} />
              <Txt className="mt-1 text-[11px] capitalize text-paper/55">{glossOf(w)}</Txt>
            </Choice>
          ))}
        </View>
      </View>
      {done ? (
        <View className="mt-5 items-center">
          <Bold style={{ color: mistakes === 0 ? palette.jade : palette.gold }}>
            {mistakes === 0 ? 'Flawless board ✓' : `Solved with ${mistakes} slip${mistakes > 1 ? 's' : ''}`}
          </Bold>
        </View>
      ) : null}
    </View>
  );
}
