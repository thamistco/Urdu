import { View } from 'react-native';
import { Urdu, Txt, urduLine } from './Text';
import { palette } from '../theme';
import type { LearnTrack } from '../store/useSettingsStore';

/**
 * A word, phrase or sentence, shown the way the learner's track asks for.
 *
 *   script — Nastaliq only. Someone learning to read wants nothing to lean on.
 *   both   — Nastaliq with the transliteration beneath it.
 *   roman  — transliteration only, at full size. Not a caption under an absent
 *            letterform: on this track the Roman *is* the word, so it is set
 *            large enough to be the thing being read.
 *
 * Every place that used to render `<Urdu>{w.urdu}</Urdu>` and then optionally a
 * small Roman caption goes through here, which is what makes the track setting
 * mean something rather than being a toggle on one caption.
 */
export function Lexeme({
  urdu,
  roman,
  track,
  size = 28,
  color = palette.paper,
  align = 'center',
  numberOfLines,
}: {
  urdu: string;
  /** `undefined` when the item has no transliteration — see lib/translit. */
  roman?: string;
  track: LearnTrack;
  /** point size of the script; the Roman is set to suit it. */
  size?: number;
  color?: string;
  align?: 'center' | 'left' | 'right';
  numberOfLines?: number;
}) {
  // A missing transliteration must never render as an empty card, so the script
  // stands in. The generator avoids offering such items on the Roman track;
  // this is the backstop for the ones it cannot filter, like a proper noun.
  const showScript = track !== 'roman' || !roman;
  const showRoman = track !== 'script' && !!roman;

  return (
    <View style={{ alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end' }}>
      {showScript ? (
        <Urdu
          numberOfLines={numberOfLines}
          style={{ fontSize: size, lineHeight: urduLine(size), color, textAlign: align }}
        >
          {urdu}
        </Urdu>
      ) : null}
      {showRoman ? (
        <Txt
          numberOfLines={numberOfLines}
          // On the Roman track this is the headline, not a footnote: full
          // weight and near-full size. Alongside the script it steps back.
          className={showScript ? 'mt-1 text-xs' : 'font-body-bold'}
          style={{
            color,
            textAlign: align,
            opacity: showScript ? 0.55 : 1,
            ...(showScript ? null : { fontSize: Math.round(size * 0.78) }),
          }}
        >
          {roman}
        </Txt>
      ) : null}
    </View>
  );
}
