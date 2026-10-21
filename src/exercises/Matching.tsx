import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { keepFocus } from '../lib/focusLost';
import { Choice, Question, palette, type ChoiceState } from './common';
import { Txt, Bold } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { WordArt } from '../components/Illustration';
import { feedback } from '../lib/feedback';
import { shuffle } from '../lib/shuffle';
import type { ExerciseProps, Exercise } from './types';
import { glossOf } from '../data/words';

type MatchEx = Extract<Exercise, { kind: 'matching' }>;

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
  // The last wrong pair, said in words until the next match. A red flash of
  // half a second (and a sound, silent with effects off) was all a slip got,
  // and a tester read it as no feedback at all (2026-10-12).
  const [slip, setSlip] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  /** Every word that was part of a wrong pair. They, and only they, go back
   *  into review as missed (QA, 2026-10-13, H4). */
  const [slipped, setSlipped] = useState<Set<string>>(new Set());

  // A matched pair is disabled, and the tile that had focus with it, so the
  // browser dropped focus to the page after every pair but the last: a
  // keyboard user's next Tab started again at the close button (QA,
  // 2026-10-20). Focus goes on to the first word still unmatched; after the
  // last pair the answer banner takes it.
  const wordsRef = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || matched.size === 0 || matched.size === words.length) return;
    return keepFocus(() => {
      const column = wordsRef.current as unknown as HTMLElement | null;
      column?.querySelector<HTMLElement>('[role="button"]:not([aria-disabled="true"])')?.focus({ preventScroll: true });
    });
  }, [matched, words.length]);

  const finish = (misses: number) => {
    setDone(true);
    const correct = misses === 0;
    correct ? feedback.correct() : feedback.incorrect();
    // A clean board credits every word on it. One with slips grades only the
    // words that slipped, as missed: the ones matched first time were known,
    // and grading the whole board wrong scheduled them as if they were not.
    const ids = correct ? words.map((w) => w.id) : [...slipped];
    onGraded({ items: ids.map((id) => ({ id, type: 'word' as const })), correct });
  };

  const tryPair = (l: string | null, r: string | null) => {
    if (!l || !r) return;
    if (l === r) {
      feedback.tap();
      setSlip(null);
      const next = new Set(matched).add(l);
      setMatched(next);
      setSelLeft(null);
      setSelRight(null);
      if (next.size === words.length) finish(mistakes);
    } else {
      feedback.incorrect();
      setWrong(`${l}|${r}`);
      setSlip(l);
      setSlipped((prev) => new Set(prev).add(l).add(r));
      const m = mistakes + 1;
      setMistakes(m);
      // Long enough to see which two were wrong and where each belonged: the
      // pair stays red and each one's real partner is outlined. A 0.55s flash
      // read as no feedback at all (QA, 2026-10-13, H4).
      setTimeout(() => {
        setWrong(null);
        setSelLeft(null);
        setSelRight(null);
      }, 1500);
    }
  };

  // While a wrong pair is being shown, taps wait: the board resets when it
  // clears, and a tap in that window was silently thrown away.
  const pickLeft = (id: string) => {
    if (locked || done || wrong || matched.has(id)) return;
    const next = selLeft === id ? null : id;
    setSelLeft(next);
    tryPair(next, selRight);
  };
  const pickRight = (id: string) => {
    if (locked || done || wrong || matched.has(id)) return;
    const next = selRight === id ? null : id;
    setSelRight(next);
    tryPair(selLeft, next);
  };

  const stateFor = (id: string, side: 'l' | 'r'): ChoiceState => {
    if (matched.has(id)) return 'correct';
    const sel = side === 'l' ? selLeft : selRight;
    if (wrong && wrong.includes(id) && sel === id) return 'wrong';
    // The real partner of either tile in a wrong pair, outlined while the
    // pair is shown wrong.
    if (wrong) {
      const [wl, wr] = wrong.split('|');
      if ((side === 'r' && id === wl) || (side === 'l' && id === wr)) return 'selected';
    }
    // A tile you have tapped but not yet paired had no state of its own, so
    // the board looked identical before and after the first tap.
    if (sel === id) return 'selected';
    return 'idle';
  };

  return (
    <View>
      {/* "its picture" over a board whose right side is mostly English, with
          a keycap 1 beside "Monday" (QA report v3, L20). */}
      <Question>Match each word to its meaning</Question>
      <View className="flex-row justify-between">
        <View ref={wordsRef} className="w-[48%] gap-3">
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
              <Txt className="mt-1 text-[0.6875rem] text-paper/55">{glossOf(w)}</Txt>
            </Choice>
          ))}
        </View>
      </View>
      {!done && slip ? (
        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-2" aria-live="polite">
          <Bold style={{ color: palette.roseLight }}>Not quite:</Bold>
          {words
            .filter((w) => w.id === slip)
            .map((w) => (
              <View key={w.id} className="flex-row flex-wrap items-center gap-x-2">
                <Lexeme urdu={w.urdu} roman={w.roman} track={track} size={20} />
                <Txt className="text-sm text-paper/80">means “{glossOf(w)}”</Txt>
              </View>
            ))}
        </View>
      ) : null}
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
