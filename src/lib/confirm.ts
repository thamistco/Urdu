/**
 * A confirm dialog that actually shows up.
 *
 * `Alert.alert` from react-native is what every native platform gives you for
 * this, but react-native-web's implementation of it is a stub that does
 * nothing at all (see node_modules/react-native-web/src/exports/Alert) — no
 * error, no fallback, the call just silently returns. On web, every "Reset
 * all progress?" / "Sign out?" confirmation built on it was dead: tapping the
 * button did nothing, with nothing in the console to explain why. Since this
 * app currently only ships on web, that meant the confirmations never ran at
 * all.
 */
import { Alert, Platform } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  destructive = true
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
