import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from './Text';
import { onClipFailed } from '../lib/speech';
import { palette, withAlpha } from '../theme';

/** How long the notice stays, from the last failed clip. */
export const SOUND_NOTICE_MS = 4000;

/**
 * "The sound didn't load", for a few seconds, when a clip will not play.
 *
 * Mounted once at the top of the app, over whatever screen is open, and never
 * in the way: it takes no taps, and it goes on its own. A polite live region,
 * so a screen reader hears it too. Kept short and plain: offline is the usual
 * cause, and the fix is the learner's.
 */
export function SoundNotice() {
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onClipFailed(() => {
      setShown(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), SOUND_NOTICE_MS);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);
  return (
    <View
      aria-live="polite"
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + 64, left: 16, right: 16, alignItems: 'center' }}
    >
      {shown ? (
        <View
          style={{
            backgroundColor: palette.ink700,
            borderColor: withAlpha(palette.paper, 0.18),
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Txt className="text-center text-sm text-paper">The sound didn’t load. Check your connection.</Txt>
        </View>
      ) : null}
    </View>
  );
}
