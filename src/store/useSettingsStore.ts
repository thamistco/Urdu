import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';
import { setMuted } from '../lib/sound';
import { setHapticsEnabled } from '../lib/haptics';
import { setSpeechMuted, setGlossEnabled, setVoiceSet } from '../lib/speech';

export type LearnTrack = 'script' | 'roman' | 'both';

/**
 * Which recorded voice reads the Urdu.
 *
 * Named for the voice, not for the learner: this is a preference about who you
 * would rather be taught by, and it carries no assumption about who is asking.
 */
export type VoiceGender = 'f' | 'm';

type SettingsState = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** show Roman transliteration alongside script */
  showRoman: boolean;
  reducedMotion: boolean;
  /** after a correct answer, say the English meaning as well as the Urdu */
  speakMeaning: boolean;
  /** Which recorded voice reads the Urdu. */
  voiceGender: VoiceGender;
  track: LearnTrack;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setShowRoman: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setSpeakMeaning: (v: boolean) => void;
  setVoiceGender: (v: VoiceGender) => void;
  setTrack: (t: LearnTrack) => void;
  syncEffects: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      showRoman: true,
      reducedMotion: false,
      /**
       * Off by default. When on, a correct answer plays the recorded Urdu clip
       * and then has the *device's English voice* read the meaning aloud — two
       * different speakers on one word, the second of them a stock browser
       * voice reading English in an app for learning Urdu. It was on by
       * default, and it sounded exactly like the bug it was mistaken for.
       *
       * The feature itself is defensible for a learner who wants it, so the
       * switch stays; being on for everyone who never asked for it is not.
       */
      speakMeaning: false,
      /**
       * The recorded voice. Defaults to the narrator every clip was made with,
       * so a learner who never opens the setting hears the voice the course was
       * recorded in rather than whichever one happens to be listed first.
       */
      voiceGender: 'f',
      track: 'both',
      setSound: (v) => {
        setMuted(!v);
        setSpeechMuted(!v);
        set({ soundEnabled: v });
      },
      setHaptics: (v) => {
        setHapticsEnabled(v);
        set({ hapticsEnabled: v });
      },
      setShowRoman: (v) => set({ showRoman: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setSpeakMeaning: (v) => {
        setGlossEnabled(v);
        set({ speakMeaning: v });
      },
      setVoiceGender: (v) => {
        setVoiceSet(v);
        set({ voiceGender: v });
      },
      setTrack: (t) => set({ track: t, showRoman: t !== 'script' }),
      syncEffects: () => {
        const s = get();
        setMuted(!s.soundEnabled);
        setSpeechMuted(!s.soundEnabled);
        setHapticsEnabled(s.hapticsEnabled);
        setGlossEnabled(s.speakMeaning);
        setVoiceSet(s.voiceGender);
      },
    }),
    {
      name: 'harf-settings',
      storage: createJSONStorage(() => safeStorage),
      /**
       * No `version`, and so no `migrate`. Both migrations that used to live
       * here — v1 turning the English gloss off for installs that had it on by
       * default, v2 pinning the voice an install had been hearing before there
       * was a choice — existed for installs made before the app launched, which
       * is to say none. Zustand defaults the version to 0 and discards a blob
       * that does not match, which is what a pre-launch shape change should do.
       *
       * A default changed after launch still reaches nobody who already has the
       * old value written to storage, so that release adds `version: 1` and a
       * `migrate` back.
       */
      onRehydrateStorage: () => (state) => state?.syncEffects(),
    }
  )
);
