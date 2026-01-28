import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  travelVibes: string[];
}

export interface TravelDetails {
  destination: string;
  startDate: string;
  endDate: string;
}

interface AppState {
  currentScreen: 'login' | 'profile' | 'travel' | 'swipe' | 'chat' | 'account' | 'matches';
  userProfile: Partial<UserProfile>;
  travelDetails: TravelDetails | null;
  matchedUser: UserProfile | null;
  matches: UserProfile[];
  showMatch: boolean;
  hasCompletedProfile: boolean;
  setScreen: (screen: AppState['currentScreen']) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  setTravelDetails: (details: TravelDetails) => void;
  setMatchedUser: (user: UserProfile | null) => void;
  setMatches: (matches: UserProfile[]) => void;
  addMatch: (user: UserProfile) => void;
  removeMatch: (userId: string) => void;
  setShowMatch: (show: boolean) => void;
  setHasCompletedProfile: (completed: boolean) => void;
}

const STORAGE_KEYS = {
  currentScreen: 'currentScreen',
  lastScreen: 'lastScreen',
  travelDetails: 'travelDetails',
  matchedUser: 'matchedUser',
} as const;

const safeJsonParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

// Persist screen to localStorage so it survives closing the tab/browser
const getInitialScreen = (): AppState['currentScreen'] => {
  if (typeof window !== 'undefined') {
    const allowed = ['login', 'profile', 'travel', 'swipe', 'chat', 'account', 'matches'] as const;
    const saved = localStorage.getItem(STORAGE_KEYS.currentScreen);
    const last = localStorage.getItem(STORAGE_KEYS.lastScreen);

    // If we have a last non-login screen, prefer it over "login" so users return
    // to where they left off (Index.tsx will still route to login if unauthenticated).
    if (saved === 'login' && last && (allowed as readonly string[]).includes(last)) {
      return last as AppState['currentScreen'];
    }

    if (saved && (allowed as readonly string[]).includes(saved)) {
      return saved as AppState['currentScreen'];
    }
  }
  return 'login';
};

const getInitialTravelDetails = (): TravelDetails | null => {
  if (typeof window === 'undefined') return null;
  const parsed = safeJsonParse<TravelDetails>(localStorage.getItem(STORAGE_KEYS.travelDetails));
  if (!parsed) return null;
  if (!parsed.destination || !parsed.startDate || !parsed.endDate) return null;
  return parsed;
};

const getInitialMatchedUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const parsed = safeJsonParse<UserProfile>(localStorage.getItem(STORAGE_KEYS.matchedUser));
  if (!parsed?.id || !parsed?.name) return null;
  return parsed;
};

export const useAppStore = create<AppState>((set) => ({
  currentScreen: getInitialScreen(),
  userProfile: {},
  travelDetails: getInitialTravelDetails(),
  matchedUser: getInitialMatchedUser(),
  matches: [],
  showMatch: false,
  hasCompletedProfile: false,
  setScreen: (screen) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.currentScreen, screen);
      if (screen !== 'login') {
        localStorage.setItem(STORAGE_KEYS.lastScreen, screen);
      }
    }
    set({ currentScreen: screen });
  },
  setUserProfile: (profile) => set((state) => ({ 
    userProfile: { ...state.userProfile, ...profile } 
  })),
  setTravelDetails: (details) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.travelDetails, JSON.stringify(details));
    }
    set({ travelDetails: details });
  },
  setMatchedUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem(STORAGE_KEYS.matchedUser, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEYS.matchedUser);
    }
    set({ matchedUser: user });
  },
  setMatches: (matches) => set({ matches }),
  addMatch: (user) => set((state) => ({ 
    matches: state.matches.some(m => m.id === user.id) ? state.matches : [...state.matches, user] 
  })),
  removeMatch: (userId) => set((state) => ({
    matches: state.matches.filter(m => m.id !== userId)
  })),
  setShowMatch: (show) => set({ showMatch: show }),
  setHasCompletedProfile: (completed) => set({ hasCompletedProfile: completed }),
}));
