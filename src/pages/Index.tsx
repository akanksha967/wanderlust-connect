import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MatchPopup from '@/components/MatchPopup';
import LoginScreen from '@/screens/LoginScreen';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';
import { supabase } from '@/integrations/supabase/client';

// Lazy-load heavy screens
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'));
const TravelScreen = lazy(() => import('@/screens/TravelScreen'));
const SwipeScreen = lazy(() => import('@/screens/SwipeScreen'));
const ChatScreen = lazy(() => import('@/screens/ChatScreen'));
const AccountScreen = lazy(() => import('@/screens/AccountScreen'));
const MatchesListScreen = lazy(() => import('@/screens/MatchesListScreen'));
const AccessRequestScreen = lazy(() => import('@/screens/AccessRequestScreen'));
const AdminPanelScreen = lazy(() => import('@/screens/AdminPanelScreen'));

type ScreenType = 'login' | 'profile' | 'travel' | 'swipe' | 'chat' | 'account' | 'matches' | 'access' | 'admin';

const pathToScreen: Record<string, ScreenType> = {
  '/': 'login',
  '/login': 'login',
  '/profile': 'profile',
  '/travel': 'travel',
  '/swipe': 'swipe',
  '/matches': 'matches',
  '/chat': 'chat',
  '/account': 'account',
  '/admin': 'admin',
  '/access': 'access',
};

const screenToPath: Record<ScreenType, string> = {
  login: '/login',
  profile: '/profile',
  travel: '/travel',
  swipe: '/swipe',
  matches: '/matches',
  chat: '/chat',
  account: '/account',
  admin: '/admin',
  access: '/access',
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const setHasCompletedProfile = useAppStore((state) => state.setHasCompletedProfile);
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, status: accessStatus, loading: accessLoading } = useAccessControl();

  // Single source of truth for profile completion status
  const [profileStatus, setProfileStatus] = useState<'loading' | 'complete' | 'incomplete'>('loading');
  // Track which userId we last checked to avoid stale state
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  const userId = user?.id ?? null;

  // Sync URL path to screen state on mount and URL changes
  useEffect(() => {
    const screenFromPath = pathToScreen[location.pathname];
    if (screenFromPath && screenFromPath !== currentScreen) {
      // Don't override screen during auth loading - let the routing logic handle it
      if (!authLoading && !accessLoading) {
        setScreen(screenFromPath);
      }
    }
  }, [location.pathname, authLoading, accessLoading]);

  // Sync screen state to URL
  useEffect(() => {
    const expectedPath = screenToPath[currentScreen];
    if (expectedPath && location.pathname !== expectedPath) {
      navigate(
        {
          pathname: expectedPath,
          search: location.search,
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [currentScreen, navigate, location.pathname]);

  // Check profile completion status from database whenever userId changes
  useEffect(() => {
    let cancelled = false;

    const checkProfileCompletion = async () => {
      if (!userId) {
        if (!cancelled) {
          setProfileStatus('incomplete');
          setHasCompletedProfile(false);
          setCheckedUserId(null);
        }
        return;
      }

      // Only show loading if we haven't checked this user yet
      if (checkedUserId !== userId) {
        setProfileStatus('loading');
      }

      try {
        // Get profile with photo count in a single query pattern
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, age')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          if (!cancelled) {
            setProfileStatus('incomplete');
            setHasCompletedProfile(false);
          }
          return;
        }

        // Check name validity (not empty, not default "Traveler")
        const nameTrimmed = (profile.name ?? '').trim();
        const hasRealName = nameTrimmed.length > 0 && nameTrimmed !== 'Traveler';
        const hasValidAge = typeof profile.age === 'number' && profile.age >= 18;

        // Check for at least one photo
        const { data: photos, error: photosError } = await supabase
          .from('photos')
          .select('id')
          .eq('profile_id', profile.id)
          .limit(1);

        if (photosError) throw photosError;

        const hasPhoto = (photos?.length ?? 0) > 0;
        const isComplete = hasRealName && hasValidAge && hasPhoto;

        if (!cancelled) {
          setProfileStatus(isComplete ? 'complete' : 'incomplete');
          setHasCompletedProfile(isComplete);
          setCheckedUserId(userId);
        }
      } catch (e) {
        console.error('Error checking profile completion:', e);
        // Fail closed: treat as incomplete if we can't verify
        if (!cancelled) {
          setProfileStatus('incomplete');
          setHasCompletedProfile(false);
          setCheckedUserId(userId);
        }
      }
    };

    checkProfileCompletion();
    return () => { cancelled = true; };
  }, [userId, setHasCompletedProfile]);

  // ROUTING LOGIC: Handle screen transitions based on auth + profile + access status
  useEffect(() => {
    // Wait for all checks to complete
    if (authLoading || accessLoading || profileStatus === 'loading') return;

    // Not authenticated → login screen
    if (!user) {
      if (currentScreen !== 'login') {
        setScreen('login');
      }
      return;
    }

    // Authenticated but on login/access screens → route appropriately
    if (currentScreen === 'login' || currentScreen === 'access') {
      // Check access first
      if (!hasAccess && accessStatus !== 'admin') {
        setScreen('access');
        return;
      }

      // Returning user with complete profile → go to travel screen to confirm details
      if (profileStatus === 'complete') {
        // If they are already on a valid screen, let them stay (e.g. they navigated there)
        // But if they are just logging in (coming from login/access), send them to travel
        // We can detect "just logging in" because we are in the block for currentScreen === 'login'
        setScreen('travel');
      } else {
        // New user → profile setup
        setScreen('profile');
      }
      return;
    }

    // Returning user somehow on profile screen with complete profile → go to travel
    if (currentScreen === 'profile' && profileStatus === 'complete') {
      setScreen('travel');
      return;
    }

    // Block access to protected screens if no access
    const protectedScreens = ['travel', 'swipe', 'chat', 'account', 'matches', 'admin'];
    if (!hasAccess && accessStatus !== 'admin' && protectedScreens.includes(currentScreen)) {
      setScreen('access');
    }
  }, [user, authLoading, accessLoading, hasAccess, accessStatus, currentScreen, profileStatus, setScreen]);

  // Show loading spinner while checking auth + profile + access
  const LazyFallback = (
    <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (authLoading || accessLoading || (user && profileStatus === 'loading')) {
    return LazyFallback;
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
      <Suspense fallback={LazyFallback}>
        {renderScreen()}
      </Suspense>
      <MatchPopup />

    </div>
  );
};

export default Index;
