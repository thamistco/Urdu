import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProgressStore } from '../store/useProgressStore';
import { useAuthStore, isAuthed } from '../store/useAuthStore';
import { frontDoor } from '../lib/frontDoor';
import type { RootStackParamList } from './types';

/**
 * Back, for a screen that can be the first one opened.
 *
 * Privacy, Terms, Credits and Licences are reachable by a link, and a store
 * listing links to the first of them. Opened that way, or reloaded, there is
 * nothing to go back to, and the screens showed no Back at all: no way into
 * the app from its own privacy policy (QA, 2026-11-02, Q-177). With nothing
 * behind it, Back now opens the app's front door for this person.
 */
export function useBackOrFrontDoor(): () => void {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onboarded = useProgressStore((s) => s.onboarded);
  const authed = useAuthStore(isAuthed);
  return () => {
    if (nav.canGoBack()) nav.goBack();
    else nav.reset({ index: 0, routes: [{ name: frontDoor(authed, onboarded) }] });
  };
}
