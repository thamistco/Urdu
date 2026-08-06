import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Reveal } from '../../components/Reveal';
import { GeoDivider } from '../../components/GeoDivider';
import { Wordmark } from '../../components/Wordmark';
import { DuskScene } from '../../components/EveningScene';
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
import { WORDS } from '../../data/words';
import { ALL_LESSONS } from '../../data/units';
import { LETTERS } from '../../data/letters';

/**
 * What the welcome screen promises, counted rather than typed.
 *
 * Every other place the course describes itself — the README, the store
 * listing, the app description — holds these numbers as literals, and all of
 * them had drifted from the content by the time anyone checked. Copy inside the
 * app cannot be allowed to do that: it is the one version a learner reads while
 * the real answer is one import away.
 */
const n = (x: number) => x.toLocaleString('en-US');

/**
 * Three numbers, because nobody reads a fourth.
 *
 * The version before this one was six bullets, a four-line paragraph and a
 * three-line footnote — everything true about the course, and a wall of text at
 * the one moment a person is deciding whether to bother. It listed features
 * where it needed to make a case.
 *
 * A number is the shortest possible argument, and these three are chosen to
 * trace the course rather than to boast: letters, then words, then grammar is
 * the shape of learning a language, and a person can see in one glance that
 * this goes all the way. An earlier version led with 160 — forty letters across
 * four joining forms — which is the better hook and the worse promise: it is
 * the first unit of the course standing in for the whole of it, and someone who
 * wants to *speak* Urdu reads that and correctly leaves.
 *
 * The third figure was "25 grammar" for one release, which is not a phrase in
 * English — a count of a mass noun, left over from shortening "grammar ideas"
 * to stop it wrapping. Fixing the wrap had broken the sense, which is the wrong
 * trade every time. Lessons reads cleanly at any width, is the plainest measure
 * of how much course there is, and leaves grammar to the line below where it
 * can be a sentence.
 *
 * Everything else sits under the button in two plain sentences rather than a
 * row of words separated by dots. Dots are a spec sheet; this screen is meeting
 * someone.
 */
const STATS = [
  { value: n(LETTERS.length), label: 'letters' },
  { value: n(WORDS.length), label: 'spoken words' },
  { value: n(ALL_LESSONS.length), label: 'lessons' },
];

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
    q: 'What does "ghar" mean?',
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
    q: 'What does "paani" mean?',
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
    q: 'What does "shukriya" mean?',
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
    q: 'What does "maañ" mean?',
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

type Step = 'welcome' | 'goal' | 'track' | 'voice' | 'background' | 'placement' | 'daily' | 'ready';

/**
 * The steps that show progress, in order.
 *
 * `welcome` and `ready` are bookends and carry no dots. The voice step only
 * exists when there is a second voice to choose, so the flow — and therefore
 * every dot count — is derived rather than written down. Six hardcoded numbers
 * lived here before, and adding one step silently made four of them wrong.
 */
