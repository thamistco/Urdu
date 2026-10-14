import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { BuildDirection, PromptCard, Question, palette, withAlpha } from './common';
import { Urdu, Txt, Bold, urduGlyph, urduLine } from '../components/Text';
import { WordArt } from '../components/Illustration';
import { Button } from '../components/Button';
import { feedback } from '../lib/feedback';
import { LETTERS, glyphName } from '../data/letters';
import type { ExerciseProps, Exercise } from './types';
import { buildLetters } from './buildLetters';
import { glossOf } from '../data/words';

type BuildEx = Extract<Exercise, { kind: 'wordBuild' }>;

const LETTER_NAME: Record<string, string> = Object.fromEntries(LETTERS.map((l) => [l.forms.isolated, l.name]));

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
      return `Missing ${glyphs} (${names}): without ${missing.length === 1 ? 'it' : 'them'}, this doesn’t spell the word.`;
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
export function WordBuildExercise({ exercise, showRoman, locked, onGraded, onExpand }: ExerciseProps<BuildEx>) {
  const { word, tiles } = exercise;
  const target = useMemo(() => buildLetters(word.urdu), [word]);
  /**
   * How many letters each word of the answer has: [5] for one word, [4, 5]
   * for گرم پانی. The tray shows that many empty slots, the next one marked,
   * with a gap between words. Testers had no way to see where a tile would
   * land, how long the word was, or that a two-word answer was two words: a
   * multi-word build read as one run of letters (QA report, 2026-10-12).
   */
  const groups = useMemo(
    () =>
      word.urdu
        .split(/\s+/)
        .map((w) => buildLetters(w).length)
        .filter((n) => n > 0),
    [word]
  );
  const [placed, setPlaced] = useState<number[]>([]); // indices into tiles
  const [graded, setGraded] = useState<boolean | null>(null);
  /**
   * One retry before the answer is shown (QA, 2026-10-13, C2). A first wrong
   * Check holds the attempt on screen with what went wrong and a "Try again";
   * only a second Check is graded. The first attempt stays readable under the
   * tray while the second is built.
   */
  const [held, setHeld] = useState<{ built: string; why: string | null } | null>(null);
  const [lastTry, setLastTry] = useState<string | null>(null);

  const available = tiles.map((_, i) => i).filter((i) => !placed.includes(i));

  const full = placed.length >= target.length;
  const frozen = graded != null || held != null;
  const place = (i: number) => {
    if (frozen || locked || full) return;
    feedback.tap();
    setPlaced((p) => [...p, i]);
  };
  const unplace = (i: number) => {
    if (frozen || locked) return;
    feedback.tap();
    setPlaced((p) => p.filter((x) => x !== i));
  };

  const check = () => {
    const built = placed.map((i) => tiles[i]).join('');
    const correct = built === target.join('');
    if (!correct && lastTry == null) {
      feedback.incorrect();
      setHeld({
        built: assembled,
        why: diagnoseBuild(
          placed.map((i) => tiles[i]),
          target
        ),
      });
      // The note and Try again open below the tiles; at 320x568 the button
      // sat 149px under the screen with nothing scrolled to it (design
      // review, 2026-10-14).
      setTimeout(() => onExpand?.(), 120);
      return;
    }
    setGraded(correct);
    correct
      ? feedback.correctAnnounceMeaning(word.id, word.urdu, word.roman, word.meaning)
      : feedback.incorrectAnnounce(word.id, word.urdu, word.roman);
    onGraded({ items: [{ id: word.id, type: 'word' }], correct, retried: lastTry != null });
  };

  // The tiles placed so far, with a space where one word of the answer ends,
  // so the script joins within a word and not across two.
  const assembled = (() => {
    let at = 0;
    const words: string[] = [];
    for (const n of groups) {
      words.push(
        placed
          .slice(at, at + n)
          .map((i) => tiles[i])
          .join('')
      );
      at += n;
    }
    return words.filter(Boolean).join(' ');
  })();
  // Slot k of the answer, word by word: what is in it, or null if empty.
  let slotAt = 0;
  const slotGroups = groups.map((n) => Array.from({ length: n }, () => slotAt++));
  const diagnosis =
    graded === false
      ? diagnoseBuild(
          placed.map((i) => tiles[i]),
          target
        )
      : null;

  return (
    <View>
      <PromptCard height={140}>
        <WordArt word={word} size={80} />
        <Txt style={{ color: palette.ink }} className="mt-2 text-sm opacity-65">
          {glossOf(word)}
          {showRoman ? ` · ${word.roman}` : ''}
        </Txt>
      </PromptCard>

      <View className="h-4" />
      <Question>Build the word</Question>

      {/* assembly line (RTL) */}
      <View
        className="mb-2 min-h-[70px] rounded-2xl border-2 border-dashed px-3 py-3"
        style={{
          borderColor: graded == null ? withAlpha(palette.paper, 0.25) : graded ? palette.jade : palette.rose,
        }}
      >
        {/* Tapped tiles show their isolated glyph — correct in isolation, but
            Urdu letters change shape to join their neighbours, so a row of
            isolated forms never actually looks like the word being spelled.
            This reads the same tiles as one continuous run of text instead,
            which lets the script's own shaping join them for real. */}
        <View className="mb-2 items-center justify-center" style={{ minHeight: 40 }}>
          {placed.length === 0 ? (
            <Txt className="text-sm text-paper/55">Tap the letters below</Txt>
          ) : (
            <Urdu style={{ fontSize: 30, lineHeight: urduLine(30) }}>{assembled}</Urdu>
          )}
        </View>
        <View className="flex-row-reverse flex-wrap items-center justify-center gap-x-4">
          {slotGroups.map((slots, g) => (
            <View key={g} className="flex-row-reverse flex-wrap items-center justify-center">
              {slots.map((k) => {
                const i = placed[k];
                if (i == null) {
                  // The next empty slot is marked: the answer to "where does
                  // this tile go?" before it is tapped.
                  const next = k === placed.length && graded == null;
                  return (
                    <View
                      key={`slot-${k}`}
                      accessible={false}
                      className="mx-1 my-1 rounded-xl"
                      style={{
                        width: 40,
                        height: 44,
                        borderWidth: next ? 2 : 1,
                        borderStyle: next ? 'solid' : 'dashed',
                        borderColor: next ? palette.gold : withAlpha(palette.paper, 0.25),
                      }}
                    />
                  );
                }
                // Once checked, a tile can no longer be taken back, so it no
                // longer says it can (QA report, 2026-10-12).
                const open = !frozen && !locked;
                return (
                  <Pressable
                    key={`${i}-${k}`}
                    onPress={() => unplace(i)}
                    disabled={!open}
                    accessibilityRole="button"
                    accessibilityLabel={`${glyphName(tiles[i]) ?? 'Letter'}, letter ${k + 1} of the word.${
                      open ? ' Tap to take it back.' : ''
                    }`}
                  >
                    <View
                      className="mx-1 my-1 items-center justify-center rounded-xl px-2"
                      style={{ minWidth: 40, height: 44, backgroundColor: withAlpha(palette.gold, 0.18) }}
                    >
                      <Urdu style={{ ...urduGlyph(26) }}>{tiles[i]}</Urdu>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <BuildDirection of="letter" />

      {/* tile tray */}
      <View className="mb-5 flex-row-reverse flex-wrap justify-center" style={{ opacity: full && !frozen ? 0.5 : 1 }}>
        {available.map((i) => (
          <Pressable
            key={i}
            onPress={() => place(i)}
            disabled={full || frozen}
            accessibilityRole="button"
            accessibilityLabel={`${glyphName(tiles[i]) ?? 'Letter tile'}. Tap to add it to the word.`}
          >
            <View className="m-1.5 rounded-xl border border-white/10 bg-ink-700 px-4 py-2">
              <Urdu style={{ ...urduGlyph(26) }}>{tiles[i]}</Urdu>
            </View>
          </Pressable>
        ))}
      </View>

      {held != null && (
        <View
          className="mb-4 items-center rounded-2xl px-4 py-3"
          style={{ backgroundColor: withAlpha(palette.gold, 0.1) }}
        >
          <Bold style={{ color: palette.goldLight }}>Not quite. One more try.</Bold>
          <Txt className="mt-1 text-xs text-paper/60">You built</Txt>
          <Urdu style={{ fontSize: 30, lineHeight: urduLine(30) }}>{held.built}</Urdu>
          {held.why && <Txt className="mt-1 text-center text-xs text-paper/70">{held.why}</Txt>}
        </View>
      )}
      {held != null && (
        <Button
          onPress={() => {
            feedback.tap();
            setLastTry(held.built);
            setHeld(null);
            setPlaced([]);
          }}
        >
          Try again
        </Button>
      )}
      {graded == null && held == null && (
        <>
          {lastTry ? <Txt className="mb-2 text-center text-xs text-paper/55">Last try: {lastTry}</Txt> : null}
          <Button variant={placed.length ? 'primary' : 'ghost'} disabled={placed.length === 0} onPress={check}>
            Check
          </Button>
        </>
      )}
      {graded === true && (
        <View className="items-center">
          <Bold style={{ color: palette.jade }}>Perfectly built ✓</Bold>
        </View>
      )}
      {graded === false && (
        // What the learner built, beside what went wrong with it. This box
        // used to repeat the answer, which the lesson's "The answer" card
        // below already shows, so a wrong build printed the word twice and
        // never the attempt: a learner whose letters did not follow the
        // Roman could not see where theirs went astray (QA report v3, L24).
        <View
          className="items-center rounded-2xl px-4 py-3"
          style={{ backgroundColor: withAlpha(palette.rose, 0.14), borderWidth: 2, borderColor: palette.rose }}
        >
          <Txt className="text-xs text-paper/60">You built</Txt>
          <Urdu style={{ fontSize: 34, lineHeight: urduLine(34) }}>{assembled}</Urdu>
          {diagnosis && <Txt className="mt-2 text-center text-xs text-paper/70">{diagnosis}</Txt>}
        </View>
      )}
    </View>
  );
}
