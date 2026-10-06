import { Pressable, View } from 'react-native';
import { Eyebrow, Bold } from './Text';
import { feedback } from '../lib/feedback';

export function TopBar({
  onBack,
  label,
  right,
  title,
}: {
  onBack?: () => void;
  label?: string;
  title?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            feedback.tap();
            onBack();
          }}
          className="rounded-lg px-2"
          // 44 tall without moving: hitSlop does nothing on the web (see reach).
          style={{ paddingVertical: 10, marginVertical: -6 }}
        >
          <Bold className="text-base text-paper/60">← Back</Bold>
        </Pressable>
      ) : (
        <View style={{ width: 60 }} />
      )}
      {title ? (
        <Bold className="text-base">{title}</Bold>
      ) : label ? (
        <Eyebrow className="text-paper/55">{label}</Eyebrow>
      ) : (
        <View />
      )}
      <View style={{ minWidth: 60, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
