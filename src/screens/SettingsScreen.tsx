import { useState } from 'react';
import { View, Switch, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Reveal } from '../components/Reveal';
import { Txt, Bold, Eyebrow } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { confirmAction } from '../lib/confirm';
import { useSettingsStore, type VoiceGender } from '../store/useSettingsStore';
import { useProgressStore } from '../store/useProgressStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTesterStore, TESTER_MODE_AVAILABLE } from '../store/useTesterStore';
import { DAILY_GOALS } from '../data/achievements';
import { TrackChooser } from '../components/TrackChooser';
import { MALE_VOICE_AVAILABLE } from '../lib/voiceManifest';
import { announce } from '../lib/speech';

function Row({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-4">
        <Bold className="text-[15px]">{label}</Bold>
        {hint ? <Txt className="text-xs text-paper/55">{hint}</Txt> : null}
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

/**
 * Unlimited hearts and an open path, for looking at the app rather than playing
 * it — and, just as much, for putting the real constraints back so the state a
 * learner actually meets can be seen on purpose. See useTesterStore for why this
 * is a passphrase and not a login, and why it ships only behind a build flag.
 */
function TesterPanel() {
  const t = useTesterStore();
  const resetAll = useProgressStore((st) => st.resetAll);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [wrong, setWrong] = useState(false);

  if (!t.unlocked) {
    return (
      <Card className="mb-5">
        <Txt className="mb-3 text-xs text-paper/55">For testing only. Nothing here changes what a learner sees.</Txt>
        <TextInput
          value={user}
          onChangeText={(v) => {
            setUser(v);
            setWrong(false);
          }}
          placeholder="username"
          placeholderTextColor={withAlpha(palette.paper, 0.3)}
          autoCapitalize="none"
          autoCorrect={false}
          className="mb-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: withAlpha(palette.white, 0.06), color: palette.paper }}
        />
        <TextInput
          value={pass}
          onChangeText={(v) => {
            setPass(v);
            setWrong(false);
          }}
          placeholder="password"
          placeholderTextColor={withAlpha(palette.paper, 0.3)}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className="mb-3 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: withAlpha(palette.white, 0.06), color: palette.paper }}
        />
        {wrong && (
          <Txt className="mb-2 text-xs" style={{ color: palette.roseLight }}>
            Not right.
          </Txt>
        )}
        <Pressable
          onPress={() => {
            feedback.tap();
            if (!t.tryUnlock(user, pass)) setWrong(true);
          }}
          accessibilityRole="button"
        >
          <View
            className="items-center rounded-xl py-2.5"
            style={{
              backgroundColor: withAlpha(palette.gold, 0.18),
              borderWidth: 1,
              borderColor: withAlpha(palette.gold, 0.4),
            }}
          >
            <Bold style={{ color: palette.gold }} className="text-sm">
              Unlock
            </Bold>
          </View>
        </Pressable>
      </Card>
    );
  }

  const anyOn = t.infiniteHearts || t.unlockAll;
  return (
    <Card className="mb-5">
      {/* Both start off, so the first thing an unlocked tester sees is still the
          real app. A banner while either is on, because a tester who forgets is
          testing something no learner will ever use. */}
      <Row
        label="Unlimited hearts"
        hint="Wrong answers cost nothing"
        value={t.infiniteHearts}
        onChange={t.setInfiniteHearts}
      />
      <View className="h-px bg-white/5" />
      <Row
        label="Unlock every lesson"
        hint="Open any lesson without finishing the ones before it"
        value={t.unlockAll}
        onChange={t.setUnlockAll}
      />
      {anyOn && (
        <View
          className="mt-3 rounded-xl px-3 py-2"
          style={{
            backgroundColor: withAlpha(palette.gold, 0.12),
            borderWidth: 1,
            borderColor: withAlpha(palette.gold, 0.3),
          }}
        >
          <Txt className="text-xs" style={{ color: palette.gold }}>
            Tester mode is on, so this is not what a learner sees. Turn both off to get the real hearts and the locked
            path back.
          </Txt>
        </View>
      )}
      {/* The reset lived on the home screen, one tap from every learner, with a
          comment on it saying to remove it once testing was done. This is where
          a testing affordance belongs: behind the passphrase, next to the other
          two. The permanent one is still in Data below, for real users. */}
      <Pressable
        onPress={() => {
          feedback.tap();
          confirmAction(
            'Start the course over?',
            'Clears progress, streak, XP and memory on this device so you can walk the path from the first lesson again.',
            'Reset',
            () => {
              resetAll();
              feedback.incorrect();
            }
          );
        }}
        accessibilityRole="button"
        accessibilityLabel="Reset progress for testing"
      >
        <View
          className="mt-3 items-center rounded-xl py-2.5"
          style={{
            backgroundColor: withAlpha(palette.rose, 0.14),
            borderWidth: 1,
            borderColor: withAlpha(palette.rose, 0.35),
          }}
        >
          <Bold style={{ color: palette.roseLight }} className="text-sm">
            Reset progress and start over
          </Bold>
        </View>
      </Pressable>

      <Pressable
        onPress={() => {
          feedback.tap();
          t.lock();
        }}
        accessibilityRole="button"
      >
        <Txt className="mt-3 text-center text-xs text-paper/55">Lock tester mode</Txt>
      </Pressable>
    </Card>
  );
}

export function SettingsScreen() {
  const nav = useNavigation();
  const s = useSettingsStore();
  const resetAll = useProgressStore((st) => st.resetAll);
  const dailyGoalId = useProgressStore((st) => st.dailyGoalId);
  const setDailyGoal = useProgressStore((st) => st.setDailyGoal);
  const email = useAuthStore((st) => st.session?.user?.email ?? null);
  const signOut = useAuthStore((st) => st.signOut);
  const [, force] = useState(0);

  const onAuthAction = () => {
    if (email) {
      confirmAction('Sign out?', 'Your progress stays saved to your account.', 'Sign out', () => signOut());
    } else {
      signOut(); // clears guest mode → returns to the sign-in screen
    }
  };

  const confirmReset = () => {
    confirmAction(
      'Reset all progress?',
      'Your streak, XP, gems and history will all be cleared, and there is no way to get them back.',
      'Reset',
      () => {
        resetAll();
        feedback.incorrect();
      }
    );
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={() => nav.goBack()} title="Settings" />

        <Reveal>
          <Eyebrow className="mb-2 text-paper/55">Account</Eyebrow>
          <Card className="mb-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Bold className="text-[15px]">{email ?? 'Guest'}</Bold>
                <Txt className="text-xs text-paper/55">
                  {email ? 'Progress is saved to your account' : 'Progress is saved on this device'}
                </Txt>
              </View>
              <Pressable onPress={onAuthAction}>
                <View
                  className="rounded-xl px-4 py-2"
                  style={{
                    backgroundColor: withAlpha(email ? palette.rose : palette.gold, 0.15),
                    borderWidth: 1,
                    borderColor: withAlpha(email ? palette.rose : palette.gold, 0.35),
                  }}
                >
                  <Bold style={{ color: email ? palette.roseLight : palette.gold }} className="text-sm">
                    {email ? 'Sign out' : 'Sign in'}
                  </Bold>
                </View>
              </Pressable>
            </View>
          </Card>
        </Reveal>

        <Reveal delay={40}>
          <Eyebrow className="mb-2 text-paper/55">Feedback</Eyebrow>
          <Card className="mb-5">
            <Row
              label="Sound effects"
              hint="Chimes for correct, soft tones for misses"
              value={s.soundEnabled}
              onChange={s.setSound}
            />
            <View className="h-px bg-white/5" />
            <Row
              label="Haptics"
              hint="Gentle vibration with feedback"
              value={s.hapticsEnabled}
              onChange={s.setHaptics}
            />
            <View className="h-px bg-white/5" />
            {/* The hint says whose voice it is. "Hear the English as well as
                the Urdu" did not, and the surprise was the whole problem: the
                Urdu is a recorded voice, the English is whatever the phone or
                browser has, so a word arrived in two different voices with no
                warning that the second one was coming. */}
            <Row
              label="Read the meaning in English"
              hint="After a correct answer, your device’s English voice reads the translation. It is off by default, because the Urdu is a recorded voice and this one is not."
              value={s.speakMeaning}
              onChange={s.setSpeakMeaning}
            />
            <View className="h-px bg-white/5" />
            <Row
              label="Reduced motion"
              hint="Calmer, minimal animation"
              value={s.reducedMotion}
              onChange={s.setReducedMotion}
            />
            {/* Only when a second set of clips exists. Offering a voice the app
                has no recordings for would send every word to the device’s own
                text-to-speech, which has no Urdu and reads the script in
                English — the exact complaint that removed the English gloss. */}
            {MALE_VOICE_AVAILABLE && (
              <>
                <View className="my-2 h-px bg-white/5" />
                <Bold className="mb-2 mt-1 text-sm">Reading voice</Bold>
                <View className="flex-row gap-2">
                  {(
                    [
                      { key: 'f', label: 'Woman' },
                      { key: 'm', label: 'Man' },
                    ] as { key: VoiceGender; label: string }[]
                  ).map((o) => {
                    const active = s.voiceGender === o.key;
                    return (
                      <Pressable
                        key={o.key}
                        style={{ flex: 1 }}
                        onPress={() => {
                          feedback.tap();
                          s.setVoiceGender(o.key);
                          // Change it, then say something in it — a voice
                          // chosen from a label is not a voice chosen.
                          announce('w-salam', 'السلام علیکم', 'assalaam-o-alaikum');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${o.label}'s voice. Tap to select and hear it.`}
                      >
                        <View
                          className="items-center rounded-xl border py-3"
                          style={{
                            borderColor: active ? palette.gold : withAlpha(palette.white, 0.1),
                            backgroundColor: active ? withAlpha(palette.gold, 0.14) : palette.ink800,
                            borderWidth: 2,
                          }}
                        >
                          <Bold className="text-sm">{o.label}</Bold>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Txt className="mt-2 text-[11px] text-paper/55">Tap to hear the change.</Txt>
              </>
            )}
          </Card>
        </Reveal>

        <Reveal delay={60}>
          <Eyebrow className="mb-2 text-paper/55">Script</Eyebrow>
          <Card className="mb-5">
            <Row
              label="Show Roman Urdu"
              hint="Transliteration alongside the script"
              value={s.showRoman}
              onChange={s.setShowRoman}
            />
            <View className="h-px bg-white/5 my-2" />
            <Bold className="mb-2 mt-1 text-sm">Learning track</Bold>
            <TrackChooser
              value={s.track}
              onChange={(t) => {
                s.setTrack(t);
                force((n) => n + 1);
              }}
            />
          </Card>
        </Reveal>

        <Reveal delay={120}>
          <Eyebrow className="mb-2 text-paper/55">Daily goal</Eyebrow>
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
                      <Txt className="text-[11px] text-paper/55">
                        {g.desc} · +{g.xp} XP
                      </Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Reveal>

        <Reveal delay={180}>
          <Eyebrow className="mb-2 text-paper/55">Data</Eyebrow>
          <Pressable onPress={confirmReset}>
            <View
              className="rounded-2xl border p-4"
              style={{ borderColor: withAlpha(palette.rose, 0.3), backgroundColor: withAlpha(palette.rose, 0.08) }}
            >
              <Bold style={{ color: palette.roseLight }}>Reset all progress</Bold>
              <Txt className="mt-0.5 text-xs text-paper/55">Clears streak, XP, gems and memory. Cannot be undone.</Txt>
            </View>
          </Pressable>
        </Reveal>

        {TESTER_MODE_AVAILABLE && (
          <Reveal delay={200}>
            <View className="mt-5">
              <Eyebrow className="mb-2 text-paper/55">Tester</Eyebrow>
              <TesterPanel />
            </View>
          </Reveal>
        )}

        <Txt className="mb-8 mt-8 text-center text-xs text-paper/55">Harf · حرف · v1.0</Txt>
      </Screen>
    </View>
  );
}
