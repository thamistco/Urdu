/**
 * A confirm dialog that actually shows up, and looks like the app.
 *
 * `Alert.alert` from react-native is what every native platform gives you for
 * this, but react-native-web's implementation of it is a stub that does
 * nothing at all (see node_modules/react-native-web/src/exports/Alert) — no
 * error, no fallback, the call just silently returns. On web, every "Reset
 * all progress?" / "Sign out?" confirmation built on it was dead.
 *
 * The web fix was `window.confirm`, which works and is the browser's own grey
 * box with the site's address across the top: a tester read it as a page
 * error rather than the app asking (2026-10-12). So on the web the request
 * goes to `ConfirmHost`, mounted once at the root, which draws it in the app's
 * own colours. Native keeps `Alert.alert`, which is already the platform's.
 *
 * `window.confirm` stays as the fallback for the one case with no host to
 * draw it: a call before the root has mounted. Asking in grey is better than
 * not asking before something destructive.
 */
import { Alert, Platform } from 'react-native';

export type ConfirmRequest = {
  title: string;
  message: string;
  /** Absent for a message with one button. */
  confirmLabel?: string;
  destructive: boolean;
  onConfirm: () => void;
};

let show: ((r: ConfirmRequest) => void) | null = null;

/** For ConfirmHost alone. Returns the function that detaches it. */
export function attachConfirmHost(fn: (r: ConfirmRequest) => void): () => void {
  show = fn;
  return () => {
    if (show === fn) show = null;
  };
}

export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  destructive = true
) {
  if (Platform.OS === 'web') {
    if (show) show({ title, message, confirmLabel, destructive, onConfirm });
    else if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/** A message with one button, for the same reason. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (show) show({ title, message, destructive: false, onConfirm: () => {} });
    else window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
