import { ReactNode, Ref } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DuskScene, INTERIOR_DIM } from './EveningScene';

/**
 * The widest the content column is allowed to get.
 *
 * Everything here is laid out for a phone. Left to stretch, a tablet turns a
 * topic card into a 600px bar with a 44px picture stranded at one end, and the
 * eye has to travel the whole width to read a two-word label. Capping the
 * column keeps the phone proportions and centres them.
 */
export const CONTENT_MAX_WIDTH = 560;

/**
 * Base screen: the ink canvas + the misty-forest scenery, with a single content
 * column capped to a comfortable reading width (mobile UI principle: generous
 * margins, one clear column, thumb-reachable content).
 *
 * `lattice` is the old name for the background, from when it really was a
 * lattice — a faint halftone dot screen. It has been a landscape for two
 * redesigns; the prop keeps the name because every screen passes it.
 */
export function Screen({
  children,
  scroll = true,
  lattice = true,
  backdrop,
  padded = true,
  contentClassName = '',
  scrollRef,
}: {
  children: ReactNode;
  scroll?: boolean;
  lattice?: boolean;
  /** Something else to stand behind the content instead of the drawn landscape.
   *  It renders outside the safe-area inset, so it spans the whole window and a
   *  child positioned by a fraction of the screen lands where it says it does —
   *  which is what `EveningScene`'s safe bands depend on. */
  backdrop?: ReactNode;
  padded?: boolean;
  contentClassName?: string;
  /** For callers that need to move the view themselves — the lesson scrolls to
   *  the answer when a wrong attempt reveals one below the fold. */
  scrollRef?: Ref<ScrollView>;
}) {
  const pad = padded ? 'px-5 pb-10 pt-2' : '';
  const column = { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' } as const;
  return (
    // `overflow-hidden` so decoration cannot push the window sideways. The
    // wordmark throws a 96pt halo past each of its edges, which is the point of
    // it, and on a 320pt screen that reached 16pt beyond the right edge and gave
    // the sign-in screen a horizontal scrollbar. Nothing should be visible
    // outside the screen in any case, so clipping at its boundary costs nothing
    // and stops the next decorative overhang doing the same thing.
    <View className="flex-1 overflow-hidden bg-ink">
      <StatusBar barStyle="light-content" />
      {lattice && (backdrop ?? <DuskScene dim={INTERIOR_DIM} />)}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerClassName={`${pad} ${contentClassName}`}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={column}>{children}</View>
          </ScrollView>
        ) : (
          <View className={`flex-1 ${pad} ${contentClassName}`}>
            <View style={[column, { flex: 1 }]}>{children}</View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
