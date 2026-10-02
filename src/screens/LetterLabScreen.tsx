import { useRef, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Reveal } from '../components/Reveal';
import { Txt, Bold, Eyebrow, Urdu, urduLine, urduGlyph } from '../components/Text';
import { TracePad, tracePadKey } from '../components/TracePad';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { announce, hasClip } from '../lib/speech';
import { WORDS } from '../data/words';
import { LETTERS, POSITIONS, PositionKey, glyphName, positionHint } from '../data/letters';
import { useProgressStore } from '../store/useProgressStore';
import { Illustration } from '../components/Illustration';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LetterLab'>;
type Rt = RouteProp<RootStackParamList, 'LetterLab'>;

/** Each letter's example word, by the id its recording is filed under. */
const EXAMPLE_WORD_ID = new Map(
  LETTERS.flatMap((l) => {
    const w = WORDS.find((x) => x.urdu === l.word);
    // A vocabulary word's own recording, or the one generate-voice.js makes
    // as `<letter>-word` for an example word that is not in the vocabulary.
    const id = w && hasClip(w.id) ? w.id : hasClip(`${l.id}-word`) ? `${l.id}-word` : null;
    return id ? [[l.id, id] as const] : [];
  })
);

/** A rail tile's 56px plus its 4px margin either side. */
const RAIL_STEP = 64;

/** The letter /letters/:letterId names, or the first one for none or a typo. */
function indexOf(letterId: string | undefined): number {
  return Math.max(
    0,
    LETTERS.findIndex((l) => l.id === letterId)
  );
}

