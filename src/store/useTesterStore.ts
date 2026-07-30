import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

/**
 * Tester mode: unlimited hearts and an unlocked path, for looking at the app
 * without playing through it.
 *
 * Two things it deliberately is not.
 *
 * It is not a login. The app signs in through an OAuth provider and has no
 * username-and-password path, and adding one for this would mean a real
 * credential check against nothing. What is here is a passphrase gate, which is
 * all a client-side app can honestly offer: everything in a web bundle is
 * readable by anyone who opens the developer tools, so this keeps the panel out
 * of a curious learner's way and stops nobody who is determined. That is why the
 * whole feature is behind a build flag as well — the public deploy does not carry
 * it unless EXPO_PUBLIC_TESTER_MODE is set at build time.
 *
 * And it is not on by default once unlocked. The point of the request was to see
 * *both* states — the comfortable one and the one a real learner hits when the
 * hearts run out and the next lesson is locked — so unlocking only reveals the
 * switches. Each is off until turned on, and a banner says so while either is,
 * because a tester who forgets is testing an app nobody else will ever use.
 */

const DEV = process.env.NODE_ENV !== 'production';

/** Set at build time. Absent in the public deploy, so the panel never renders. */
export const TESTER_MODE_AVAILABLE = !!process.env.EXPO_PUBLIC_TESTER_MODE || DEV;

/**
 * The passphrase, which a released build has to be told rather than assume.
 *
 * A development build carries a default so it works the moment you open it. A
 * production build does not: the string would sit in the JavaScript anyone can
 * read, so shipping one would be shipping the answer alongside the question.
 * With nothing set, `tryUnlock` refuses everything, which is the right behaviour
 * for a build that was never meant to have a tester panel in it.
 */
const USER = process.env.EXPO_PUBLIC_TESTER_USER || (DEV ? 'wali' : '');
const PASS = process.env.EXPO_PUBLIC_TESTER_PASS || (DEV ? 'tahir' : '');

type TesterState = {
  /** the passphrase has been entered correctly on this device */
  unlocked: boolean;
  /** never lose a heart */
  infiniteHearts: boolean;
  /** every lesson on the path is open */
  unlockAll: boolean;
  tryUnlock: (user: string, pass: string) => boolean;
  lock: () => void;
  setInfiniteHearts: (v: boolean) => void;
  setUnlockAll: (v: boolean) => void;
};

export const useTesterStore = create<TesterState>()(
  persist(
    (set) => ({
      unlocked: false,
      infiniteHearts: false,
      unlockAll: false,
      tryUnlock: (user, pass) => {
        if (!USER || !PASS) return false; // a release build with nothing configured
        const ok = user.trim().toLowerCase() === USER && pass === PASS;
        if (ok) set({ unlocked: true });
        return ok;
      },
      // Locking clears the switches too: leaving tester powers on behind a
      // locked panel is the one state from which the real app is unreachable.
      lock: () => set({ unlocked: false, infiniteHearts: false, unlockAll: false }),
      setInfiniteHearts: (v) => set({ infiniteHearts: v }),
      setUnlockAll: (v) => set({ unlockAll: v }),
    }),
    { name: 'harf-tester', storage: createJSONStorage(() => safeStorage) }
  )
);

/**
 * Read outside React — the progress store is plain Zustand and needs this
 * synchronously inside `loseHeart`, where there is no hook to call.
 */
export const testerFlags = () => {
  const s = useTesterStore.getState();
  return {
    infiniteHearts: TESTER_MODE_AVAILABLE && s.unlocked && s.infiniteHearts,
    unlockAll: TESTER_MODE_AVAILABLE && s.unlocked && s.unlockAll,
  };
};
