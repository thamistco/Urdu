import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Reveal } from '../../components/Reveal';
import { GeoDivider } from '../../components/GeoDivider';
import { Display, Heading, Txt, Bold, Eyebrow, Urdu, urduGlyph } from '../../components/Text';
import { GoalArt, Illustration } from '../../components/Illustration';
import type { IconName } from '../../art/icons';
import { TrackChooser } from '../../components/TrackChooser';
import { palette, withAlpha } from '../../theme';
import { feedback } from '../../lib/feedback';
import { useProgressStore, Goal, Background } from '../../store/useProgressStore';
import { useSettingsStore, LearnTrack } from '../../store/useSettingsStore';
import { DAILY_GOALS } from '../../data/achievements';
import { UNITS } from '../../data/units';

/**
 * Lessons a learner who already speaks Urdu doesn't need to be *taught* —
 * they already have the words, spoken. What they came for is the script:
 * letters, and reading it back. Only the beginner-level basics are safe to
 * assume — a heritage speaker's vocabulary thins out fast once units reach
 * specialised topics like politics or philosophy, so only the earliest,
 * most universal words and phrases are pre-satisfied. Letters, grammar,
 * sentence-building, dialogues and reading stay mandatory at every level,
 * since those teach the script and structure, not words already known.
 *
 * A lesson's `level` field is only ever set on sentence-kind lessons — a
 * vocab or phrase lesson's level lives on the *unit* that contains it — so
 * this has to walk `UNITS` rather than filter the flat `ALL_LESSONS` list.
 */
const SKIPPABLE_FOR_SPEAKERS = UNITS.filter((u) => u.level === 'beginner')
  .flatMap((u) => u.lessons)
  .filter((l) => l.kind === 'vocab' || l.kind === 'phrases')
  .map((l) => l.id);

/**
 * The placement quiz used to compute a `startLevel` that nothing ever read —
 * a learner who tested as "Emerging (B1)" landed at lesson one of the course
 * exactly like someone brand new to Urdu. It now actually places them: a
 * near-perfect score skips the entire Beginner stage (they just demonstrated
 * reading a word, sounding one out, and recognising the script), and a
 * middling score gets the same basic-vocab skip a heritage speaker gets.
 * Nothing above Beginner is ever skipped by placement — the quiz only tests
 * script and absolute-basics, not Elementary-and-up content.
 */
/**
 * The nine alphabet lessons of the Beginner stage.
 *
 * Deliberately *not* "every Beginner lesson". The quiz used to skip all
 * thirty-six on a full score, which threw away the beginner grammar, reading
 * and dialogue lessons as well — none of which the quiz asks a single question
 * about. Four questions cannot license skipping eighteen lessons they never
 * tested.
 */
const SCRIPT_LESSON_IDS = UNITS.filter((u) => u.level === 'beginner')
  .flatMap((u) => u.lessons)
  .filter((l) => l.kind === 'letters')
  .map((l) => l.id);

// No `icon` field: the goal cards draw their art from the key via `GoalArt`,
// and the emoji that used to sit here were read by nothing at all.
const GOALS: { key: Goal; label: string; desc: string }[] = [
  { key: 'family', label: 'Speak with family', desc: 'Parents, grandparents, relatives back home' },
  { key: 'read', label: 'Read & write it', desc: 'The script itself: Nastaliq' },
  { key: 'heritage', label: 'Reconnect with heritage', desc: 'Culture, faith, identity' },
  { key: 'curious', label: "I'm just curious", desc: 'No particular reason' },
];

/**
 * The placement check.
 *
 * Each question is tagged with the writing system it is asked in, because the
 * question immediately before this one is "do you want to learn the script?".
 * Answering "no" and then being shown four Nastaliq letters and asked whether
 * you recognise them is the app not listening — and it also measures nothing,
 * since the honest answer is "no" by construction. The Roman questions test
 * the same thing (how much Urdu do you already have?) in the alphabet the
 * learner just said they read.
 */
