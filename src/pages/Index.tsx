import { useEffect, useMemo, useState } from 'react';
import MatchPopup from '@/components/MatchPopup';
import LoginScreen from '@/screens/LoginScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import TravelScreen from '@/screens/TravelScreen';
import SwipeScreen from '@/screens/SwipeScreen';
import ChatScreen from '@/screens/ChatScreen';
import AccountScreen from '@/screens/AccountScreen';
import MatchesListScreen from '@/screens/MatchesListScreen';
import AccessRequestScreen from '@/screens/AccessRequestScreen';
import AdminPanelScreen from '@/screens/AdminPanelScreen';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const hasCompletedProfile = useAppStore((state) => state.hasCompletedProfile);
  const setHasCompletedProfile = useAppStore((state) => state.setHasCompletedProfile);
  const { user, loading, hasExistingProfile } = useAuth();
  const { hasAccess, status: accessStatus, loading: accessLoading } = useAccessControl();

  // Authoritative onboarding check (prevents any local/persisted state from bypassing profile completion).
  const [profileChecked, setProfileChecked] = useState(false);
  const [dbProfileComplete, setDbProfileComplete] = useState(false);

  const userId = user?.id ?? null;
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Only run the onboarding check on screens where onboarding routing is relevant.
      // This also ensures we re-check right after Profile -> Travel.
      const shouldCheck = currentScreen === 'login' || currentScreen === 'profile' || currentScreen === 'travel';
      if (!shouldCheck) {
        setProfileChecked(true);
        return;
      }

      if (!userId) {
        setDbProfileComplete(false);
        setProfileChecked(true);
        setHasCompletedProfile(false);
        return;
      }

      setProfileChecked(false);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, age')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          if (!cancelled) {
            setDbProfileComplete(false);
            setHasCompletedProfile(false);
          }
          return;
        }

        const nameTrimmed = (profile.name ?? '').trim();
        const hasRealName = nameTrimmed.length > 0 && nameTrimmed !== 'Traveler';
        const hasValidAge = typeof profile.age === 'number' && profile.age >= 18;

        const { data: photos, error: photosError } = await supabase
          .from('photos')
          .select('id')
          .eq('profile_id', profile.id)
          .limit(1);

        if (photosError) throw photosError;

        const hasPhoto = (photos?.length ?? 0) > 0;
        const isComplete = hasRealName && hasValidAge && hasPhoto;

        if (!cancelled) {
          setDbProfileComplete(isComplete);
          setHasCompletedProfile(isComplete);
        }
      } catch (e) {
        // Fail closed: if we can't verify completion, treat as incomplete
        if (!cancelled) {
          setDbProfileComplete(false);
          setHasCompletedProfile(false);
        }
      } finally {
        if (!cancelled) setProfileChecked(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, currentScreen, setHasCompletedProfile]);

  const isProfileComplete = useMemo(() => {
    // If the DB check isn't ready yet, fall back to existing client flags.
    // Once checked, trust the DB result.
    if (!profileChecked) return hasCompletedProfile || hasExistingProfile;
    return dbProfileComplete;
  }, [profileChecked, dbProfileComplete, hasCompletedProfile, hasExistingProfile]);

  // Only redirect when explicitly on login screen and user is authenticated
  useEffect(() => {
    if (!loading && !accessLoading && user && currentScreen === 'login') {
      // Wait until we've verified onboarding state
      if (!profileChecked) return;
      
      // Check access first - if no access, show access request screen
      if (!hasAccess && accessStatus !== 'admin') {
        setScreen('access');
        return;
      }
      
      if (isProfileComplete) {
        // Returning user - check if there's a last screen they were on
        const lastScreen = typeof window !== 'undefined' 
          ? localStorage.getItem('lastScreen') 
          : null;
        
        // If they have a valid last screen, go there; otherwise stay on current screen
        const validScreens = ['swipe', 'chat', 'account', 'matches', 'travel', 'admin'];
        if (lastScreen && validScreens.includes(lastScreen)) {
          setScreen(lastScreen as any);
        } else if (currentScreen === 'login') {
          // Only redirect to swipe if we're actually on login (not when refreshing on another screen)
          setScreen('swipe');
        }
      } else {
        // New user - go to profile setup
        setScreen('profile');
      }
    }
  }, [user, loading, accessLoading, hasAccess, accessStatus, currentScreen, isProfileComplete, profileChecked, setScreen]);

  // If a returning user somehow lands on the profile setup screen (e.g. refresh/persisted state),
  // send them to Travel instead.
  useEffect(() => {
    if (!loading && user && currentScreen === 'profile' && profileChecked && isProfileComplete) {
      setScreen('travel');
    }
  }, [user, loading, currentScreen, profileChecked, isProfileComplete, setScreen]);

  // Hard guard: block access to main screens if user doesn't have access
  useEffect(() => {
    if (loading || accessLoading || !user) return;
    if (!profileChecked) return;
    
    const protectedScreens = ['travel', 'swipe', 'chat', 'account', 'matches', 'admin'];
    if (!hasAccess && accessStatus !== 'admin' && protectedScreens.includes(currentScreen)) {
      setScreen('access');
    }
  }, [user, loading, accessLoading, hasAccess, accessStatus, currentScreen, profileChecked, setScreen]);

  // Only redirect to login if user is not authenticated
  // Don't redirect if we're still loading or if user exists
  useEffect(() => {
    if (!loading && !user && currentScreen !== 'login') {
      setScreen('login');
    }
  }, [user, loading, currentScreen, setScreen]);

  // Show nothing while checking auth + onboarding + access status
  if (loading || accessLoading || (user && !profileChecked)) {
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
      case 'access':
        return <AccessRequestScreen />;
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
      case 'admin':
        return <AdminPanelScreen />;
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
