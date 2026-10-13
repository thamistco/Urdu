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
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Kept in the console for whoever is debugging; nothing leaves the device.
    console.error('Qaaf caught a render error', error);
  }

  private recover = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const base = document.querySelector('meta[name="qaaf:base"]')?.getAttribute('content') ?? '';
      window.location.assign(`${base.replace(/\/+$/, '')}/`);
      return;
    }
    this.setState({ failed: false });
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
        <View style={{ width: '100%', maxWidth: 360 }}>
          <Button onPress={this.recover}>Go to your lessons</Button>
        </View>
      </View>
    );
  }
}
