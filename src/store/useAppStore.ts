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
  addMatch: (user: UserProfile) => void;
  removeMatch: (userId: string) => void;
  setShowMatch: (show: boolean) => void;
  setHasCompletedProfile: (completed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'login',
  userProfile: {},
  travelDetails: null,
  matchedUser: null,
  matches: [],
  showMatch: false,
  hasCompletedProfile: false,
  setScreen: (screen) => set({ currentScreen: screen }),
  setUserProfile: (profile) => set((state) => ({ 
    userProfile: { ...state.userProfile, ...profile } 
  })),
  setTravelDetails: (details) => set({ travelDetails: details }),
  setMatchedUser: (user) => set({ matchedUser: user }),
  addMatch: (user) => set((state) => ({ 
    matches: state.matches.some(m => m.id === user.id) ? state.matches : [...state.matches, user] 
  })),
  removeMatch: (userId) => set((state) => ({
    matches: state.matches.filter(m => m.id !== userId)
  })),
  setShowMatch: (show) => set({ showMatch: show }),
  setHasCompletedProfile: (completed) => set({ hasCompletedProfile: completed }),
}));