export function LetterLabScreen() {
  const nav = useNavigation<Nav>();
  // The route has always been /letters/:letterId, but the screen ignored it
  // and opened on alif whatever the address said, so a link to a letter was a
  // link to the alphabet. The address is read once, and kept in step with the
  // rail after that so it can be copied or reloaded.
  const letterId = useRoute<Rt>().params?.letterId;
  const [idx, setIdx] = useState(() => indexOf(letterId));
  const rail = useRef<ScrollView>(null);
  // Once, when the rail first has a width, so a link to a letter near the end
  // opens with that letter in view; after that the learner scrolls it.
  const railPlaced = useRef(false);
  const placeRail = () => {
    if (railPlaced.current) return;
    railPlaced.current = true;
    rail.current?.scrollTo({ x: Math.max(0, (idx - 1) * RAIL_STEP), animated: false });
  };
  const [pos, setPos] = useState<PositionKey>('isolated');
  // The Lab is where you go to study a letter, so it is the right place to
  // practise writing one — same pad and same scoring as the lesson, without
  // the hearts.
  const [tracing, setTracing] = useState(false);
  const learned = useProgressStore((s) => s.learnedLetters);
  const letter = LETTERS[idx];
  const exampleClip = EXAMPLE_WORD_ID.get(letter.id);

  const selectLetter = (i: number) => {
    feedback.tap();
    setIdx(i);
    nav.setParams({ letterId: LETTERS[i].id });
    setPos('isolated');
    setTracing(false);
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={() => nav.goBack()} label={`${learned.length} / ${LETTERS.length} learned`} />

        {/* letter rail */}
        <ScrollView
          ref={rail}
          onContentSizeChange={placeRail}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 -mx-1"
        >
          <View className="flex-row" accessibilityRole="radiogroup" aria-label="Letter">
            {LETTERS.map((l, i) => {
              const active = i === idx;
              const known = learned.includes(l.id);
              return (
                <Pressable
                  // Named, because the glyph was all a screen reader had: forty
                  // buttons each called by one Arabic-script character, with
                  // nothing to say which was showing. The tick is drawn, so
                  // it is said here too.
                  accessibilityRole="radio"
                  aria-checked={active}
                  accessibilityLabel={`${glyphName(l.forms.isolated) ?? l.name}${known ? ', learned' : ''}`}
                  key={l.id}
                  onPress={() => selectLetter(i)}
                  className="mx-1"
                >
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
                        <Txt className="text-[0.5625rem]" style={{ color: palette.white }}>
                          ✓
                        </Txt>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Reveal key={letter.id}>
          <View className="mb-1 flex-row items-center justify-center gap-2">
            <Eyebrow style={{ color: palette.gold }}>
              {letter.name} · “{letter.sound}”
            </Eyebrow>
            {!letter.connects && (
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: withAlpha(palette.rose, 0.2) }}>
                <Eyebrow className="text-[0.5rem]" style={{ color: palette.roseLight }}>
                  Never joins forward
                </Eyebrow>
              </View>
            )}
          </View>

          {/* the paper — read it, or write it */}
          <View className="my-4">
            {tracing ? (
              <TracePad key={tracePadKey(letter.id, pos)} letter={letter} position={pos} />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hear ${glyphName(letter.forms.isolated) ?? letter.name}`}
                // The letter's own recording, the one tracing and the lesson's
                // new-letter card play. This used to read the example word
                // through the device's text-to-speech instead: a different
                // word in a different voice, so a learner who picked the man's
                // voice heard a woman here and the man when tracing.
                onPress={() => announce(letter.id, letter.forms.isolated, letter.name)}
              >
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
                    <Txt style={{ color: palette.ink }} className="text-xs opacity-65">
                      {positionHint(letter, pos)} · tap to hear
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
              // A switch: it is on or off, and React Native has no
              // aria-pressed to say so on a button.
              accessibilityRole="switch"
              aria-checked={tracing}
              accessibilityLabel="Trace this letter"
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
            {/* Tracing here never marks a letter learned, and a learner who
                traced all four forms and saw the counter above stay put had
                no way to know why. It is a choice, not an omission: "learned"
                means a letter has been graded into the review schedule, and
                every grade is a review. Repeated Lab traces would each count
                as one, the same-sitting pile-up sessionGrading.ts exists to
                prevent. So the Lab says how learning is counted instead. */}
            {tracing && (
              <Txt className="mt-2 text-center text-[0.6875rem] leading-4 text-paper/55">
                Tracing here is practice. A letter counts as learned when you get it right in a lesson, which also
                brings it back for review.
              </Txt>
            )}
          </View>

          {/* position dial */}
          <View className="mb-5 flex-row gap-2" accessibilityRole="radiogroup" aria-label="Letter position">
            {POSITIONS.map((p) => {
              const active = pos === p.key;
              return (
                <Pressable
                  // A radio with aria-checked, as the daily goal in Settings
                  // does and for the same reason: react-native-web drops
                  // accessibilityState, so the web never heard which form
                  // was showing.
                  accessibilityRole="radio"
                  aria-checked={active}
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
                      style={{ color: active ? palette.gold : withAlpha(palette.paper, 0.55) }}
                      className="mt-1 text-[0.5625rem]"
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
            <Pressable
              // Every example word has a recording in both voices. Should one
              // ever lack it, the card stays silent rather than switch to the
              // device's voice, a different speaker from the learner's choice.
              disabled={!exampleClip}
              accessibilityRole={exampleClip ? 'button' : undefined}
              accessibilityLabel={exampleClip ? `Hear ${letter.roman}, ${letter.meaning}` : undefined}
              onPress={() => exampleClip && announce(exampleClip, letter.word, letter.roman)}
              className="flex-row items-center justify-between"
            >
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
            </Pressable>
          </View>

          {/* the note */}
          <View
            className="mb-6 rounded-xl border-s-2 p-4"
            style={{ borderStartColor: palette.jade, backgroundColor: withAlpha(palette.jade, 0.08) }}
          >
            <Txt className="text-sm leading-6 text-paper/80">{letter.note}</Txt>
          </View>

          <View className="mb-8 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              disabled={idx === 0}
              onPress={() => selectLetter(Math.max(0, idx - 1))}
            >
              <Bold className="text-sm text-paper/60" style={{ opacity: idx === 0 ? 0.3 : 1 }}>
                ← Previous
              </Bold>
            </Pressable>
            <Txt className="text-xs text-paper/55">
              {idx + 1} / {LETTERS.length}
            </Txt>
            <Pressable
              accessibilityRole="button"
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
