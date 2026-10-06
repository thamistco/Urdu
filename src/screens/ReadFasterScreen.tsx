import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Reveal } from '../components/Reveal';
import { Button } from '../components/Button';
import { Display, Heading, Txt, Bold, Eyebrow, Urdu, urduGlyph } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { announce } from '../lib/speech';
import { WORDS, glossOf, type Word } from '../data/words';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  readableWords,
  pickRound,
  wordsPerMinute,
  countsTowardBest,
  MIN_WORDS_FOR_A_ROUND,
  type Attempt,
} from '../lib/readingPace';

/**
 * Taps are ignored this long after the screen changes. "Show me" and "I read
 * it" sit in the same place, so a double tap on one used to land on the other:
 * a word marked read that was never looked at.
 */
const TAP_GUARD_MS = 300;

type Phase = 'intro' | 'reading' | 'revealed' | 'done';

/**
 * Read faster: ten words the learner already knows, one at a time, in the
 * script only. They read it, tap to check, and say whether they read it. The
 * time each word sat on screen before the tap gives a pace. See
 * lib/readingPace.ts for why, and for what the pace does and does not count.
 *
 * Nothing here is timed against the learner: no countdown, no hearts, no pass
 * mark. The clock only describes, after the round, and only beats a best.
 */
export function ReadFasterScreen() {
  const nav = useNavigation();
  const learnedWords = useProgressStore((s) => s.learnedWords);
  const best = useProgressStore((s) => s.readingBestWpm);
  const recordReadingPace = useProgressStore((s) => s.recordReadingPace);
  const track = useSettingsStore((s) => s.track);

  const pool = useMemo(() => readableWords(learnedWords, WORDS), [learnedWords]);
  const [round, setRound] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [newBest, setNewBest] = useState(false);
  const shownAt = useRef(0);
  const readMs = useRef(0);
  const guardUntil = useRef(0);
  const settle = () => {
    guardUntil.current = Date.now() + TAP_GUARD_MS;
  };
  const guarded = () => Date.now() < guardUntil.current;

  const start = () => {
    setRound(pickRound(pool));
    setIndex(0);
    setAttempts([]);
    setNewBest(false);
    shownAt.current = Date.now();
    settle();
    setPhase('reading');
  };

  const word = round[index];

  const reveal = () => {
    if (guarded()) return;
    readMs.current = Date.now() - shownAt.current;
    settle();
    setPhase('revealed');
    announce(word.id, word.urdu, word.roman);
  };

  const mark = (read: boolean) => {
    if (guarded()) return;
    const next = [...attempts, { ms: readMs.current, read }];
    setAttempts(next);
    settle();
    if (index + 1 < round.length) {
      setIndex(index + 1);
      shownAt.current = Date.now();
      setPhase('reading');
      return;
    }
    // A best is kept only from a round that was mostly read, so a tap-through
    // or a round of misses can never set a figure an honest round cannot beat.
    setNewBest(countsTowardBest(next) && recordReadingPace(wordsPerMinute(next)));
    setPhase('done');
  };

  const back = () => nav.goBack();

  if (track === 'roman') {
    return (
      <Shell onBack={back}>
        <Heading className="mb-2 text-xl">Read faster is for the Urdu script</Heading>
        <Txt className="text-sm leading-6 text-paper/70">
          You are learning in English letters, so there is no script to speed up yet. Switch your learning track in
          Settings whenever you want to start reading Urdu.
        </Txt>
      </Shell>
    );
  }

  if (pool.length < MIN_WORDS_FOR_A_ROUND) {
    return (
      <Shell onBack={back}>
        <Heading className="mb-2 text-xl">Learn a few more words first</Heading>
        <Txt className="text-sm leading-6 text-paper/70">
          Read faster uses only words you have already learned, so it never tests a word you have not met. It opens once
          you know {MIN_WORDS_FOR_A_ROUND}. You know {pool.length} so far.
        </Txt>
      </Shell>
    );
  }

  if (phase === 'intro') {
    return (
      <Shell onBack={back}>
        <Eyebrow style={{ color: palette.gold }}>Practice</Eyebrow>
        <Display className="mt-1 text-3xl">Read faster</Display>
        <Txt className="mb-6 mt-2 text-sm leading-6 text-paper/75">
          Knowing the letters is the start. Reading is seeing a word and knowing it without spelling it out. Ten words
          you already know, one at a time: read each one, then tap to check yourself.
        </Txt>
        <Txt className="mb-6 text-xs leading-5 text-paper/60">
          There is no clock to beat. At the end you see how many words a minute you recognised, one at a time. It only
          ever counts the words you read.
        </Txt>
        {best > 0 ? (
          <Txt className="mb-4 text-sm text-paper/75">
            Your best so far: <Bold>{best} a minute</Bold>, one word at a time
          </Txt>
        ) : null}
        <Button onPress={start}>Start</Button>
      </Shell>
    );
  }

  if (phase === 'done') {
    const read = attempts.filter((a) => a.read).length;
    const pace = wordsPerMinute(attempts);
    return (
      <Shell onBack={back}>
        {/* Announced when it appears: the button that led here is gone, so a
            screen reader would otherwise say nothing about the result. */}
        <View aria-live="polite">
          <Eyebrow style={{ color: palette.gold }}>{newBest ? 'New best' : 'Round done'}</Eyebrow>
          {/* "A minute, one word at a time", not "words a minute": this is the
              pace of recognising single words, tap included, and set next to
              prose reading speeds a bare figure would read as failing. */}
          <Display className="mt-1 text-4xl">{pace > 0 ? `${pace} a minute` : 'None this time'}</Display>
          <Txt className="mb-6 mt-2 text-sm text-paper/75">
            {pace > 0 ? 'Words recognised, one at a time. ' : ''}You read {read} of {attempts.length}.
            {best > 0 && !newBest ? ` Your best is ${best} a minute.` : ''}
          </Txt>
        </View>
        <View className="gap-3">
          <Button onPress={start}>Another round</Button>
          <Button variant="ghost" onPress={back}>
            Done
          </Button>
        </View>
      </Shell>
    );
  }

  return (
    <Shell onBack={back} label={`${index + 1} of ${round.length}`}>
      <View
        className="mb-6 mt-4 items-center justify-center rounded-2xl bg-parchment px-6"
        style={{ minHeight: 200, borderWidth: 2, borderColor: palette.ink }}
      >
        {/* Labelled so a screen reader does not read the word out, which would
            give the answer away and turn reading into listening. */}
        <Urdu
          accessibilityLabel="An Urdu word to read. Read it, then choose Show me."
          style={{ color: palette.ink, ...urduGlyph(56) }}
        >
          {word.urdu}
        </Urdu>
        <View aria-live="polite">
          {phase === 'revealed' ? (
            <Txt style={{ color: withAlpha(palette.ink, 0.75) }} className="mb-4 text-center text-base">
              {word.roman} · {glossOf(word)}
            </Txt>
          ) : null}
        </View>
      </View>
      {phase === 'reading' ? (
        <Button onPress={reveal}>Show me</Button>
      ) : (
        <View className="gap-3">
          <Button variant="correct" onPress={() => mark(true)}>
            I read it
          </Button>
          <Button variant="ghost" onPress={() => mark(false)}>
            Not yet
          </Button>
        </View>
      )}
    </Shell>
  );
}

function Shell({ onBack, label, children }: { onBack: () => void; label?: string; children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={onBack} label={label} />
        <Reveal>{children}</Reveal>
      </Screen>
    </View>
  );
}
