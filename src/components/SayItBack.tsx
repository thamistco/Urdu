import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Audio } from 'expo-av';
import Svg, { Path, Rect } from 'react-native-svg';
import { announce, onPlaybackChange, isPlaying, isSpeechMuted } from '../lib/speech';
import { palette, withAlpha } from '../theme';
import { Txt } from './Text';

type Phase = 'idle' | 'recording' | 'ready' | 'blocked';

/** Long enough for any line in the course read slowly; a forgotten tap stops itself. */
const MAX_RECORDING_MS = 10_000;

/**
 * If the native clip has not started by now (no clip, a slow first load), play
 * the learner's own anyway. Long enough that a slow first load does not have
 * the two clips talking over each other.
 */
const NATIVE_START_GRACE_MS = 1200;

/** 24pt circles plus this on every side make the 44pt minimum touch target. */
const HIT_SLOP = 10;

/**
 * Only one line records at a time. expo-av allows a single recorder, so a
 * second start used to fail and say "Microphone not allowed", which was not the
 * problem. Starting a line now stops whichever line was recording.
 */
let active: { owner: object; stop: (compareAfter: boolean) => Promise<void> } | null = null;

/** The line whose turn it is to record, claimed the moment its microphone is tapped. */
let claim: object | null = null;

/**
 * Say it back: repeat a line aloud and hear yourself next to the recording.
 *
 * Speaking is the gap learners name first in every big language app, and Qaaf
 * had none. Shadowing (repeating audio as you hear it) improved pronunciation
 * and listening in published studies. Daily review 2026-10-06, proposal P-003.
 *
 * What it deliberately does not do:
 * - Score the learner. Speech scoring is what other apps' reviews complain
 *   about most, failing even in a quiet room.
 * - Hold up a lesson. Nothing here touches grading, so a learner who cannot or
 *   would rather not speak loses nothing.
 * - Send the recording anywhere. On the web it lives in browser memory and is
 *   released when the line leaves the screen. On a phone, expo-av writes it to
 *   the app's temporary storage, where it stays until the system clears it;
 *   the privacy policy says exactly that.
 * - Make a sound when the learner has turned sound off.
 */
