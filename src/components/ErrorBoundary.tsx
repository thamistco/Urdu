import { Component, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { Heading, Txt } from './Text';
import { Button } from './Button';
import { palette } from '../theme';

/**
 * The last thing between a render error and a blank page.
 *
 * Any uncaught error while drawing a screen unmounted the whole app and left
 * the page empty, with nothing to say what happened or how to get out (QA,
 * 2026-10-13, H11). This catches it, says so in a sentence, and offers the
 * way back: on the web a reload of the app's front page, which keeps saved
 * progress, since that lives in storage and not in the screen that broke.
 */
/** When "Go to your lessons" last reloaded the app, kept for this tab only. */
const RECOVERED_AT = 'qaaf-recovered-at';

const webOnly = () => Platform.OS === 'web' && typeof window !== 'undefined';

/** Whether the app failed again within a minute of reloading to recover. */
function failedAgain(): boolean {
  if (!webOnly()) return false;
  try {
    return Date.now() - Number(window.sessionStorage.getItem(RECOVERED_AT) ?? 0) < 60_000;
  } catch {
    return false;
  }
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Kept in the console for whoever is debugging; nothing leaves the device.
    console.error('Qaaf caught a render error', error);
  }

  private home = () => {
    const base = document.querySelector('meta[name="qaaf:base"]')?.getAttribute('content') ?? '';
    window.location.assign(`${base.replace(/\/+$/, '')}/`);
  };

  private recover = () => {
    if (webOnly()) {
      try {
        window.sessionStorage.setItem(RECOVERED_AT, String(Date.now()));
      } catch {
        // Storage refused: the reload still happens, without the second offer.
      }
      this.home();
      return;
    }
    this.setState({ failed: false });
  };

  /**
   * When the front page itself breaks, reloading it breaks it again: a save
   * holding something no screen can draw crashed Home on every load, and the
   * button above looped (QA round 5, M29). The way out is to start again, but
   * never by losing the save: each one is copied to a backup first.
   */
  private startAgain = () => {
    try {
      for (const name of ['qaaf-progress', 'qaaf-settings']) {
        const raw = window.localStorage.getItem(name);
        if (raw != null) window.localStorage.setItem(`${name}-backup-${Date.now()}`, raw);
        window.localStorage.removeItem(name);
      }
      window.sessionStorage.removeItem(RECOVERED_AT);
    } catch {
      // Storage refused: nothing was saved to clear, and the reload starts clean.
    }
    this.home();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View
        accessibilityRole="alert"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: palette.ink }}
      >
        <Heading className="mb-2 text-center text-2xl">Something went wrong</Heading>
        <Txt className="mb-8 max-w-[300px] text-center text-sm text-paper/60">
          This screen hit a problem. Your progress is saved; going back to your lessons usually fixes it.
        </Txt>
        <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
          <Button onPress={this.recover}>Go to your lessons</Button>
          {failedAgain() ? (
            <>
              <Txt className="text-center text-sm text-paper/60">
                It happened again. Starting again on this device copies your saved progress to a backup first, then
                clears it from this browser.
              </Txt>
              <Button variant="ghost" onPress={this.startAgain}>
                Start again on this device
              </Button>
            </>
          ) : null}
        </View>
      </View>
    );
  }
}
