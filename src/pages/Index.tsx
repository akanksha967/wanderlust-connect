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
  const { user, loading } = useAuth();

  // Redirect authenticated users away from login screen
  useEffect(() => {
    if (!loading && user && currentScreen === 'login') {
      // If profile is complete, go to swipe; otherwise go to profile setup
      setScreen(hasCompletedProfile ? 'swipe' : 'profile');
    }
  }, [user, loading, currentScreen, hasCompletedProfile, setScreen]);

  // Redirect unauthenticated users to login
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
