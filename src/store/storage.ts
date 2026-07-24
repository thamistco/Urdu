import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Resilient persistence adapter. Uses AsyncStorage when available, but falls
 * back to an in-memory map if storage is blocked (e.g. a sandboxed browser
 * preview with no localStorage access). This keeps the app from crashing on
 * launch anywhere it runs — device, Expo Go, web, or an embedded preview frame.
 */
const memory = new Map<string, string>();

export const safeStorage: StateStorage = {
  async getItem(name) {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  async setItem(name, value) {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      memory.set(name, value);
    }
  },
  async removeItem(name) {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      memory.delete(name);
    }
  },
};