const PLACEMENT = [
  { q: 'Do you recognise this letter?', sub: 'س', kind: 'script', options: [{ label: "Yes, that's seen", c: true }, { label: 'No idea', c: false }] },
  { q: 'What does this word mean?', sub: 'پانی', kind: 'script', options: [{ label: 'Water', c: true }, { label: 'Bread', c: false }, { label: 'Fire', c: false }] },
  { q: 'Can you read this out loud, even slowly?', sub: 'کتاب', kind: 'script', options: [{ label: 'Yes, I can sound it out', c: true }, { label: 'Script is new to me', c: false }] },
  { q: 'What does "ghar" mean?', sub: 'ghar', kind: 'roman', options: [{ label: 'House', c: true }, { label: 'Tea', c: false }, { label: 'Moon', c: false }] },
  { q: 'What does "paani" mean?', sub: 'paani', kind: 'roman', options: [{ label: 'Water', c: true }, { label: 'Book', c: false }, { label: 'Night', c: false }] },
  { q: 'What does "shukriya" mean?', sub: 'shukriya', kind: 'roman', options: [{ label: 'Thank you', c: true }, { label: 'Sorry', c: false }, { label: 'Hello', c: false }] },
  { q: 'What does "maañ" mean?', sub: 'maañ', kind: 'roman', options: [{ label: 'Mother', c: true }, { label: 'Father', c: false }, { label: 'Sister', c: false }] },
];

/** The four questions a given track asks. */
const placementFor = (track: LearnTrack) =>
  (track === 'roman' ? PLACEMENT.filter((p) => p.kind === 'roman') : PLACEMENT).slice(0, 4);

