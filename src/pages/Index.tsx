import MobileFrame from '@/components/MobileFrame';
import MatchPopup from '@/components/MatchPopup';
import LoginScreen from '@/screens/LoginScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import TravelScreen from '@/screens/TravelScreen';
import SwipeScreen from '@/screens/SwipeScreen';
import ChatScreen from '@/screens/ChatScreen';
import AccountScreen from '@/screens/AccountScreen';
import { useAppStore } from '@/store/useAppStore';

const Index = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);

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
      default:
        return <LoginScreen />;
    }
  };

  return (
    <>
      <MobileFrame>
        {renderScreen()}
        <MatchPopup />
      </MobileFrame>
    </>
  );
};

export default Index;
