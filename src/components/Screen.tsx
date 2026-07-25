import { ReactNode } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LatticeBackground } from './LatticeBackground';

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
 * Base screen: the ink canvas + faint halftone screen, with a single content
 * column capped to a comfortable reading width (mobile UI principle: generous
 * margins, one clear column, thumb-reachable content).
 */
export function Screen({
  children,
  scroll = true,
  lattice = true,
  padded = true,
  contentClassName = '',
}: {
  children: ReactNode;
  scroll?: boolean;
  lattice?: boolean;
  padded?: boolean;
  contentClassName?: string;
}) {
  const pad = padded ? 'px-5 pb-10 pt-2' : '';
  const column = { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' } as const;
  return (
    <View className="flex-1 bg-ink">
      <StatusBar barStyle="light-content" />
      {lattice && <LatticeBackground />}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
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
