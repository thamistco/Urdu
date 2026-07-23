import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Reveal } from '../../components/Reveal';
import { GeoDivider } from '../../components/GeoDivider';
import { Display, Heading, Txt, Bold, Eyebrow, Urdu } from '../../components/Text';
import { palette, withAlpha } from '../../theme';
import { feedback } from '../../lib/feedback';
import { useProgressStore, Goal } from '../../store/useProgressStore';
import { useSettingsStore, LearnTrack } from '../../store/useSettingsStore';
import { DAILY_GOALS } from '../../data/achievements';

const GOALS: { key: Goal; label: string; desc: string; icon: string }[] = [
  { key: 'family', label: 'Speak with family', desc: 'Parents, grandparents, relatives back home', icon: '👨‍👩‍👧' },
  { key: 'read', label: 'Read & write it', desc: 'The script itself — Nastaliq', icon: '✍️' },
  { key: 'heritage', label: 'Reconnect with heritage', desc: 'Culture, faith, identity', icon: '🕌' },
  { key: 'curious', label: "I'm just curious", desc: 'No particular reason', icon: '✨' },
];

const TRACKS: { key: LearnTrack; label: string; desc: string; rec?: boolean }[] = [
  { key: 'script', label: 'Script first', desc: 'Learn to read the letters — the way Urdu is actually written' },
  { key: 'roman', label: 'Roman Urdu', desc: 'Latin letters — "aap kaisay hain?" — a faster start' },
  { key: 'both', label: 'Both together', desc: 'Every word in script and Roman, side by side', rec: true },
];

const PLACEMENT = [
  { q: 'Do you recognise this letter?', sub: 'س', kind: 'script', options: [{ label: "Yes — that's seen", c: true }, { label: 'No idea', c: false }] },
  { q: 'What does this word mean?', sub: 'پانی', kind: 'script', options: [{ label: 'Water', c: true }, { label: 'Bread', c: false }, { label: 'Fire', c: false }] },
  { q: 'Can you read this out loud, even slowly?', sub: 'کتاب', kind: 'script', options: [{ label: 'Yes, I can sound it out', c: true }, { label: 'Script is new to me', c: false }] },
  { q: 'What does "ghar" mean?', sub: 'Roman Urdu', kind: 'roman', options: [{ label: 'House', c: true }, { label: 'Tea', c: false }, { label: 'Moon', c: false }] },
];

type Step = 'welcome' | 'goal' | 'track' | 'placement' | 'daily' | 'ready';

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <View className="mb-6 flex-row gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{ backgroundColor: i <= step ? palette.gold : withAlpha(palette.white, 0.12) }}
        />
      ))}
    </View>
  );
}