const FLOW: Step[] = [
  'goal',
  'track',
  ...(MALE_VOICE_AVAILABLE ? (['voice'] as Step[]) : []),
  'background',
  'placement',
  'daily',
];

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
  const [step, setStep] = useState<Step>('welcome');
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

  // ---- welcome ----
  if (step === 'welcome') {
    // Scrolls, and centres itself when there is room to. `scroll={false}` held
    // this screen while it was a headline and three numbers; two sentences of
    // small print later it was cropping the wordmark off the top and the last
    // line off the bottom of a 568pt phone. `grow` on the scroll content is
    // what keeps it centred on a tall screen while still letting a short one
    // move.
    return (
      <Screen backdrop={<DuskScene />} contentClassName="grow justify-center">
        <Reveal>
          <View className="items-center">
            <Wordmark size={62} />

            {/* The case, in eleven words. Everything this screen has said
                across three rewrites was true and none of it was read: a
                paragraph explaining Nastaliq, then six bullets, then a
                footnote. A person on a welcome screen is deciding whether to
                bother, and prose asks them to have decided already. */}
            <Display accessibilityRole="header" className="mt-7 text-center text-[27px] leading-9">
              Learn Urdu properly.
            </Display>
            <Txt className="mb-8 mt-2 max-w-[300px] text-center text-[14px] leading-5 text-paper/85">
              From the first letter to a real conversation.
            </Txt>

            <View className="mb-9 w-full max-w-[330px] flex-row justify-between gap-2">
              {STATS.map((s) => (
                /* Grouped and labelled, so a screen reader says "40 letters"
                   rather than reading a bare number and its caption as two
                   unrelated things several stops apart. */
                <View
                  key={s.label}
                  accessible
                  accessibilityLabel={`${s.value} ${s.label}`}
                  className="flex-1 items-center"
                >
                  <Display className="text-[26px] leading-8" style={{ color: palette.gold }}>
                    {s.value}
                  </Display>
                  {/* Not `Eyebrow`: its 2px tracking is right for a section
                      label and wraps "spoken words" onto two lines in a column
                      this narrow, leaving one stat sitting a line lower than
                      the other two. */}
                  <Txt
                    className="mt-1.5 text-center text-[11px] uppercase text-paper/80"
                    style={{ letterSpacing: 0.6 }}
                  >
                    {s.label}
                  </Txt>
                </View>
              ))}
            </View>

            <Button className="w-full max-w-[300px]" onPress={() => setStep('goal')}>
              Let's start
            </Button>
            {/* The reassurances, not the pitch — and sentences rather than a
                dotted list, because "Roman track" told nobody anything. It is
                this project's own word for a setting, and a person who has
                never opened the app cannot know it names the one thing that
                decides whether the course is for them. Said plainly, it is the
                answer to "so this is only for people learning the script".

                Nothing here goes below 80% paper: on the dusk scene's
                horizon glow, 75% is the WCAG AA floor, and the old value was
                40% — under AA even on flat ink, at 3.51:1. */}
            <Txt className="mt-6 max-w-[320px] text-center text-[12.5px] leading-5 text-paper/80">
              Grammar, readings and conversations, with review that brings a word back just before you forget it. Always
              free.
            </Txt>
            <Txt className="mt-2.5 max-w-[320px] text-center text-[12.5px] leading-5 text-paper/80">
              New to the Urdu script? Learn the whole course in English letters instead, and switch over whenever you're
              ready.
            </Txt>
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
          <Dots of="goal" />
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
          <Dots of="track" />
          <Heading className="mb-1 text-2xl">How do you want to learn?</Heading>
          <Txt className="mb-4 text-sm text-paper/50">The most important choice here.</Txt>
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
      { key: 'm', label: 'A man’s voice', desc: 'The same words, same pace', icon: 'man' },
    ];
    return (
      <Screen>
        <Reveal>
          <Dots of="voice" />
          <Heading className="mb-1 text-2xl">Whose voice would you like?</Heading>
          <Txt className="mb-4 text-sm text-paper/50">
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
                    <Bold className="text-[15px]">{o.label}</Bold>
                    <Txt className="text-xs text-paper/55">{o.desc}</Txt>
                  </View>
                  <Illustration name="speaker" tile={false} size={20} />
                </View>
              </Pressable>
            );
          })}
          <Txt className="mb-2 text-center text-[11px] text-paper/40">Tap either one to hear it.</Txt>
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
          <Dots of="background" />
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
            onPress={() => {
              setPIdx(0);
              setPCorrect(0);
              setStep('placement');
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
          <Dots of="placement" />
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
          <Dots of="daily" />
          <Heading className="mb-1 text-2xl">Set a daily goal</Heading>
          <Txt className="mb-6 text-sm text-paper/50">A gentle contract with yourself. Change it whenever.</Txt>
          <View className="gap-3">
            {DAILY_GOALS.map((g) => {
              const sel = daily === g.id;
              return (
                <Pressable
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
                      <Bold className="text-[15px]">{g.label}</Bold>
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
  const lvlName =
    lvl === 2 ? 'You already have some Urdu' : lvl === 1 ? 'You know a few words' : 'Starting from the beginning';
  return (
    <Screen scroll={false}>
      <Reveal style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <Illustration name="crescent" tile={false} size={64} />
          <Display className="mb-2 mt-4 text-3xl">You're all set</Display>
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
              We'll begin exactly where you are, and the words you miss will come back first.
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
                The basic words you already showed you know are marked done, so your path leads straight to the script
                and reading. Everything else is still yours to complete.
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
                      <Txt className="text-xs text-paper/50">{o.d}</Txt>
                    </View>
                  </Pressable>
                );
              })}
              <Txt className="text-[11px] text-paper/35">Either way you can tap ahead to any lesson later.</Txt>
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
