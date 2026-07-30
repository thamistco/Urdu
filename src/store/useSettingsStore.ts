import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';
import { setMuted } from '../lib/sound';
import { setHapticsEnabled } from '../lib/haptics';
import { setSpeechMuted, setGlossEnabled } from '../lib/speech';

export type LearnTrack = 'script' | 'roman' | 'both';

type SettingsState = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** show Roman transliteration alongside script */
  showRoman: boolean;
  reducedMotion: boolean;
  /** after a correct answer, say the English meaning as well as the Urdu */
  speakMeaning: boolean;
  track: LearnTrack;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setShowRoman: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setSpeakMeaning: (v: boolean) => void;
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
       * voice reading English in an app for learning Urdu. It shipped on by
       * default, and it sounded exactly like the bug it was mistaken for.
       *
       * The feature itself is defensible for a learner who wants it, so the
       * switch stays; being on for everyone who never asked for it is not.
       */
      speakMeaning: false,
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
      setTrack: (t) => set({ track: t, showRoman: t !== 'script' }),
      syncEffects: () => {
        const s = get();
        setMuted(!s.soundEnabled);
        setSpeechMuted(!s.soundEnabled);
        setHapticsEnabled(s.hapticsEnabled);
        setGlossEnabled(s.speakMeaning);
      },
    }),
    {
      name: 'harf-settings',
      storage: createJSONStorage(() => safeStorage),
      /**
       * Version 1 turns the English gloss off for everyone who already has it.
       *
       * Changing a default only reaches people who have never opened the app;
       * this setting shipped on, so every existing install has `true` written
       * to storage and would go on doing the thing that was reported. A new
       * default without a migration is a fix that reaches nobody who has the
       * problem.
       *
       * Only this one field is touched — sound, haptics, Roman and track are
       * carried through as they were, because those the learner may well have
       * chosen on purpose.
       */
      version: 1,
      migrate: (persisted, from) => {
        const s = (persisted ?? {}) as Partial<SettingsState>;
        if (from < 1) return { ...s, speakMeaning: false };
        return s;
      },
      onRehydrateStorage: () => (state) => state?.syncEffects(),
    }
  )
);