export function OnboardingScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [track, setTrack] = useState<LearnTrack>('both');
  const [pIdx, setPIdx] = useState(0);
  const [pCorrect, setPCorrect] = useState(0);
  const [pAnswered, setPAnswered] = useState(false);
  const [daily, setDaily] = useState('steady');

  const completeOnboarding = useProgressStore((s) => s.completeOnboarding);
  const setDailyGoal = useProgressStore((s) => s.setDailyGoal);
  const setTrackSetting = useSettingsStore((s) => s.setTrack);

  const finish = () => {
    const lvl = pCorrect >= 4 ? 2 : pCorrect >= 2 ? 1 : 0;
    setTrackSetting(track);
    setDailyGoal(daily);
    feedback.levelUp();
    completeOnboarding(goal ?? 'curious', lvl);
  };

  // ---- welcome ----
  if (step === 'welcome') {
    return (
      <Screen scroll={false}>
        <Reveal style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center">
            <Urdu style={{ fontSize: 96, color: palette.gold, lineHeight: 150 }}>حرف</Urdu>
            <Display className="mb-3 text-4xl">Harf</Display>
            <GeoDivider />
            <Txt className="mb-10 max-w-[280px] text-center text-[15px] leading-6 text-paper/70">
              Learn to read Urdu the way it's really written — every letter in all four of its faces.
              A few quick questions first, so we start you in the right place.
            </Txt>
            <Button className="w-full max-w-[300px]" onPress={() => setStep('goal')}>
              Let's start
            </Button>
          </View>
        </Reveal>
      </Screen>
    );
  }

  // ---- goal ----
  if (step === 'goal') {
    return (
      <Screen>
        <Reveal>
          <Dots step={0} total={4} />
          <Heading className="mb-1 text-2xl">Why are you learning Urdu?</Heading>
          <Txt className="mb-6 text-sm text-paper/50">This shapes which words we teach first.</Txt>
          <View className="gap-3">
            {GOALS.map((g) => {
              const sel = goal === g.key;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => {
                    feedback.tap();
                    setGoal(g.key);
                  }}
                >
                  <View
                    className="flex-row items-center gap-4 rounded-2xl border p-4"
                    style={{
                      borderColor: sel ? palette.gold : withAlpha(palette.white, 0.1),
                      backgroundColor: sel ? withAlpha(palette.gold, 0.1) : palette.ink700,
                      borderWidth: 2,
                    }}
                  >
                    <Txt style={{ fontSize: 26 }}>{g.icon}</Txt>
                    <View className="flex-1">
                      <Bold className="text-[15px]">{g.label}</Bold>
                      <Txt className="text-xs text-paper/60">{g.desc}</Txt>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button className="mt-6" disabled={!goal} onPress={() => setStep('track')}>
            Continue
          </Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- track ----
  if (step === 'track') {
    return (
      <Screen>
        <Reveal>
          <Dots step={1} total={4} />
          <Heading className="mb-1 text-2xl">How do you want to learn?</Heading>
          <Txt className="mb-6 text-sm text-paper/50">You can change this any time in settings.</Txt>
          <View className="gap-3">
            {TRACKS.map((t) => {
              const sel = track === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => {
                    feedback.tap();
                    setTrack(t.key);
                  }}
                >
                  <View
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: sel ? palette.gold : withAlpha(palette.white, 0.1),
                      backgroundColor: sel ? withAlpha(palette.gold, 0.1) : palette.ink700,
                      borderWidth: 2,
                    }}
                  >
                    <View className="mb-1 flex-row items-center justify-between">
                      <Bold className="text-[15px]">{t.label}</Bold>
                      {t.rec ? (
                        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: withAlpha(palette.jade, 0.2) }}>
                          <Eyebrow style={{ color: palette.jadeLight, fontSize: 9 }}>Recommended</Eyebrow>
                        </View>
                      ) : null}
                    </View>
                    <Txt className="text-xs text-paper/60">{t.desc}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button className="mt-6" onPress={() => { setPIdx(0); setPCorrect(0); setStep('placement'); }}>
            Continue
          </Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- placement ----
  if (step === 'placement') {
    const question = PLACEMENT[pIdx];
    const pick = (correct: boolean) => {
      if (pAnswered) return;
      setPAnswered(true);
      const nextCorrect = pCorrect + (correct ? 1 : 0);
      feedback.tap();
      setTimeout(() => {
        setPAnswered(false);
        if (pIdx < PLACEMENT.length - 1) {
          setPCorrect(nextCorrect);
          setPIdx(pIdx + 1);
        } else {
          setPCorrect(nextCorrect);
          setStep('daily');
        }
      }, 350);
    };
    return (
      <Screen>
        <Reveal key={pIdx}>
          <Dots step={2} total={4} />
          <Eyebrow style={{ color: palette.gold }} className="mb-3">
            Quick check · {pIdx + 1} of {PLACEMENT.length}
          </Eyebrow>
          <Heading className="mb-6 text-xl">{question.q}</Heading>
          <View className="mb-8 h-28 items-center justify-center rounded-2xl bg-paper">
            {question.kind === 'script' ? (
              <Urdu style={{ fontSize: 64, color: palette.ink, lineHeight: 96 }}>{question.sub}</Urdu>
            ) : (
              <Heading style={{ color: palette.ink }} className="text-2xl">{question.sub}</Heading>
            )}
          </View>
          <View className="gap-3">
            {question.options.map((opt) => (
              <Pressable key={opt.label} onPress={() => pick(opt.c)}>
                <View className="rounded-xl border border-white/10 bg-ink-700 px-4 py-4">
                  <Txt className="text-[15px]">{opt.label}</Txt>
                </View>
              </Pressable>
            ))}
          </View>
          <Txt className="mt-6 text-center text-xs text-paper/30">
            No wrong answers here — this just finds your starting point.
          </Txt>
        </Reveal>
      </Screen>
    );
  }

  // ---- daily goal ----
  if (step === 'daily') {
    return (
      <Screen>
        <Reveal>
          <Dots step={3} total={4} />
          <Heading className="mb-1 text-2xl">Set a daily goal</Heading>
          <Txt className="mb-6 text-sm text-paper/50">A gentle contract with yourself. Change it whenever.</Txt>
          <View className="gap-3">
            {DAILY_GOALS.map((g) => {
              const sel = daily === g.id;
              return (
                <Pressable key={g.id} onPress={() => { feedback.tap(); setDaily(g.id); }}>
                  <View
                    className="flex-row items-center justify-between rounded-2xl border p-4"
                    style={{
                      borderColor: sel ? palette.gold : withAlpha(palette.white, 0.1),
                      backgroundColor: sel ? withAlpha(palette.gold, 0.1) : palette.ink700,
                      borderWidth: 2,
                    }}
                  >
                    <View>
                      <Bold className="text-[15px]">{g.label}</Bold>
                      <Txt className="text-xs text-paper/60">{g.desc}</Txt>
                    </View>
                    <Bold style={{ color: palette.gold }}>+{g.xp} XP</Bold>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button className="mt-6" onPress={() => setStep('ready')}>Continue</Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- ready ----
  const lvlName = pCorrect >= 4 ? 'Emerging (B1)' : pCorrect >= 2 ? 'Early beginner (A2)' : 'Absolute beginner (A1)';
  return (
    <Screen scroll={false}>
      <Reveal style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <Txt style={{ fontSize: 64 }}>🌙</Txt>
          <Display className="mb-2 mt-4 text-3xl">You're all set</Display>
          <GeoDivider />
          <View className="my-4 w-full rounded-2xl border p-5" style={{ borderColor: withAlpha(palette.gold, 0.3), backgroundColor: withAlpha(palette.gold, 0.08) }}>
            <Eyebrow style={{ color: palette.gold }} className="mb-1">Your starting level</Eyebrow>
            <Bold className="text-lg">{lvlName}</Bold>
            <Txt className="mt-1 text-sm text-paper/60">
              We'll begin exactly where you are — and the words you miss will come back first.
            </Txt>
          </View>
          <Button className="mt-4 w-full" onPress={finish}>Start learning</Button>
        </View>
      </Reveal>
    </Screen>
  );
}
