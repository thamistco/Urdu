import { useMemo, useState } from 'react';
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
import { useSettingsStore, LearnTrack, VoiceGender } from '../../store/useSettingsStore';
import { announce, setVoiceSet } from '../../lib/speech';
import { shuffle } from '../../lib/shuffle';
import { MALE_VOICE_AVAILABLE } from '../../lib/voiceManifest';
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
 * What the quick check decides, now: only whether a learner who already speaks
 * Urdu is offered the alphabet skip, and whether their label says they read
 * some. Everything else comes from the learner's own answer about speaking it
 * (see `isSpeaker` below), and `startLevel` is saved but read by nothing. So
 * only a speaker takes it (P-005, 2026-10-07).
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
  { key: 'read', label: 'Read & write it', desc: 'Nastaliq, the Urdu script' },
  { key: 'heritage', label: 'Reconnect with heritage', desc: 'Poetry, faith, where your family is from' },
  { key: 'curious', label: 'I’m just curious', desc: 'No particular reason' },
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
/**
 * The placement questions.
 *
 * Two things were wrong with these. The correct answer was written first in
 * every single one, and they were rendered in written order — so the whole
 * placement test could be passed by tapping the top option four times without
 * reading a word of it. They are shuffled at render now (see `question`
 * below), and the answers are no longer written first here either, so the file
 * does not *look* like a key even though the shuffle is what makes it safe.
 *
 * And two of them were yes/no self-assessments. A learner's opinion of whether
 * they can read a word is weaker evidence than whether they actually can, and a
 * two-option question is a coin flip: guessing put someone a level up half the
 * time. Every question now demonstrates something, over exactly four options —
 * four fills the two-per-row grid, where a fifth sits alone on its own line.
 */
