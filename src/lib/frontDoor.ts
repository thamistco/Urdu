/**
 * The screen the app opens on for this person: the sign-in screen, the setup
 * steps, or the tabs. The same order RootNavigator registers them in, and
 * frontDoor.test.ts holds the two together.
 */
export function frontDoor(authed: boolean, onboarded: boolean): 'Login' | 'Onboarding' | 'Main' {
  return !authed ? 'Login' : !onboarded ? 'Onboarding' : 'Main';
}