type Step = 'welcome' | 'goal' | 'track' | 'background' | 'placement' | 'daily' | 'ready';

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
  const [background, setBackground] = useState<Background | null>(null);
  const [pIdx, setPIdx] = useState(0);
  const [pCorrect, setPCorrect] = useState(0);
  const [pAnswered, setPAnswered] = useState(false);
  const [pPicked, setPPicked] = useState<string | null>(null);
  const [daily, setDaily] = useState('steady');
  // opt-in, never the default — see the note on `canSkipScript` below
  const [skipScript, setSkipScript] = useState(false);

  const completeOnboarding = useProgressStore((s) => s.completeOnboarding);
  const setDailyGoal = useProgressStore((s) => s.setDailyGoal);
  const setTrackSetting = useSettingsStore((s) => s.setTrack);

  // The placement level and what it (plus a heritage background) skips —
  // computed here rather than inline in `finish` so the "ready" screen can
  // also describe it before the learner commits.
  const lvl = pCorrect >= 4 ? 2 : pCorrect >= 2 ? 1 : 0;

  /**
   * Two different claims, so two different skips.
   *
   * Knowing what `paani` and `ghar` mean is direct evidence about the basic
   * vocabulary, so that skip is automatic. Reading one letter and sounding out
   * one word is *not* evidence of knowing forty letters in four positional
   * forms each — so the alphabet is never skipped on the quiz's say-so. It is
   * offered, and the learner decides.
   *
   * The default is to keep it, because the two mistakes do not cost the same.
   * Sitting through lessons you did not need is mild, and the path already
   * lets you tap ahead to any lesson. Skipping the script and then meeting
   * words you cannot read is the kind of thing that makes someone quit.
   */
  const wantsScript = track !== 'roman';
  /**
   * Placement alone no longer skips anything.
   *
   * The four questions are multiple choice over two or three options, so two
   * correct — the old threshold for skipping the basic vocabulary — is roughly
   * what pure guessing scores. That meant someone who had just told us, in
   * their own words, that they are starting from scratch could be fast-tracked
   * past the beginning anyway, and land on a path that opens somewhere in the
   * middle of topics they have never seen.
   *
   * A person's own answer about whether they already speak Urdu is far better
   * evidence than a quiz they can guess, so the self-report is what decides:
   * only "I already speak or understand it" skips the basics, and only such a
   * learner is even offered the alphabet skip.
   */
  const isSpeaker = background === 'speaker';
  const canSkipScript = lvl === 2 && wantsScript && isSpeaker && SCRIPT_LESSON_IDS.length > 0;
  const basicsSkips = isSpeaker ? SKIPPABLE_FOR_SPEAKERS : [];
  const skipIds = Array.from(
    new Set([...basicsSkips, ...(canSkipScript && skipScript ? SCRIPT_LESSON_IDS : [])])
  );

  const finish = () => {
    setTrackSetting(track);
    setDailyGoal(daily);
    feedback.levelUp();
    completeOnboarding(goal ?? 'curious', lvl, background ?? 'new', skipIds);
  };

  // ---- welcome ----
  if (step === 'welcome') {
    return (
      <Screen scroll={false}>
        <Reveal style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center">
            <Urdu style={{ color: palette.gold, ...urduGlyph(76) }}>حرف</Urdu>
            <Display className="mb-3 text-4xl">Harf</Display>
            <GeoDivider />
            <Txt className="mb-10 max-w-[280px] text-center text-[15px] leading-6 text-paper/70">
              Learn to read Urdu the way it's really written: every letter in all four of its faces.
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
          <Dots step={0} total={5} />
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
                    <GoalArt goalKey={g.key} size={46} />
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
          <Dots step={1} total={5} />
          <Heading className="mb-1 text-2xl">How do you want to learn?</Heading>
          <Txt className="mb-4 text-sm text-paper/50">The most important choice here.</Txt>
          <TrackChooser value={track} onChange={setTrack} />
          <Button className="mt-6" onPress={() => setStep('background')}>
            Continue
          </Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- background ----
  if (step === 'background') {
    // Drawn art, like every other choice in the app. These two were the last
    // raw emoji on the screen a learner sees first.
    const OPTIONS: { key: Background; label: string; desc: string; icon: IconName }[] = [
      { key: 'new', label: "I'm starting from scratch", desc: 'Urdu is new to me, spoken and written', icon: 'sprout' },
      {
        key: 'speaker',
        label: 'I already speak or understand it',
        desc: "I grew up around it, but I can't read the script",
        icon: 'speechBubble',
      },
    ];
    return (
      <Screen>
        <Reveal>
          <Dots step={2} total={5} />
          <Heading className="mb-1 text-2xl">Do you already know some Urdu?</Heading>
          <Txt className="mb-6 text-sm text-paper/50">
            If you already understand it spoken, we'll skip the basic words you know and get you to the script faster.
          </Txt>
          <View className="gap-3">
            {OPTIONS.map((o) => {
              const sel = background === o.key;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    feedback.tap();
                    setBackground(o.key);
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
                    <Illustration name={o.icon} tile={false} size={34} />
                    <View className="flex-1">
                      <Bold className="text-[15px]">{o.label}</Bold>
                      <Txt className="text-xs text-paper/60">{o.desc}</Txt>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button
            className="mt-6"
            disabled={!background}
            onPress={() => { setPIdx(0); setPCorrect(0); setStep('placement'); }}
          >
            Continue
          </Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- placement ----
  if (step === 'placement') {
    const questions = placementFor(track);
    const question = questions[pIdx];
    const pick = (label: string, correct: boolean) => {
      if (pAnswered) return;
      setPAnswered(true);
      setPPicked(label);
      const nextCorrect = pCorrect + (correct ? 1 : 0);
      feedback.tap();
      setTimeout(() => {
        setPAnswered(false);
        setPPicked(null);
        if (pIdx < questions.length - 1) {
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
          <Dots step={3} total={5} />
          <Eyebrow style={{ color: palette.gold }} className="mb-3">
            Quick check · {pIdx + 1} of {questions.length}
          </Eyebrow>
          <Heading className="mb-6 text-xl">{question.q}</Heading>
          <View className="mb-8 h-28 items-center justify-center rounded-2xl bg-parchment">
            {question.kind === 'script' ? (
              <Urdu style={{ color: palette.ink, ...urduGlyph(52) }}>{question.sub}</Urdu>
            ) : (
              <Heading style={{ color: palette.ink }} className="text-2xl">{question.sub}</Heading>
            )}
          </View>
          <View className="gap-3">
            {question.options.map((opt) => {
              const picked = pPicked === opt.label;
              return (
                <Pressable key={opt.label} onPress={() => pick(opt.label, opt.c)}>
                  <View
                    className="rounded-xl border px-4 py-4"
                    style={{
                      borderWidth: 2,
                      borderColor: picked ? palette.gold : withAlpha(palette.white, 0.1),
                      backgroundColor: picked ? withAlpha(palette.gold, 0.12) : palette.ink700,
                    }}
                  >
                    <Txt className="text-[15px]">{opt.label}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Txt className="mt-6 text-center text-xs text-paper/30">
            No wrong answers here: this just finds your starting point.
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
          <Dots step={4} total={5} />
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
  // Honest labels. Four questions — recognise one letter, know two common
  // words, sound out a third — is evidence of having *some* Urdu already, and
  // nothing like B1. Telling someone they tested at B1 and then handing them
  // beginner lessons is a promise the next screen immediately breaks.
  const lvlName =
    lvl === 2 ? 'You already have some Urdu' : lvl === 1 ? 'You know a few words' : 'Starting from the beginning';
  return (
    <Screen scroll={false}>
      <Reveal style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <Illustration name="crescent" tile={false} size={64} />
          <Display className="mb-2 mt-4 text-3xl">You're all set</Display>
          <GeoDivider />
          <View className="my-4 w-full rounded-2xl border p-5" style={{ borderColor: withAlpha(palette.gold, 0.3), backgroundColor: withAlpha(palette.gold, 0.08) }}>
            <Eyebrow style={{ color: palette.gold }} className="mb-1">Your starting level</Eyebrow>
            <Bold className="text-lg">{lvlName}</Bold>
            <Txt className="mt-1 text-sm text-paper/60">
              We'll begin exactly where you are, and the words you miss will come back first.
            </Txt>
          </View>
          {basicsSkips.length > 0 && (
            <View className="mb-4 w-full rounded-2xl border p-5" style={{ borderColor: withAlpha(palette.jade, 0.3), backgroundColor: withAlpha(palette.jade, 0.08) }}>
              <Eyebrow style={{ color: palette.jade }} className="mb-1">Fast-tracked</Eyebrow>
              <Txt className="mt-1 text-sm text-paper/60">
                The basic words you already showed you know are marked done, so
                your path leads straight to the script and reading. Everything
                else is still yours to complete.
              </Txt>
            </View>
          )}

          {/* The one call the quiz will not make for you. */}
          {canSkipScript && (
            <View className="mb-4 w-full rounded-2xl border p-5" style={{ borderColor: withAlpha(palette.gold, 0.3), backgroundColor: withAlpha(palette.gold, 0.06) }}>
              <Eyebrow style={{ color: palette.gold }} className="mb-1">The alphabet</Eyebrow>
              <Txt className="mb-3 text-sm text-paper/60">
                You read every script question correctly. Do you want the nine
                alphabet lessons, or shall we mark them done?
              </Txt>
              {[
                { v: false, t: 'Start from the alphabet', d: 'All 40 letters, in each of their four shapes' },
                { v: true, t: 'Skip the alphabet', d: 'I can already read Urdu writing' },
              ].map((o) => {
                const on = skipScript === o.v;
                return (
                  <Pressable
                    key={String(o.v)}
                    onPress={() => { feedback.tap(); setSkipScript(o.v); }}
                    className="mb-2"
                  >
                    <View
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: on ? palette.gold : withAlpha(palette.white, 0.12),
                        backgroundColor: on ? withAlpha(palette.gold, 0.14) : palette.ink800,
                        borderWidth: on ? 2 : 1,
                      }}
                    >
                      <Bold className="text-sm">{o.t}</Bold>
                      <Txt className="text-xs text-paper/50">{o.d}</Txt>
                    </View>
                  </Pressable>
                );
              })}
              <Txt className="text-[11px] text-paper/35">
                Either way you can tap ahead to any lesson later.
              </Txt>
            </View>
          )}
          <Button className="mt-4 w-full" onPress={finish}>Start learning</Button>
        </View>
      </Reveal>
    </Screen>
  );
}
