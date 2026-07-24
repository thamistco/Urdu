import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';
import { setMuted } from '../lib/sound';
import { setHapticsEnabled } from '../lib/haptics';
import { setSpeechMuted } from '../lib/speech';

export type LearnTrack = 'script' | 'roman' | 'both';

type SettingsState = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** show Roman transliteration alongside script */
  showRoman: boolean;
  reducedMotion: boolean;
  track: LearnTrack;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setShowRoman: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
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
      setTrack: (t) => set({ track: t, showRoman: t !== 'script' }),
      syncEffects: () => {
        const s = get();
        setMuted(!s.soundEnabled);
        setSpeechMuted(!s.soundEnabled);
        setHapticsEnabled(s.hapticsEnabled);
      },
    }),
    {
      name: 'harf-settings',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => state?.syncEffects(),
    }
  )
);
