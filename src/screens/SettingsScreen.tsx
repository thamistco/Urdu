import { useState } from 'react';
import { View, Switch, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Reveal } from '../components/Reveal';
import { Txt, Bold, Eyebrow } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { useSettingsStore, LearnTrack } from '../store/useSettingsStore';
import { useProgressStore } from '../store/useProgressStore';
import { DAILY_GOALS } from '../data/achievements';

function Row({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-4">
        <Bold className="text-[15px]">{label}</Bold>
        {hint ? <Txt className="text-xs text-paper/50">{hint}</Txt> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          feedback.tap();
          onChange(v);
        }}
        trackColor={{ true: palette.gold, false: withAlpha(palette.white, 0.15) }}
        thumbColor={palette.paper}
      />
    </View>
  );
}

const TRACKS: { key: LearnTrack; label: string }[] = [
  { key: 'script', label: 'Script' },
  { key: 'roman', label: 'Roman' },
  { key: 'both', label: 'Both' },
];

export function SettingsScreen() {
  const nav = useNavigation();
  const s = useSettingsStore();
  const resetAll = useProgressStore((st) => st.resetAll);
  const dailyGoalId = useProgressStore((st) => st.dailyGoalId);
  const setDailyGoal = useProgressStore((st) => st.setDailyGoal);
  const [, force] = useState(0);

  const confirmReset = () => {
    Alert.alert('Reset all progress?', 'This clears your streak, XP, gems and history. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetAll();
          feedback.incorrect();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={() => nav.goBack()} title="Settings" />

        <Reveal>
          <Eyebrow className="mb-2 text-paper/50">Feedback</Eyebrow>
          <Card className="mb-5">
            <Row label="Sound effects" hint="Chimes for correct, soft tones for misses" value={s.soundEnabled} onChange={s.setSound} />
            <View className="h-px bg-white/5" />
            <Row label="Haptics" hint="Gentle vibration with feedback" value={s.hapticsEnabled} onChange={s.setHaptics} />
            <View className="h-px bg-white/5" />
            <Row label="Reduced motion" hint="Calmer, minimal animation" value={s.reducedMotion} onChange={s.setReducedMotion} />
          </Card>
        </Reveal>

        <Reveal delay={60}>
          <Eyebrow className="mb-2 text-paper/50">Script</Eyebrow>
          <Card className="mb-5">
            <Row label="Show Roman Urdu" hint="Transliteration alongside the script" value={s.showRoman} onChange={s.setShowRoman} />
            <View className="h-px bg-white/5 my-2" />
            <Bold className="mb-2 mt-1 text-sm">Learning track</Bold>
            <View className="flex-row gap-2">
              {TRACKS.map((t) => {
                const active = s.track === t.key;
                return (
                  <Pressable
                    key={t.key}
                    className="flex-1"
                    onPress={() => {
                      feedback.tap();
                      s.setTrack(t.key);
                      force((n) => n + 1);
                    }}
                  >
                    <View
                      className="items-center rounded-xl border py-3"
                      style={{
                        borderColor: active ? palette.gold : withAlpha(palette.white, 0.1),
                        backgroundColor: active ? withAlpha(palette.gold, 0.14) : palette.ink800,
                        borderWidth: 2,
                      }}
                    >
                      <Bold style={{ color: active ? palette.gold : palette.cream }} className="text-sm">
                        {t.label}
                      </Bold>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Reveal>

        <Reveal delay={120}>
          <Eyebrow className="mb-2 text-paper/50">Daily goal</Eyebrow>
          <Card className="mb-5">
            <View className="flex-row flex-wrap gap-2">
              {DAILY_GOALS.map((g) => {
                const active = dailyGoalId === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => {
                      feedback.tap();
                      setDailyGoal(g.id);
                      force((n) => n + 1);
                    }}
                    style={{ width: '48%' }}
                  >
                    <View
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: active ? palette.gold : withAlpha(palette.white, 0.1),
                        backgroundColor: active ? withAlpha(palette.gold, 0.14) : palette.ink800,
                        borderWidth: 2,
                      }}
                    >
                      <Bold className="text-sm">{g.label}</Bold>
                      <Txt className="text-[11px] text-paper/55">{g.desc} · +{g.xp} XP</Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Reveal>

        <Reveal delay={180}>
          <Eyebrow className="mb-2 text-paper/50">Data</Eyebrow>
          <Pressable onPress={confirmReset}>
            <View className="rounded-2xl border p-4" style={{ borderColor: withAlpha(palette.rose, 0.3), backgroundColor: withAlpha(palette.rose, 0.08) }}>
              <Bold style={{ color: palette.roseLight }}>Reset all progress</Bold>
              <Txt className="mt-0.5 text-xs text-paper/50">Clears streak, XP, gems and memory. Cannot be undone.</Txt>
            </View>
          </Pressable>
        </Reveal>

        <Txt className="mb-8 mt-8 text-center text-xs text-paper/30">Harf · حرف — v1.0</Txt>
      </Screen>
    </View>
  );
}
