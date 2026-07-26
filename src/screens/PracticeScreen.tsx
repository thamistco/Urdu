import { useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Reveal } from '../components/Reveal';
import { ProgressBar } from '../components/ProgressBar';
import { Display, Heading, Txt, Bold, Eyebrow } from '../components/Text';
import { TopicArt } from '../components/Illustration';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { dueCount } from '../lib/srs';
import { strength } from '../lib/srs';
import { useProgressStore } from '../store/useProgressStore';
import { TOPICS, wordsByTopic, LEVEL_META, LEVEL_ORDER, type Level } from '../data/words';
import { GRAMMAR } from '../data/grammar';
import { PASSAGES, DIALOGUES } from '../data/sentences';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Two arrows chasing each other — the spaced-repetition mark, drawn so it
 *  takes the card's colour instead of the platform's emoji font. */
function CycleMark({ size = 52, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4.5 10a7.5 7.5 0 0 1 12.9-4M19.5 14a7.5 7.5 0 0 1-12.9 4"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M17.4 2.4V6H13.8M6.6 21.6V18h3.6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchMark({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.5} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M15.5 15.5 20 20" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/**
 * Passages and conversations share a shelf: both are read-then-answer, and a
 * learner looking for "something to read" wants to see all of it at once.
 * Ordered easiest-first, since they are authored in no particular order.
 */
type ReadItem = {
  id: string;
  title: string;
  level: Level;
  lines: number;
  kind: 'passage' | 'conversation';
};

const READING: ReadItem[] = [
  ...PASSAGES.map((p) => ({ id: p.id, title: p.title, level: p.level, lines: p.lines.length, kind: 'passage' as const })),
  ...DIALOGUES.map((d) => ({ id: d.id, title: d.title, level: d.level, lines: d.lines.length, kind: 'conversation' as const })),
].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

const TAB_TOTAL = {
  topics: TOPICS.length,
  grammar: GRAMMAR.length,
  reading: READING.length,
} as const;

/** What the search box counts, in words that read naturally. */
const TAB_NOUN = { topics: 'topics', grammar: 'grammar points', reading: 'readings' } as const;

export function PracticeScreen() {
  const nav = useNavigation<Nav>();
  const srs = useProgressStore((s) => s.srs);
  const learnedWords = useProgressStore((s) => s.learnedWords);
  const regenHearts = useProgressStore((s) => s.regenHearts);

  useEffect(() => {
    regenHearts();
  }, [regenHearts]);

  const due = dueCount(srs);
  const totalTracked = Object.keys(srs).length;
  const mastered = Object.values(srs).filter((c) => strength(c) >= 0.8).length;

  const go = (lessonId: string) => {
    feedback.tap();
    nav.navigate('Lesson', { lessonId });
  };

  // The catalogue is large, so it is filtered rather than dumped: one tab at a
  // time, plus a search that reaches across everything in the current tab.
  const [tab, setTab] = useState<'topics' | 'grammar' | 'reading'>('topics');
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const q = query.trim().toLowerCase();
  const hit = (...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q));

  const grammarList = useMemo(() => GRAMMAR.filter((g) => hit(g.title, g.summary)), [q]);
  const readingList = useMemo(() => READING.filter((p) => hit(p.title, p.kind)), [q]);
  const topicList = useMemo(() => TOPICS.filter((t) => hit(t.title, t.blurb)), [q]);
  const counts = { topics: topicList.length, grammar: grammarList.length, reading: readingList.length };
  const empty = counts[tab] === 0;

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <Reveal>
          <SafeAreaView edges={['top']}>
            <Eyebrow style={{ color: palette.gold }}>Practice</Eyebrow>
            <Display className="mt-1 text-3xl">Keep it warm</Display>
            <Txt className="mt-1 text-sm text-paper/55">
              Spaced repetition brings back exactly what you're about to forget.
            </Txt>
          </SafeAreaView>
        </Reveal>

        {/* daily review hero */}
        <Reveal delay={80}>
          <Pressable onPress={() => go('practice-review')} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View
              className="mb-4 mt-5 overflow-hidden rounded-2xl p-6"
              style={{ backgroundColor: palette.jadeDeep }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Eyebrow style={{ color: withAlpha(palette.ink, 0.7) }}>Daily review</Eyebrow>
                  <Heading style={{ color: palette.ink }} className="mt-1 text-2xl">
                    {due > 0 ? `${due} item${due > 1 ? 's' : ''} due` : 'All caught up'}
                  </Heading>
                  <Txt style={{ color: withAlpha(palette.ink, 0.8) }} className="mt-1 text-sm">
                    {due > 0 ? 'A calm few minutes to lock them in.' : 'Come back later, or drill a topic below.'}
                  </Txt>
                </View>
                <CycleMark size={52} color={withAlpha(palette.ink, 0.85)} />
              </View>
            </View>
          </Pressable>
        </Reveal>

        {/* memory strength */}
        {totalTracked > 0 && (
          <Reveal delay={140}>
            <Card className="mb-6">
              <View className="mb-2 flex-row items-center justify-between">
                <Bold className="text-sm">Memory strength</Bold>
                <Txt className="text-xs text-paper/55">
                  {mastered} of {totalTracked} mastered
                </Txt>
              </View>
              <ProgressBar progress={totalTracked ? mastered / totalTracked : 0} color={palette.gold} height={10} />
            </Card>
          </Reveal>
        )}

        {/* browse: one shelf at a time, with search across it */}
        <Reveal delay={165}>
          <View className="mb-3 flex-row rounded-2xl border border-white/10 bg-ink-700 p-1">
            {(['topics', 'grammar', 'reading'] as const).map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  feedback.tap();
                  setTab(k);
                }}
                className="flex-1"
                accessibilityRole="button"
                accessibilityState={{ selected: tab === k }}
                accessibilityLabel={`${k}: ${TAB_TOTAL[k]} items`}
              >
                <View
                  className="items-center justify-center rounded-xl"
                  style={{
                    minHeight: 44,
                    backgroundColor: tab === k ? withAlpha(palette.gold, 0.2) : 'transparent',
                  }}
                >
                  <Bold
                    className="text-xs capitalize"
                    style={{ color: tab === k ? palette.gold : withAlpha(palette.cream, 0.55) }}
                  >
                    {k}
                  </Bold>
                </View>
              </Pressable>
            ))}
          </View>
          {/* The focus ring is drawn on the wrapper in the app's own gold — the
              browser's default white outline sat outside the palette. */}
          <View
            className="mb-5 flex-row items-center gap-2 rounded-2xl bg-ink-700 px-3.5"
            style={{
              borderWidth: 1,
              borderColor: searchFocused ? palette.gold : withAlpha(palette.white, 0.1),
            }}
          >
            <SearchMark color={withAlpha(palette.cream, searchFocused ? 0.8 : 0.45)} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={`Search ${TAB_TOTAL[tab]} ${TAB_NOUN[tab]}`}
              placeholderTextColor={withAlpha(palette.cream, 0.35)}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel="Search practice content"
              style={[
                { flex: 1, color: palette.cream, fontFamily: 'PublicSans', fontSize: 14, paddingVertical: 13 },
                // react-native-web only; not in the RN style types
                { outlineStyle: 'none' } as object,
              ]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                <Txt className="text-paper/45">✕</Txt>
              </Pressable>
            )}
          </View>
        </Reveal>

        {empty && (
          <Txt className="mb-6 mt-2 text-center text-sm text-paper/45">
            Nothing matches “{query}”. Try a shorter word.
          </Txt>
        )}

        {/* grammar */}
        {tab === 'grammar' && (
          <View className="mb-6 gap-2.5">
            {grammarList.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => go(`practice-grammar-${g.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Practise ${g.title}. ${g.summary}`}
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 px-4 py-3.5">
                  <View
                    className="rounded-lg px-2 py-1"
                    style={{ backgroundColor: withAlpha(LEVEL_META[g.level].color, 0.18) }}
                  >
                    <Bold style={{ color: LEVEL_META[g.level].color }} className="text-[10px]">
                      {LEVEL_META[g.level].tag}
                    </Bold>
                  </View>
                  <View className="flex-1">
                    <Bold className="text-[15px]" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                      {g.title}
                    </Bold>
                    <Txt className="text-xs text-paper/55" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                      {g.summary}
                    </Txt>
                  </View>
                  <Txt className="text-paper/35">›</Txt>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* reading */}
        {tab === 'reading' && (
          <View className="mb-6 gap-2.5">
            {readingList.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => go(`practice-${p.kind === 'conversation' ? 'dialogue' : 'reading'}-${p.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${p.kind === 'conversation' ? 'Conversation' : 'Passage'}: ${p.title}, ${p.lines} lines`}
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 px-4 py-3.5">
                  <View
                    className="rounded-lg px-2 py-1"
                    style={{ backgroundColor: withAlpha(LEVEL_META[p.level].color, 0.18) }}
                  >
                    <Bold style={{ color: LEVEL_META[p.level].color }} className="text-[10px]">
                      {LEVEL_META[p.level].tag}
                    </Bold>
                  </View>
                  <View className="flex-1">
                    <Bold className="text-[15px]" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                      {p.title}
                    </Bold>
                    <Txt className="text-xs text-paper/55">
                      {p.kind === 'conversation' ? 'Conversation' : 'Passage'} · {p.lines} lines
                    </Txt>
                  </View>
                  <Txt className="text-paper/35">›</Txt>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* topics */}
        {tab === 'topics' &&
          LEVEL_ORDER.map((lvl: Level) => {
            const levelTopics = topicList.filter((t) => t.level === lvl);
            if (!levelTopics.length) return null;
            const meta = LEVEL_META[lvl];
            return (
              <View key={lvl} className="mb-2">
                <View className="mb-2 mt-3 flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <Bold style={{ color: meta.color }} className="text-xs uppercase tracking-wider">
                    {meta.tag} · {meta.title}
                  </Bold>
                  <Txt className="text-[11px] text-paper/35">{levelTopics.length} sets</Txt>
                </View>
                <View className="flex-row flex-wrap justify-between">
                  {levelTopics.map((t, i) => {
                    const words = wordsByTopic(t.id);
                    const known = words.filter((w) => learnedWords.includes(w.id)).length;
                    return (
                      <Reveal key={t.id} delay={Math.min(i * 25, 250)} style={{ width: '48%' }}>
                        <Pressable
                          onPress={() => go(`practice-topic-${t.id}`)}
                          accessibilityRole="button"
                          accessibilityLabel={`Practise ${t.title}, ${known} of ${words.length} words learned`}
                          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
                        >
                          <View className="mb-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
                            <TopicArt topicId={t.id} size={44} />
                            <Bold className="mt-2 text-sm" numberOfLines={1}>
                              {t.title}
                            </Bold>
                            <Txt className="mt-0.5 text-[11px] text-paper/50">
                              {known}/{words.length} words
                            </Txt>
                            <View className="mt-2">
                              <ProgressBar
                                progress={words.length ? known / words.length : 0}
                                color={meta.color}
                                height={5}
                                spring={false}
                              />
                            </View>
                          </View>
                        </Pressable>
                      </Reveal>
                    );
                  })}
                </View>
              </View>
            );
          })}

        <View className="h-6" />
      </Screen>
    </View>
  );
}
