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
import { readableWords, pickRound, wordsPerMinute, MIN_WORDS_FOR_A_ROUND, type Attempt } from '../lib/readingPace';

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

  const start = () => {
    setRound(pickRound(pool));
    setIndex(0);
    setAttempts([]);
    setNewBest(false);
    shownAt.current = Date.now();
    setPhase('reading');
  };

  const word = round[index];

  const reveal = () => {
    readMs.current = Date.now() - shownAt.current;
    setPhase('revealed');
    announce(word.id, word.urdu, word.roman);
  };

  const mark = (read: boolean) => {
    const next = [...attempts, { ms: readMs.current, read }];
    setAttempts(next);
    if (index + 1 < round.length) {
      setIndex(index + 1);
      shownAt.current = Date.now();
      setPhase('reading');
      return;
    }
    setNewBest(recordReadingPace(wordsPerMinute(next)));
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
          There is no clock to beat. At the end you see your pace, and it only ever counts the words you read.
        </Txt>
        {best > 0 ? (
          <Txt className="mb-4 text-sm text-paper/75">
            Your best so far: <Bold>{best} words a minute</Bold>
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
        <Eyebrow style={{ color: palette.gold }}>{newBest ? 'New best' : 'Round done'}</Eyebrow>
        <Display className="mt-1 text-4xl">{pace} words a minute</Display>
        <Txt className="mb-6 mt-2 text-sm text-paper/75">
          You read {read} of {attempts.length}.{best > 0 && !newBest ? ` Your best is ${best}.` : ''}
        </Txt>
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
    <Shell onBack={back} label={`${index + 1} / ${round.length}`}>
      <View
        className="mb-6 mt-4 items-center justify-center rounded-2xl bg-parchment px-6"
        style={{ minHeight: 200, borderWidth: 2, borderColor: palette.ink }}
      >
        <Urdu style={{ color: palette.ink, ...urduGlyph(56) }}>{word.urdu}</Urdu>
        {phase === 'revealed' ? (
          <Txt style={{ color: withAlpha(palette.ink, 0.75) }} className="mb-4 text-center text-base">
            {word.roman} · {glossOf(word)}
          </Txt>
        ) : null}
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
