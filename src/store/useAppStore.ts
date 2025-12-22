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
  currentScreen: 'login' | 'profile' | 'travel' | 'swipe' | 'chat' | 'account';
  userProfile: Partial<UserProfile>;
  travelDetails: TravelDetails | null;
  matchedUser: UserProfile | null;
  showMatch: boolean;
  hasCompletedProfile: boolean;
  setScreen: (screen: AppState['currentScreen']) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  setTravelDetails: (details: TravelDetails) => void;
  setMatchedUser: (user: UserProfile | null) => void;
  setShowMatch: (show: boolean) => void;
  setHasCompletedProfile: (completed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'login',
  userProfile: {},
  travelDetails: null,
  matchedUser: null,
  showMatch: false,
  hasCompletedProfile: false,
  setScreen: (screen) => set({ currentScreen: screen }),
  setUserProfile: (profile) => set((state) => ({ 
    userProfile: { ...state.userProfile, ...profile } 
  })),
  setTravelDetails: (details) => set({ travelDetails: details }),
  setMatchedUser: (user) => set({ matchedUser: user }),
  setShowMatch: (show) => set({ showMatch: show }),
  setHasCompletedProfile: (completed) => set({ hasCompletedProfile: completed }),
}));