export function SayItBack({
  clipId,
  urdu,
  roman,
  size = 24,
  stack = false,
}: {
  clipId: string;
  urdu: string;
  roman?: string;
  size?: number;
  /** Put "hear yourself" under the microphone rather than beside it: a
   *  reading line keeps its buttons in a narrow column beside the Urdu, and
   *  side by side they squeezed the text into an extra line at 320px. */
  stack?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const recording = useRef<Audio.Recording | null>(null);
  const yours = useRef<Audio.Sound | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A start or stop is mid-flight. Taps during it are ignored: a second start
  // while the permission prompt was up used to open a second microphone
  // stream on the web that nothing ever closed.
  const busy = useRef(false);
  const mounted = useRef(true);
  // Stable for the life of this line, so the one-at-a-time lock can tell this
  // line from another across renders.
  const self = useRef({}).current;
  const stopRef = useRef<(compareAfter: boolean) => Promise<void>>(async () => {});

  const release = async () => {
    if (autoStop.current) clearTimeout(autoStop.current);
    autoStop.current = null;
    const r = recording.current;
    recording.current = null;
    if (r) {
      await r.stopAndUnloadAsync().catch(() => {});
      // Back to playback mode, or iOS keeps routing later audio for recording.
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
    }
    return r;
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (active?.owner === self) active = null;
      if (claim === self) claim = null;
      void release();
      yours.current?.unloadAsync().catch(() => {});
    };
    // Runs once: the line owns its recorder for as long as it is on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playYours = () => {
    if (isSpeechMuted()) return;
    yours.current?.replayAsync().catch(() => {});
  };

  /** The native recording first, then the learner's, back to back. */
  const compare = () => {
    if (isSpeechMuted()) return;
    let started = false;
    const off = onPlaybackChange((on) => {
      if (on) started = true;
      else if (started) {
        off();
        if (mounted.current) playYours();
      }
    });
    announce(clipId, urdu, roman);
    setTimeout(() => {
      if (!started && !isPlaying()) {
        off();
        if (mounted.current) playYours();
      }
    }, NATIVE_START_GRACE_MS);
  };

  /** Still this line's turn: on screen, and not pre-empted by another line. */
  const stillMine = () => mounted.current && claim === self;

  /**
   * Stop recording. After a learner's own tap (or the 10 s limit) the two
   * clips play back to back; when another line pre-empts this one, it goes
   * quiet instead, or this line's comparison would play into the new line's
   * recording.
   */
  async function stopThis(compareAfter = true) {
    if (busy.current) return;
    busy.current = true;
    try {
      if (active?.owner === self) active = null;
      if (claim === self) claim = null;
      const r = await release();
      if (!r || !mounted.current) return;
      const uri = r.getURI();
      if (!uri) return setPhase('idle');
      const { sound } = await Audio.Sound.createAsync({ uri });
      if (!mounted.current) {
        await sound.unloadAsync().catch(() => {});
        return;
      }
      await yours.current?.unloadAsync().catch(() => {});
      yours.current = sound;
      setPhase('ready');
      if (compareAfter) compare();
    } catch {
      if (mounted.current) setPhase('idle');
    } finally {
      busy.current = false;
    }
  }

  stopRef.current = stopThis;

  const start = async () => {
    if (busy.current) return;
    busy.current = true;
    // Claimed before the first await, so a second line tapped while this one
    // waits on the permission prompt takes the turn and this one backs out,
    // rather than both opening a microphone.
    claim = self;
    try {
      if (active && active.owner !== self) await active.stop(false);
      const permission = await Audio.requestPermissionsAsync();
      if (!stillMine()) return;
      if (!permission.granted) return setPhase('blocked');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      if (!stillMine()) {
        await r.stopAndUnloadAsync().catch(() => {});
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
        return;
      }
      recording.current = r;
      active = { owner: self, stop: (compareAfter: boolean) => stopRef.current(compareAfter) };
      setPhase('recording');
      autoStop.current = setTimeout(() => void stopThis(), MAX_RECORDING_MS);
    } catch {
      // Permission was granted or never asked; something else failed (another
      // app holding the microphone, an unsupported browser). Not a permission
      // problem, so it does not say so, and playback mode is restored.
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
      if (mounted.current) setPhase('idle');
    } finally {
      busy.current = false;
    }
  };

  const recordingNow = phase === 'recording';
  const micLabel = recordingNow
    ? 'Stop recording and compare'
    : phase === 'ready'
      ? 'Record yourself saying this line again'
      : phase === 'blocked'
        ? 'Microphone not allowed. Allow it in your settings to say this line back'
        : 'Say it back: record yourself saying this line, for up to 10 seconds';

  return (
    <View className="items-center">
      {/* 20pt apart: each button's 10pt hit slop reaches halfway, so a tap
          for one can never land on the other. */}
      <View className={`${stack ? 'flex-col' : 'flex-row'} items-center gap-5`}>
        <Pressable
          onPress={recordingNow ? () => void stopThis() : () => void start()}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={micLabel}
          testID={`say-it-back-${phase}`}
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
        >
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: recordingNow ? palette.rose : withAlpha(palette.jade, 0.18),
              borderWidth: 1.5,
              borderColor: recordingNow ? palette.cream : palette.jade,
            }}
          >
            <MicMark size={size * 0.56} color={recordingNow ? palette.cream : palette.ink} stop={recordingNow} />
          </View>
        </Pressable>
        {/* Once there is a recording, hearing it again is its own button, not a
            hidden long press on the microphone (which keyboard and switch
            users could never reach) and not a colour change alone. */}
        {phase === 'ready' ? (
          <Pressable
            onPress={playYours}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Hear yourself again"
            testID="say-it-back-play-yours"
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: size,
                height: size,
                backgroundColor: withAlpha(palette.jade, 0.5),
                borderWidth: 1.5,
                borderColor: palette.jade,
              }}
            >
              <PlayMark size={size * 0.5} color={palette.ink} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {phase === 'blocked' ? (
        <Txt style={{ color: palette.ink }} className="mt-1 text-[0.625rem] opacity-70">
          Microphone off
        </Txt>
      ) : null}
    </View>
  );
}

/** A microphone, or a stop square while recording. */
function MicMark({ size, color, stop }: { size: number; color: string; stop: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {stop ? (
        <Rect x="6" y="6" width="12" height="12" rx="2" fill={color} />
      ) : (
        <>
          <Rect x="8.5" y="2" width="7" height="12.5" rx="3.5" fill={color} />
          <Path
            d="M5 11a7 7 0 0 0 14 0M12 18v4M8.5 22h7"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </Svg>
  );
}

/** A play triangle: your own recording, again. */
function PlayMark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" fill={color} />
    </Svg>
  );
}
