import { ReactNode } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LatticeBackground } from './LatticeBackground';

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
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 ${pad} ${contentClassName}`}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}