const PLACEMENT = [
  {
    q: 'Which letter is this?',
    sub: 'س',
    kind: 'script',
    options: [
      { label: 'sheen', c: false },
      { label: 'seen', c: true },
      { label: 'saad', c: false },
      { label: 'noon', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'پانی',
    kind: 'script',
    options: [
      { label: 'Bread', c: false },
      { label: 'Fire', c: false },
      { label: 'Water', c: true },
      { label: 'Door', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'کتاب',
    kind: 'script',
    options: [
      { label: 'Chair', c: false },
      { label: 'Book', c: true },
      { label: 'Road', c: false },
      { label: 'Hand', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'ghar',
    kind: 'roman',
    options: [
      { label: 'Tea', c: false },
      { label: 'Moon', c: false },
      { label: 'House', c: true },
      { label: 'Friend', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'paani',
    kind: 'roman',
    options: [
      { label: 'Book', c: false },
      { label: 'Water', c: true },
      { label: 'Night', c: false },
      { label: 'Rice', c: false },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'shukriya',
    kind: 'roman',
    options: [
      { label: 'Sorry', c: false },
      { label: 'Hello', c: false },
      { label: 'Goodbye', c: false },
      { label: 'Thank you', c: true },
    ],
  },
  {
    q: 'What does this word mean?',
    sub: 'maañ',
    kind: 'roman',
    options: [
      { label: 'Father', c: false },
      { label: 'Mother', c: true },
      { label: 'Sister', c: false },
      { label: 'Daughter', c: false },
    ],
  },
];

/** The four questions a given track asks. */
const placementFor = (track: LearnTrack) =>
  (track === 'roman' ? PLACEMENT.filter((p) => p.kind === 'roman') : PLACEMENT).slice(0, 4);

type Step = 'goal' | 'track' | 'voice' | 'background' | 'placement' | 'daily' | 'ready';

/**
 * The steps that show progress, in order.
 *
 * `ready` is the closing bookend and carries no dots. The voice step only
 * exists when there is a second voice to choose, so the flow — and therefore
 * every dot count — is derived rather than written down. Six hardcoded numbers
 * lived here before, and adding one step silently made four of them wrong.
 */
const FLOW: Step[] = ['goal', 'track', ...(MALE_VOICE_AVAILABLE ? (['voice'] as Step[]) : []), 'background', 'daily'];

function Dots({ of }: { of: Step }) {
  const at = FLOW.indexOf(of);
  return (
    <View className="mb-6 flex-row gap-1.5">
      {FLOW.map((key, i) => (
        <View
          key={key}
          className="h-1 flex-1 rounded-full"
          style={{ backgroundColor: i <= at ? palette.gold : withAlpha(palette.white, 0.12) }}
        />
      ))}
    </View>
  );
}

export function OnboardingScreen() {
  // Starts at the first question. There was a welcome step here, with the
  // wordmark, a headline and three numbers, one tap after the sign-in screen
  // had shown the wordmark and a tagline and asked the learner to start: two
  // front doors in a row, and a learner asked why there were two start
  // screens. The sign-in screen stays, as the door; this goes straight in.
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [track, setTrack] = useState<LearnTrack>('both');
  const [voice, setVoice] = useState<VoiceGender>('f');

  /**
   * The placement questions with their options shuffled.
   *
   * Memoised on the track, not computed in the render branch: shuffling there
   * would reorder the tiles under the learner's finger on every re-render, and
   * answering a question re-renders. Keyed on `track` because that is the only
   * thing that changes which questions are asked.
   */
  const placementQuestions = useMemo(
    () => placementFor(track).map((q) => ({ ...q, options: shuffle(q.options) })),
    [track]
  );
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
  const setVoiceGender = useSettingsStore((s) => s.setVoiceGender);

  // The placement level and what it (plus a heritage background) skips —
  // computed here rather than inline in `finish` so the "ready" screen can
  // also describe it before the learner commits.
  /**
   * Scored against how many were actually asked, not against a hard four.
   *
   * The Roman track filters `PLACEMENT` to its own questions and takes four,
   * and there are exactly four of them — so the top level needed a clean sweep
   * with no margin at all. Deleting one Roman question, or adding a third
   * track, would have capped that track at level 1 for everybody, silently:
   * nothing reads `lvl` except a speaker's label and whether they are offered
   * the alphabet skip, and neither announces itself.
   *
   * Written as "all of them" and "half of them" so the thresholds move with
   * the quiz instead of being two numbers that happen to match today.
   */
  const asked = placementQuestions.length;
  const lvl = asked === 0 ? 0 : pCorrect >= asked ? 2 : pCorrect >= Math.ceil(asked / 2) ? 1 : 0;

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
   * The four questions are multiple choice over four options, so two
   * correct — the old threshold for skipping the basic vocabulary — is what
   * pure guessing reaches about one time in four (26%, binomial at p = 0.25).
   * That meant someone who had just told us, in their own words, that they
   * are starting from scratch could be fast-tracked
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
  const skipIds = Array.from(new Set([...basicsSkips, ...(canSkipScript && skipScript ? SCRIPT_LESSON_IDS : [])]));

  const finish = () => {
    setTrackSetting(track);
    // Committed here rather than at the moment of tapping, so backing out of
    // onboarding leaves nothing behind. The preview during the step sets the
    // playback voice directly; this is what persists it.
    setVoiceGender(voice);
    setDailyGoal(daily);
    feedback.levelUp();
    completeOnboarding(goal ?? 'curious', lvl, background ?? 'new', skipIds);
  };

  // ---- goal ----
  if (step === 'goal') {
    return (
      <Screen>
        <Reveal>
          <Dots of="goal" />
          <Heading className="mb-1 text-2xl">Why are you learning Urdu?</Heading>
          <Txt className="mb-6 text-sm text-paper/55">This shapes which words we teach first.</Txt>
          <View className="gap-3">
            {GOALS.map((g) => {
              const sel = goal === g.key;
              return (
                <Pressable
                  accessibilityRole="button"
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
                      <Bold className="text-[0.9375rem]">{g.label}</Bold>
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
          <Dots of="track" />
          {/* No subtitle: TrackChooser's own opening line says the same thing
              concretely, with a real lesson count, two lines further down. */}
          <Heading className="mb-4 text-2xl">How do you want to learn?</Heading>
          <TrackChooser value={track} onChange={setTrack} />
          <Button className="mt-6" onPress={() => setStep(MALE_VOICE_AVAILABLE ? 'voice' : 'background')}>
            Continue
          </Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- voice ----
  /**
   * Whose voice reads the Urdu.
   *
   * Only reachable when the second set of clips has actually been generated —
   * see MALE_VOICE_AVAILABLE. A questionnaire that offers a choice the app
   * cannot honour is worse than not asking: picking the missing voice would
   * leave every word with no clip, and the fallback is the device's own
   * text-to-speech, which has no Urdu and reads the script in English.
   */
  if (step === 'voice') {
    const OPTIONS: { key: VoiceGender; label: string; desc: string; icon: IconName }[] = [
      { key: 'f', label: 'A woman’s voice', desc: 'The voice the course was recorded in', icon: 'woman' },
      { key: 'm', label: 'A man’s voice', desc: 'The whole course, in a second recording', icon: 'man' },
    ];
    return (
      <Screen>
        <Reveal>
          <Dots of="voice" />
          <Heading className="mb-1 text-2xl">Whose voice would you like?</Heading>
          <Txt className="mb-4 text-sm text-paper/55">
            Every word is read aloud by a real recorded voice. You can change this later in Settings.
          </Txt>
          {OPTIONS.map((o) => {
            const active = voice === o.key;
            return (
              <Pressable
                key={o.key}
                onPress={() => {
                  feedback.tap();
                  setVoice(o.key);
                  // Say something in it, so the choice is made by ear rather
                  // than by label — which is the only way to choose a voice.
                  setVoiceSet(o.key);
                  announce('w-salam', 'السلام علیکم', 'assalaam-o-alaikum');
                }}
                accessibilityRole="button"
                accessibilityLabel={`${o.label}. ${o.desc}. Tap to hear it.`}
              >
                <View
                  className="mb-3 flex-row items-center gap-3 rounded-2xl border p-4"
                  style={{
                    borderColor: active ? palette.gold : withAlpha(palette.white, 0.1),
                    backgroundColor: active ? withAlpha(palette.gold, 0.12) : palette.ink800,
                    borderWidth: 2,
                  }}
                >
                  <Illustration name={o.icon} size={44} />
                  <View className="flex-1">
                    <Bold className="text-[0.9375rem]">{o.label}</Bold>
                    <Txt className="text-xs text-paper/55">{o.desc}</Txt>
                  </View>
                  <Illustration name="speaker" tile={false} size={20} />
                </View>
              </Pressable>
            );
          })}
          <Txt className="mb-2 text-center text-[0.6875rem] text-paper/55">Tap either one to hear it.</Txt>
          <Button className="mt-2" onPress={() => setStep('background')}>
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
      { key: 'new', label: 'I’m starting from scratch', desc: 'Urdu is new to me, spoken and written', icon: 'sprout' },
      {
        key: 'speaker',
        label: 'I already speak or understand it',
        desc: 'I grew up around it, but I can’t read the script',
        icon: 'speechBubble',
      },
    ];
    return (
      <Screen>
        <Reveal>
          <Dots of="background" />
          <Heading className="mb-1 text-2xl">Do you already know some Urdu?</Heading>
          <Txt className="mb-6 text-sm text-paper/55">
            If you already understand it spoken, we’ll skip the basic words you know and get you to the script faster.
          </Txt>
          <View className="gap-3">
            {OPTIONS.map((o) => {
              const sel = background === o.key;
              return (
                <Pressable
                  accessibilityRole="button"
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
                      <Bold className="text-[0.9375rem]">{o.label}</Bold>
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
            onPress={() => {
              setPIdx(0);
              setPCorrect(0);
              // The quick check is only for someone who already speaks Urdu.
              // For a beginner every answer led to the same path, so it was
              // four questions that decided nothing, under a line saying they
              // worked out where to start (daily review 2026-10-07, P-005).
              setStep(background === 'speaker' ? 'placement' : 'daily');
            }}
          >
            Continue
          </Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- placement ----
  if (step === 'placement') {
    const questions = placementQuestions;
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
          {/* Part of the "do you know some Urdu" step, not a step of its own:
              only a speaker is asked it, and a dot count that changed with
              the answer would jump under the learner mid-flow. */}
          <Dots of="background" />
          <Eyebrow style={{ color: palette.gold }} className="mb-3">
            Quick check · {pIdx + 1} of {questions.length}
          </Eyebrow>
          <Heading className="mb-6 text-xl">{question.q}</Heading>
          <View className="mb-8 h-28 items-center justify-center rounded-2xl bg-parchment">
            {question.kind === 'script' ? (
              <Urdu style={{ color: palette.ink, ...urduGlyph(52) }}>{question.sub}</Urdu>
            ) : (
              <Heading style={{ color: palette.ink }} className="text-2xl">
                {question.sub}
              </Heading>
            )}
          </View>
          <View className="gap-3">
            {question.options.map((opt) => {
              const picked = pPicked === opt.label;
              return (
                <Pressable accessibilityRole="button" key={opt.label} onPress={() => pick(opt.label, opt.c)}>
                  <View
                    className="rounded-xl border px-4 py-4"
                    style={{
                      borderWidth: 2,
                      borderColor: picked ? palette.gold : withAlpha(palette.white, 0.1),
                      backgroundColor: picked ? withAlpha(palette.gold, 0.12) : palette.ink700,
                    }}
                  >
                    <Txt className="text-[0.9375rem]">{opt.label}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Txt className="mt-6 text-center text-xs text-paper/55">
            No wrong answers. This only works out where to start you.
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
          <Dots of="daily" />
          <Heading className="mb-1 text-2xl">Set a daily goal</Heading>
          <Txt className="mb-6 text-sm text-paper/55">
            Choose one you can keep. You can change it whenever you like.
          </Txt>
          <View className="gap-3">
            {DAILY_GOALS.map((g) => {
              const sel = daily === g.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={g.id}
                  onPress={() => {
                    feedback.tap();
                    setDaily(g.id);
                  }}
                >
                  <View
                    className="flex-row items-center justify-between rounded-2xl border p-4"
                    style={{
                      borderColor: sel ? palette.gold : withAlpha(palette.white, 0.1),
                      backgroundColor: sel ? withAlpha(palette.gold, 0.1) : palette.ink700,
                      borderWidth: 2,
                    }}
                  >
                    <View>
                      <Bold className="text-[0.9375rem]">{g.label}</Bold>
                      <Txt className="text-xs text-paper/60">{g.desc}</Txt>
                    </View>
                    <Bold style={{ color: palette.gold }}>+{g.xp} XP</Bold>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button className="mt-6" onPress={() => setStep('ready')}>
            Continue
          </Button>
        </Reveal>
      </Screen>
    );
  }

  // ---- ready ----
  // Honest labels. Four questions — recognise one letter, know two common
  // words, sound out a third — is evidence of having *some* Urdu already, and
  // nothing like B1. Telling someone they tested at B1 and then handing them
  // beginner lessons is a promise the next screen immediately breaks.
  //
  // And the same evidence that is too weak to *skip* anything (see
  // `canSkipScript` above, where two right out of four is called roughly what
  // guessing scores) is too weak to contradict the learner either. Someone who
  // had just answered "I'm starting from scratch" and then guessed two of four
  // was shown "You know a few words" over a path that skipped nothing, so the
  // card described a learner who was not there and a head start that did not
  // exist.
  //
  // So the label says what the learner said, and the quiz only refines it. Two
  // different things are being measured and each is read for what it is worth:
  // the background answer is about speaking, and it is the one that skips the
  // basic vocabulary, so it decides the card below too. The script questions
  // are about reading, and all they can do is sharpen a speaker's label from
  // "speaks some" to "reads some".
  const lvlName = !isSpeaker
    ? 'Starting from the beginning'
    : lvl === 2
      ? 'You already read some Urdu'
      : 'You already speak some Urdu';
  return (
    <Screen scroll={false}>
      <Reveal style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <Illustration name="crescent" tile={false} size={64} />
          <Display className="mb-2 mt-4 text-3xl">You’re all set</Display>
          <GeoDivider />
          <View
            className="my-4 w-full rounded-2xl border p-5"
            style={{ borderColor: withAlpha(palette.gold, 0.3), backgroundColor: withAlpha(palette.gold, 0.08) }}
          >
            <Eyebrow style={{ color: palette.gold }} className="mb-1">
              Your starting level
            </Eyebrow>
            <Bold className="text-lg">{lvlName}</Bold>
            <Txt className="mt-1 text-sm text-paper/60">
              We start you where you are, and the words you miss come back first.
            </Txt>
          </View>
          {basicsSkips.length > 0 && (
            <View
              className="mb-4 w-full rounded-2xl border p-5"
              style={{ borderColor: withAlpha(palette.jade, 0.3), backgroundColor: withAlpha(palette.jade, 0.08) }}
            >
              <Eyebrow style={{ color: palette.jade }} className="mb-1">
                Moved ahead
              </Eyebrow>
              <Txt className="mt-1 text-sm text-paper/60">
                The basic words you showed you know are marked done, so you go straight to the script and reading. The
                rest of the course is still there.
              </Txt>
            </View>
          )}

          {/* The one call the quiz will not make for you. */}
          {canSkipScript && (
            <View
              className="mb-4 w-full rounded-2xl border p-5"
              style={{ borderColor: withAlpha(palette.gold, 0.3), backgroundColor: withAlpha(palette.gold, 0.06) }}
            >
              <Eyebrow style={{ color: palette.gold }} className="mb-1">
                The alphabet
              </Eyebrow>
              <Txt className="mb-3 text-sm text-paper/60">
                You read every script question correctly. Do you want the nine alphabet lessons, or shall we mark them
                done?
              </Txt>
              {[
                { v: false, t: 'Start from the alphabet', d: 'All 40 letters, in each of their four shapes' },
                { v: true, t: 'Skip the alphabet', d: 'I can already read Urdu writing' },
              ].map((o) => {
                const on = skipScript === o.v;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={String(o.v)}
                    onPress={() => {
                      feedback.tap();
                      setSkipScript(o.v);
                    }}
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
                      <Txt className="text-xs text-paper/55">{o.d}</Txt>
                    </View>
                  </Pressable>
                );
              })}
              <Txt className="text-[0.6875rem] text-paper/55">Either way you can tap ahead to any lesson later.</Txt>
            </View>
          )}
          <Button className="mt-4 w-full" onPress={finish}>
            Start learning
          </Button>
        </View>
      </Reveal>
    </Screen>
  );
}
