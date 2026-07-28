import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { BuildDirection, PromptCard, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, urduGlyph, urduLine } from '../components/Text';
import { WordArt } from '../components/Illustration';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { LETTERS } from '../data/letters';
import type { ExerciseProps, Exercise } from './types';

type BuildEx = Extract<Exercise, { kind: 'wordBuild' }>;

const LETTER_NAME: Record<string, string> = Object.fromEntries(
  LETTERS.map((l) => [l.forms.isolated, l.name])
);

/**
 * What's actually wrong with a wrong build, for the two mistakes common
 * enough to name specifically: a letter left out, or the right letters in
 * the wrong order. Anything messier (a decoy tile mixed in, several letters
 * off) falls through to no message — a guess at what went wrong is worse
 * than the plain "here's the word" reveal underneath this.
 */
function diagnoseBuild(assembled: string[], target: string[]): string | null {
  if (assembled.join('') === target.join('')) return null;

  if (assembled.length === target.length && [...assembled].sort().join('') === [...target].sort().join('')) {
    return 'Right letters, wrong order.';
  }

  if (assembled.length < target.length) {
    let ai = 0;
    const missing: string[] = [];
    for (const t of target) {
      if (ai < assembled.length && assembled[ai] === t) ai++;
      else missing.push(t);
    }
    // every placed tile matched, in order — the gaps are exactly what's missing
    if (ai === assembled.length && missing.length > 0) {
      const names = missing.map((c) => LETTER_NAME[c] ?? c).join(', ');
      const glyphs = missing.join('');
      return `Missing ${glyphs} (${names}): without ${missing.length === 1 ? 'it' : 'them'}, this doesn't spell the word.`;
    }
  }

  return null;
}

/**
 * Build the Urdu word from scrambled letter tiles. Kinesthetic reinforcement —
 * the learner assembles the script right-to-left, feeling how letters sequence.
 * Note: tiles show isolated glyphs; the target is a left-to-right code-point
 * match of the assembled string against the word.
 */
export function WordBuildExercise({ exercise, showRoman, locked, onGraded }: ExerciseProps<BuildEx>) {
  const { word, tiles } = exercise;
  const target = useMemo(() => Array.from(word.urdu).filter((c) => c.trim().length > 0), [word]);
  const [placed, setPlaced] = useState<number[]>([]); // indices into tiles
  const [graded, setGraded] = useState<boolean | null>(null);

  const available = tiles.map((_, i) => i).filter((i) => !placed.includes(i));

  const place = (i: number) => {
    if (graded != null || locked) return;
    feedback.tap();
    setPlaced((p) => [...p, i]);
  };
  const unplace = (i: number) => {
    if (graded != null || locked) return;
    feedback.tap();
    setPlaced((p) => p.filter((x) => x !== i));
  };

  const check = () => {
    const built = placed.map((i) => tiles[i]).join('');
    const correct = built === target.join('');
    setGraded(correct);
    correct ? feedback.correctAnnounce(word.id, word.urdu, word.roman)
      : feedback.incorrectAnnounce(word.id, word.urdu, word.roman);
    onGraded({ items: [{ id: word.id, type: 'word' }], correct });
  };

  const assembled = placed.map((i) => tiles[i]).join('');
  const diagnosis = graded === false ? diagnoseBuild(placed.map((i) => tiles[i]), target) : null;

  return (
    <View>
      <PromptCard height={140}>
        <WordArt word={word} size={80} />
        <Txt style={{ color: palette.ink }} className="mt-2 text-sm opacity-60 capitalize">
          {word.meaning}
          {showRoman ? ` · ${word.roman}` : ''}
        </Txt>
      </PromptCard>

      <View className="h-4" />
      <Question>Build the word</Question>

      {/* assembly line (RTL) */}
      <View
        className="mb-2 min-h-[70px] rounded-2xl border-2 border-dashed px-3 py-3"
        style={{
          borderColor:
            graded == null ? withAlpha(palette.paper, 0.25) : graded ? palette.jade : palette.rose,
        }}
      >
        {placed.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Txt className="text-sm text-paper/30">Tap letters below…</Txt>
          </View>
        ) : (
          <>
            {/* Tapped tiles show their isolated glyph — correct in isolation, but
                Urdu letters change shape to join their neighbours, so a row of
                isolated forms never actually looks like the word being spelled.
                This reads the same tiles as one continuous run of text instead,
                which lets the script's own shaping join them for real. */}
            <View className="mb-2 items-center justify-center" style={{ minHeight: 40 }}>
              <Urdu style={{ fontSize: 30, lineHeight: urduLine(30) }}>{assembled}</Urdu>
            </View>
            <View className="flex-row-reverse flex-wrap items-center justify-center">
              {placed.map((i, order) => (
                <Pressable
                  key={`${i}-${order}`}
                  onPress={() => unplace(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Letter ${order + 1} of the word. Tap to take it back.`}
                >
                  <View
                    className="mx-1 my-1 rounded-xl px-3 py-1"
                    style={{ backgroundColor: withAlpha(palette.gold, 0.18) }}
                  >
                    <Urdu style={{ ...urduGlyph(26) }}>{tiles[i]}</Urdu>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      <BuildDirection />

      {/* tile tray */}
      <View className="mb-5 flex-row flex-wrap justify-center">
        {available.map((i) => (
          <Pressable
            key={i}
            onPress={() => place(i)}
            accessibilityRole="button"
            accessibilityLabel="Letter tile. Tap to add it to the word."
          >
            <View className="m-1.5 rounded-xl border border-white/10 bg-ink-700 px-4 py-2">
              <Urdu style={{ ...urduGlyph(26) }}>{tiles[i]}</Urdu>
            </View>
          </Pressable>
        ))}
      </View>

      {graded == null && (
        <Button
          variant={placed.length ? 'primary' : 'ghost'}
          disabled={placed.length === 0}
          onPress={check}
        >
          Check
        </Button>
      )}
      {graded === true && (
        <View className="items-center">
          <Bold style={{ color: palette.jade }}>Perfectly built ✓</Bold>
        </View>
      )}
      {graded === false && (
        // The answer used to be a bare label and a glyph at the very bottom of
        // the exercise, which the feedback banner — appearing at the same
        // moment — covered, so a wrong build showed the word "Correct:" and
        // nothing else. Boxing it makes it a thing on the page rather than a
        // trailing line, and the lesson now scrolls clear of the banner.
        <View
          className="items-center rounded-2xl px-4 py-3"
          style={{ backgroundColor: withAlpha(palette.rose, 0.14), borderWidth: 2, borderColor: palette.rose }}
        >
          <Txt className="text-xs text-paper/60">The word is</Txt>
          <Urdu style={{ fontSize: 34, lineHeight: urduLine(34) }}>{word.urdu}</Urdu>
          <Txt className="text-xs text-paper/60">{word.roman}</Txt>
          {diagnosis && (
            <Txt className="mt-2 text-center text-xs text-paper/70">{diagnosis}</Txt>
          )}
        </View>
      )}
    </View>
  );
}
