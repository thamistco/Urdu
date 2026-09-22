import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Every screen gets a URL, so the browser's back button backs out of a screen
 * instead of leaving the app.
 *
 * The web build lived at a single URL. Opening a lesson or switching tabs
 * pushed nothing onto history, so back — which is the hardware back button on
 * Android — exited Harf from wherever the learner had got to, and there was no
 * way to send anybody a link to a lesson, the Letter Lab or the Practice tab.
 *
 * Paths are named for what a person would call the screen, not for the
 * component: `league`, not `Leaderboard`; `letters`, not `LetterLab`. They end
 * up in somebody's history, address bar and shared links.
 */

/**
 * The subpath the site is served from, without slashes at either end, or ''
 * at the root.
 *
 * Expo builds absolute asset URLs under `experiments.baseUrl` but emits no
 * `<base>` tag and no runtime constant for it, so the deploy writes the value
 * into a meta tag (see scripts/inject-web-meta.js) and this reads it back.
 * Read at module scope, which is safe because the tag is in `<head>` ahead of
 * the bundle that runs this.
 */
function basePath(): string {
  if (typeof document === 'undefined') return '';
  const tag = document.querySelector('meta[name="harf:base"]');
  return (tag?.getAttribute('content') ?? '').replace(/^\/+|\/+$/g, '');
}

/**
 * The deploy's subpath is built into every route rather than stripped and
 * re-added around the router.
 *
 * React Navigation has no base-path option, and the obvious shape — strip the
 * prefix in `getStateFromPath`, put it back in `getPathFromState` — does not
 * work, which was established by tracing rather than by reading: on a cold
 * load the router never calls `getPathFromState` at all. It writes a path of
 * its own and then re-derives state from it, so opening
 * https://host/Urdu/profile left the address bar reading /profile — a URL
 * nobody can open or share. Correcting it afterwards lost a race with the
 * router's own second write.
 *
 * Making the prefix part of the paths removes the problem instead of
 * compensating for it: whatever the router computes already carries it.
 */
const base = basePath();
const at = (path: string) => (base ? (path ? `${base}/${path}` : base) : path);

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Login: at('sign-in'),
      Onboarding: at('setup'),
      Main: {
        screens: {
          // The learn path is the app's front page, so it is the bare root
          // rather than /learn — the URL somebody bookmarks should open where
          // they left off.
          Learn: at(''),
          Practice: at('practice'),
          Profile: at('profile'),
        },
      },
      Lesson: at('lesson/:lessonId'),
      LetterLab: at('letters/:letterId?'),
      Leaderboard: at('league'),
      Achievements: at('achievements'),
      Settings: at('settings'),
      Privacy: at('privacy'),
      Terms: at('terms'),
    },
  },
};
