import { useEffect } from 'react';
import MatchPopup from '@/components/MatchPopup';
import LoginScreen from '@/screens/LoginScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import TravelScreen from '@/screens/TravelScreen';
import SwipeScreen from '@/screens/SwipeScreen';
import ChatScreen from '@/screens/ChatScreen';
import AccountScreen from '@/screens/AccountScreen';
import MatchesListScreen from '@/screens/MatchesListScreen';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const hasCompletedProfile = useAppStore((state) => state.hasCompletedProfile);
  const { user, loading, hasExistingProfile } = useAuth();

  // Only redirect when explicitly on login screen and user is authenticated
  useEffect(() => {
    if (!loading && user && currentScreen === 'login') {
      if (hasCompletedProfile || hasExistingProfile) {
        // Returning user - go to travel screen to set up new trip (they can skip)
        setScreen('travel');
      } else {
        // New user - go to profile setup
        setScreen('profile');
      }
    }
  }, [user, loading, currentScreen, hasCompletedProfile, hasExistingProfile, setScreen]);

  // If a returning user somehow lands on the profile setup screen (e.g. refresh/persisted state),
  // send them to Travel instead.
  useEffect(() => {
    if (!loading && user && currentScreen === 'profile' && (hasCompletedProfile || hasExistingProfile)) {
      setScreen('travel');
    }
  }, [user, loading, currentScreen, hasCompletedProfile, hasExistingProfile, setScreen]);

  // Only redirect to login if user is not authenticated
  // Don't redirect if we're still loading or if user exists
  useEffect(() => {
    if (!loading && !user && currentScreen !== 'login') {
      setScreen('login');
    }
  }, [user, loading, currentScreen, setScreen]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'travel':
        return <TravelScreen />;
      case 'swipe':
        return <SwipeScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'account':
        return <AccountScreen />;
      case 'matches':
        return <MatchesListScreen />;
      default:
        return <LoginScreen />;
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-background">
      {renderScreen()}
      <MatchPopup />
    </div>
  );
};

export default Index;
