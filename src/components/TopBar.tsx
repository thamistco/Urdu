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
          onPress={() => {
            feedback.tap();
            onBack();
          }}
          hitSlop={12}
          className="rounded-lg px-2 py-1"
        >
          <Bold className="text-base text-paper/60">← Back</Bold>
        </Pressable>
      ) : (
        <View style={{ width: 60 }} />
      )}
      {title ? (
        <Bold className="text-base">{title}</Bold>
      ) : label ? (
        <Eyebrow className="text-paper/40">{label}</Eyebrow>
      ) : (
        <View />
      )}
      <View style={{ minWidth: 60, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
