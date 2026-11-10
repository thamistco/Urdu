import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { frontDoor } from './frontDoor';

describe('frontDoor', () => {
  it('opens the sign-in screen for someone not signed in, whatever was saved', () => {
    expect(frontDoor(false, false)).toBe('Login');
    expect(frontDoor(false, true)).toBe('Login');
  });

  it('opens setup for someone signed in who has not finished it', () => {
    expect(frontDoor(true, false)).toBe('Onboarding');
  });

  it('opens the tabs for a learner', () => {
    expect(frontDoor(true, true)).toBe('Main');
  });

  // The navigator registers a screen only in the state that reaches it, and
  // resetting to one it has not registered does nothing. So every answer must
  // be a screen RootNavigator registers behind the same condition.
  it('names only screens RootNavigator registers, in its order', () => {
    const src = readFileSync(join(__dirname, '..', 'navigation', 'RootNavigator.tsx'), 'utf8');
    const gate = src.slice(src.indexOf('{!authed ?'), src.indexOf('name="Main"'));
    expect(gate).toMatch(/\{!authed \? \(\s*<Stack\.Screen name="Login"/);
    expect(gate).toMatch(/\) : !onboarded \? \(\s*<Stack\.Screen name="Onboarding"/);
  });
});
