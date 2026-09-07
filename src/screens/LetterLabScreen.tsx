import { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Reveal } from '../components/Reveal';
import { Txt, Bold, Eyebrow, Urdu, urduLine, urduGlyph } from '../components/Text';
import { TracePad, tracePadKey } from '../components/TracePad';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { speak } from '../lib/speech';
import { LETTERS, POSITIONS, PositionKey } from '../data/letters';
import { useProgressStore } from '../store/useProgressStore';
import { Illustration } from '../components/Illustration';

export function LetterLabScreen() {
  const nav = useNavigation();
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState<PositionKey>('isolated');
  // The Lab is where you go to study a letter, so it is the right place to
  // practise writing one — same pad and same scoring as the lesson, without
  // the hearts.
  const [tracing, setTracing] = useState(false);
  const learned = useProgressStore((s) => s.learnedLetters);
  const letter = LETTERS[idx];

  const selectLetter = (i: number) => {
    feedback.tap();
    setIdx(i);
    setPos('isolated');
    setTracing(false);
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={() => nav.goBack()} label={`${learned.length} / ${LETTERS.length} learned`} />

        {/* letter rail */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-1">
          {LETTERS.map((l, i) => {
            const active = i === idx;
            const known = learned.includes(l.id);
            return (
              <Pressable key={l.id} onPress={() => selectLetter(i)} className="mx-1">
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: active ? palette.gold : withAlpha(palette.white, 0.1),
                    backgroundColor: active ? withAlpha(palette.gold, 0.15) : palette.ink700,
                    borderWidth: 2,
                  }}
                >
                  <Urdu style={{ color: active ? palette.gold : palette.paper, ...urduGlyph(20) }}>
                    {l.forms.isolated}
                  </Urdu>
                  {known && (
                    <View
                      className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full"
                      style={{ backgroundColor: palette.jade }}
                    >
                      <Txt style={{ fontSize: 9, color: palette.white }}>✓</Txt>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <Reveal key={letter.id}>
          <View className="mb-1 flex-row items-center justify-center gap-2">
            <Eyebrow style={{ color: palette.gold }}>
              {letter.name} · “{letter.sound}”
            </Eyebrow>
            {!letter.connects && (
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: withAlpha(palette.rose, 0.2) }}>
                <Eyebrow style={{ color: palette.roseLight, fontSize: 8 }}>Never joins forward</Eyebrow>
              </View>
            )}
          </View>

          {/* the paper — read it, or write it */}
          <View className="my-4">
            {tracing ? (
              <TracePad key={tracePadKey(letter.id, pos)} letter={letter} position={pos} />
            ) : (
              <Pressable onPress={() => speak(letter.word, letter.roman)}>
                <View
                  className="rounded-2xl bg-parchment px-6 pb-5 pt-3"
                  style={{ borderWidth: 2, borderColor: palette.ink }}
                >
                  <View className="h-44 items-center justify-center">
                    <Urdu key={pos} style={{ color: palette.ink, ...urduGlyph(72) }}>
                      {letter.forms[pos]}
                    </Urdu>
                  </View>
                  <View className="items-center border-t pt-3" style={{ borderTopColor: withAlpha(palette.ink, 0.1) }}>
                    <Txt style={{ color: palette.ink }} className="text-xs opacity-60">
                      {POSITIONS.find((p) => p.key === pos)?.hint} · tap to hear
                    </Txt>
                  </View>
                </View>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                feedback.tap();
                setTracing((t) => !t);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: tracing }}
              accessibilityLabel={tracing ? 'Stop tracing and read the letter' : 'Trace this letter'}
              className="mt-3 self-center"
            >
              <View
                className="flex-row items-center justify-center gap-2 rounded-full px-4"
                style={{
                  minHeight: 44,
                  backgroundColor: tracing ? withAlpha(palette.gold, 0.2) : 'transparent',
                  borderWidth: 1.5,
                  borderColor: tracing ? palette.gold : withAlpha(palette.cream, 0.2),
                }}
              >
                <Illustration name="pen" tile={false} size={16} />
                <Bold className="text-xs" style={{ color: tracing ? palette.gold : withAlpha(palette.cream, 0.7) }}>
                  {tracing ? 'Back to reading' : 'Trace it'}
                </Bold>
              </View>
            </Pressable>
          </View>

          {/* position dial */}
          <View className="mb-5 flex-row gap-2">
            {POSITIONS.map((p) => {
              const active = pos === p.key;
              return (
                <Pressable
                  key={p.key}
                  className="flex-1"
                  onPress={() => {
                    feedback.tap();
                    setPos(p.key);
                  }}
                >
                  <View
                    className="items-center rounded-xl border px-1 py-3"
                    style={{
                      borderColor: active ? palette.gold : withAlpha(palette.white, 0.1),
                      backgroundColor: active ? withAlpha(palette.gold, 0.15) : palette.ink700,
                      borderWidth: 2,
                    }}
                  >
                    <Urdu style={{ color: active ? palette.gold : withAlpha(palette.paper, 0.7), ...urduGlyph(19) }}>
                      {letter.forms[p.key]}
                    </Urdu>
                    <Eyebrow
                      style={{ color: active ? palette.gold : withAlpha(palette.paper, 0.55), fontSize: 9 }}
                      className="mt-1"
                    >
                      {p.label}
                    </Eyebrow>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* living in a word */}
          <View className="mb-4 rounded-2xl border border-white/10 bg-ink-700 p-5">
            <Eyebrow className="mb-3 text-paper/55">Living in a word</Eyebrow>
            <View className="flex-row items-center justify-between">
              <View>
                <Urdu style={{ fontSize: 32, lineHeight: urduLine(32) }}>{letter.word}</Urdu>
                <Txt className="mt-1 text-sm text-paper/60">
                  {letter.roman}: {letter.meaning}
                </Txt>
              </View>
              {letter.icon ? (
                <Illustration name={letter.icon} size={48} />
              ) : (
                <Txt style={{ fontSize: 36 }}>{letter.emoji}</Txt>
              )}
            </View>
          </View>

          {/* the note */}
          <View
            className="mb-6 rounded-xl border-s-2 p-4"
            style={{ borderStartColor: palette.jade, backgroundColor: withAlpha(palette.jade, 0.08) }}
          >
            <Txt className="text-sm leading-6 text-paper/80">{letter.note}</Txt>
          </View>

          <View className="mb-8 flex-row items-center justify-between">
            <Pressable disabled={idx === 0} onPress={() => selectLetter(Math.max(0, idx - 1))}>
              <Bold className="text-sm text-paper/60" style={{ opacity: idx === 0 ? 0.3 : 1 }}>
                ← Previous
              </Bold>
            </Pressable>
            <Txt className="text-xs text-paper/55">
              {idx + 1} / {LETTERS.length}
            </Txt>
            <Pressable
              disabled={idx === LETTERS.length - 1}
              onPress={() => selectLetter(Math.min(LETTERS.length - 1, idx + 1))}
            >
              <Bold className="text-sm" style={{ color: palette.gold, opacity: idx === LETTERS.length - 1 ? 0.3 : 1 }}>
                Next →
              </Bold>
            </Pressable>
          </View>
        </Reveal>
      </Screen>
    </View>
  );
}
