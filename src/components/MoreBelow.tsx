import { useEffect, useRef, useState, type RefObject } from 'react';
import { View, Pressable, type ScrollView, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { Bold } from './Text';
import { palette, withAlpha } from '../theme';
import { useSettingsStore } from '../store/useSettingsStore';

/** How far past the bottom the content has to run before anything says so. */
export const MORE_BELOW_SLACK = 24;

/** Pixels of content still below the visible area. */
export const leftBelow = (content: number, view: number, y: number) => content - (view + y);

/**
 * "More below", on a teaching card that runs past the bottom of the screen.
 *
 * On a short phone the first letter card runs 225px past the fold at 320x568,
 * 129px at 360x740 and 253px in landscape, and nothing on screen says it
 * scrolls: the scrollbar is hidden, and at 320x568 the fold lands exactly
 * under the four forms, so the card looks finished (design review,
 * 2026-10-16, P-076). Pinning "Got it" to the bottom was tried and held: it
 * let a learner leave without seeing the forms (2026-10-15). So the button
 * stays where it is, and this says there is more until the learner has
 * scrolled to it, then goes and does not come back for that card.
 *
 * `key` names the card. Every measurement is tagged with the card it was
 * taken on, and a card counts as measured only once the scroll view has
 * reported its size for that card. Untagged, the first version read each new
 * card against the last exercise's height and scroll, which the learner had
 * scrolled to the end, called it finished before it was measured, and showed
 * nothing on every card after a lesson's first (second check, 2026-10-16).
 */
export function useMoreBelow(active: boolean, key: string, padding = 0) {
  // Handlers run after the render that changed the card, so they tag with
  // the card on screen, not the one they were created under.
  const keyRef = useRef(key);
  keyRef.current = key;
  const [content, setContent] = useState<{ key: string; h: number } | null>(null);
  const [scrolled, setScrolled] = useState<{ key: string; y: number } | null>(null);
  const [view, setView] = useState(0);
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const measured = content?.key === key && content.h > 0 && view > 0;
  // A new card opens at its top (LessonScreen), so until it is scrolled, 0.
  const y = scrolled?.key === key ? scrolled.y : 0;
  // Empty space under the card is not more card: counted, it put the pill
  // over a "Got it" already mostly in view at 360x740 (second check).
  const left = measured ? leftBelow(content.h, view, y) - padding : 0;

  useEffect(() => {
    if (active && measured && left < MORE_BELOW_SLACK) setDoneFor(key);
  }, [active, measured, left, key]);

  return {
    show: active && measured && doneFor !== key && left >= MORE_BELOW_SLACK,
    view,
    y,
    scrollProps: {
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
        setScrolled({ key: keyRef.current, y: e.nativeEvent.contentOffset.y }),
      onContentSizeChange: (_w: number, h: number) => setContent({ key: keyRef.current, h }),
      onLayout: (e: { nativeEvent: { layout: { height: number } } }) => setView(e.nativeEvent.layout.height),
      scrollEventThrottle: 32,
    },
  };
}

/**
 * The cue itself: a 40px fade along the bottom edge and a pill above it.
 * Tapping the pill scrolls on by most of a screen. For a screen reader it is a
 * button that says what it does; reading order reaches "Got it" either way.
 */
export function MoreBelowCue({
  scrollRef,
  view,
  y,
}: {
  scrollRef: RefObject<ScrollView | null>;
  view: number;
  y: number;
}) {
  const reduced = useSettingsStore((s) => s.reducedMotion);
  return (
    <Animated.View
      exiting={reduced ? undefined : FadeOut.duration(160)}
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 72 }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }}>
        <Svg width="100%" height="40">
          <Defs>
            <LinearGradient id="moreBelowFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.ink} stopOpacity="0" />
              <Stop offset="1" stopColor={palette.ink} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="40" fill="url(#moreBelowFade)" />
        </Svg>
      </View>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center' }}
      >
        <Pressable
          accessibilityRole="button"
          // Starts with the words on it, so "tap More below" works by voice.
          accessibilityLabel="More below, show the rest of the card"
          onPress={() => scrollRef.current?.scrollTo({ y: y + view * 0.8, animated: !reduced })}
          className="flex-row items-center gap-1.5 rounded-full px-4"
          style={{
            minHeight: 44,
            backgroundColor: palette.ink700,
            borderWidth: 1,
            borderColor: withAlpha(palette.paper, 0.18),
          }}
        >
          <Bold style={{ fontSize: 13, color: palette.paper }}>More below</Bold>
          <Svg width={12} height={12} viewBox="0 0 12 12" aria-hidden>
            <Path
              d="M2 4.5 L6 8.5 L10 4.5"
              stroke={palette.paper}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>
    </Animated.View>
  );
}
