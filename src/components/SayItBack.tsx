import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Audio } from 'expo-av';
import Svg, { Path, Rect } from 'react-native-svg';
import { announce, onPlaybackChange, isPlaying } from '../lib/speech';
import { palette, withAlpha } from '../theme';
import { Txt } from './Text';

type Phase = 'idle' | 'recording' | 'ready' | 'blocked';

/** Long enough for any line in the course read slowly; a forgotten tap stops itself. */
const MAX_RECORDING_MS = 10_000;

/** If the native clip has not started by now (sound off, no clip), play the learner's own straight away. */
const NATIVE_START_GRACE_MS = 700;

/**
 * Say it back: repeat a line aloud and hear yourself next to the recording.
 *
 * Speaking is the gap learners name first in every big language app, and Qaaf
 * had none. Shadowing (repeating audio as you hear it) improved pronunciation
 * and listening in published studies. Daily review 2026-10-06, proposal P-003.
 *
 * What it deliberately does not do, each for a reason found in the research:
 * - It never scores the learner. Speech scoring is the feature other apps'
 *   reviews complain about most, failing even in a quiet room.
 * - It is never required. A lesson never waits on it, so a learner who cannot
 *   or would rather not speak loses nothing.
 * - The recording never leaves the device. It lives in memory while this line
 *   is on screen and is unloaded when it goes; nothing is saved or uploaded.
 *   The privacy policy says exactly this.
 */
export function SayItBack({
  clipId,
  urdu,
  roman,
  size = 24,
}: {
  clipId: string;
  urdu: string;
  roman?: string;
  size?: number;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const recording = useRef<Audio.Recording | null>(null);
  const yours = useRef<Audio.Sound | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whatever this line was holding goes when the line does.
  useEffect(
    () => () => {
      if (autoStop.current) clearTimeout(autoStop.current);
      recording.current?.stopAndUnloadAsync().catch(() => {});
      yours.current?.unloadAsync().catch(() => {});
    },
    []
  );

  const playYours = () => {
    yours.current?.replayAsync().catch(() => {});
  };

  /** The recording first, then the learner, back to back. */
  const compare = () => {
    let started = false;
    const off = onPlaybackChange((on) => {
      if (on) started = true;
      else if (started) {
        off();
        playYours();
      }
    });
    announce(clipId, urdu, roman);
    setTimeout(() => {
      if (!started && !isPlaying()) {
        off();
        playYours();
      }
    }, NATIVE_START_GRACE_MS);
  };

  const stop = async () => {
    if (autoStop.current) clearTimeout(autoStop.current);
    const r = recording.current;
    recording.current = null;
    if (!r) return;
    try {
      await r.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const uri = r.getURI();
      if (!uri) return setPhase('idle');
      const { sound } = await Audio.Sound.createAsync({ uri });
      await yours.current?.unloadAsync().catch(() => {});
      yours.current = sound;
      setPhase('ready');
      compare();
    } catch {
      setPhase('idle');
    }
  };

  const start = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return setPhase('blocked');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recording.current = r;
      setPhase('recording');
      autoStop.current = setTimeout(stop, MAX_RECORDING_MS);
    } catch {
      setPhase('blocked');
    }
  };

  const recordingNow = phase === 'recording';
  const label =
    phase === 'recording'
      ? 'Stop recording and compare'
      : phase === 'ready'
        ? 'Hear yourself again. Long press to record again'
        : phase === 'blocked'
          ? 'Microphone not allowed. Allow it in your settings to say this line back'
          : 'Say it back: record yourself saying this line';

  return (
    <View className="items-center">
      <Pressable
        onPress={recordingNow ? stop : phase === 'ready' ? playYours : start}
        onLongPress={phase === 'ready' ? start : undefined}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={`say-it-back-${phase}`}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
      >
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: recordingNow ? palette.rose : withAlpha(palette.jade, phase === 'ready' ? 0.5 : 0.18),
            borderWidth: 1.5,
            borderColor: recordingNow ? palette.cream : palette.jade,
          }}
        >
          <MicMark size={size * 0.56} color={recordingNow ? palette.cream : palette.ink} stop={recordingNow} />
        </View>
      </Pressable>
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
