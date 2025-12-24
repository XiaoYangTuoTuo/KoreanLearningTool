import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TypingHistory {
  id: string;
  date: number; // timestamp
  wpm: number;
  accuracy: number;
  genre: string;
  difficulty: string;
  mistakes: number;
}

export interface MistakeRecord {
  id: string;
  original: string;
  input: string;
  target: string;
  type: 'spelling' | 'particle' | 'spacing' | 'unknown';
  timestamp: number;
}

export interface UserProfile {
  username: string;
  avatar: string;
  bio: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  dailyGoal: number;
  theme: 'light' | 'dark' | 'system';
}

interface UserState {
  // User Data
  profile: UserProfile;
  settings: UserSettings;
  
  // Game Data
  points: number;
  level: number;
  joinDate: number;
  history: TypingHistory[];
  mistakes: MistakeRecord[];
  
  // Actions
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  importData: (data: any) => boolean;
  
  addPoints: (amount: number) => void;
  addHistory: (record: Omit<TypingHistory, 'id'>) => void;
  addMistake: (record: Omit<MistakeRecord, 'id'>) => void;
  clearHistory: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Defaults
      profile: {
        username: 'Guest Barista',
        avatar: '☕️',
        bio: '热爱韩语，热爱生活。',
      },
      settings: {
        soundEnabled: true,
        dailyGoal: 10,
        theme: 'light',
      },
      points: 0,
      level: 1,
      joinDate: Date.now(),
      history: [],
      mistakes: [],

      // Actions
      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates }
      })),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      importData: (data) => {
        try {
          // Basic validation
          if (!data || !Array.isArray(data.history)) {
            return false;
          }
          set({
            ...data,
            // Ensure we don't overwrite with invalid data if partial import
            history: data.history || [],
            mistakes: data.mistakes || [],
            points: data.points || 0,
            level: data.level || 1,
            profile: { ...get().profile, ...(data.profile || {}) },
            settings: { ...get().settings, ...(data.settings || {}) },
          });
          return true;
        } catch (e) {
          console.error("Import failed", e);
          return false;
        }
      },

      addPoints: (amount) => set((state) => {
        const newPoints = state.points + amount;
        // Simple level up logic: every 100 points
        const newLevel = Math.floor(newPoints / 100) + 1;
        return { points: newPoints, level: newLevel };
      }),

      addHistory: (record) => set((state) => ({
        history: [...state.history, { ...record, id: Math.random().toString(36).substr(2, 9) }]
      })),

      addMistake: (record) => set((state) => ({
        mistakes: [...state.mistakes, { ...record, id: Math.random().toString(36).substr(2, 9) }]
      })),

      clearHistory: () => set({ 
        history: [], 
        mistakes: [], 
        points: 0, 
        level: 1 
      }),
    }),
    {
      name: 'user-storage',
    }
  )
);
