import { useEffect, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import MatchPopup from '@/components/MatchPopup';
import LoginScreen from '@/screens/LoginScreen';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControlFromAuth } from '@/hooks/useAccessControl';
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

import { pathToScreen, screenToPath, ScreenType } from '@/lib/navigation';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const setHasCompletedProfile = useAppStore((state) => state.setHasCompletedProfile);
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, status: accessStatus, loading: accessLoading } = useAccessControlFromAuth(user, authLoading);

  // Single source of truth for profile completion status
  const [profileStatus, setProfileStatus] = useState<'loading' | 'complete' | 'incomplete'>('loading');
  // Track which userId we last checked to avoid stale state
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  const userId = user?.id ?? null;

  // Sync URL path to screen state on mount and URL changes
  useEffect(() => {
    const screenFromPath = pathToScreen[location.pathname];
    if (screenFromPath && screenFromPath !== currentScreen) {
      // Don't override screen during initial loading - let the routing logic handle it
      if (!authLoading && !accessLoading) {
        setScreen(screenFromPath);
      }
    }
  }, [location.pathname, authLoading, accessLoading]);

  // Sync screen state to URL (skip if hash has OAuth tokens to avoid stripping them)
  useEffect(() => {
    // Don't navigate while OAuth tokens are in the hash — let auth process them first
    if (window.location.hash && window.location.hash.includes('access_token')) {
      return;
    }

    const expectedPath = screenToPath[currentScreen];
    if (expectedPath && location.pathname !== expectedPath) {
      navigate(
        {
          pathname: expectedPath,
          search: location.search,
        },
        { replace: true }
      );
    }
  }, [currentScreen, navigate, location.pathname]);

  // Check profile completion status from database
  useEffect(() => {
    let cancelled = false;

    const checkProfileCompletion = async () => {
      // If we don't even have a user ID yet, we definitely don't have a profile
      if (!userId) {
        if (!cancelled) {
          setProfileStatus('incomplete');
          setHasCompletedProfile(false);
          setCheckedUserId(null);
        }
        return;
      }

      // If we already checked this user, don't repeat (unless forced by some state)
      if (checkedUserId === userId) return;

      setProfileStatus('loading');

      // Timeout for profile query
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile check timeout')), 8000)
      );

      try {
        const { data: profile, error: profileError } = await Promise.race([
          supabase
            .from('profiles')
            .select(`
              id, name, age,
              photos(id)
            `)
            .eq('user_id', userId)
            .maybeSingle(),
          timeoutPromise as Promise<{ data: any; error: any }>
        ]);

        if (profileError) throw profileError;

        if (profile) {
          const p = profile as any;
          const nameTrimmed = (p.name ?? '').trim();
          const hasRealName = nameTrimmed.length > 0 && nameTrimmed !== 'Traveler';
          const hasValidAge = typeof p.age === 'number' && p.age >= 18;
          const hasPhoto = (p.photos?.length ?? 0) > 0;
          const isComplete = hasRealName && hasValidAge && hasPhoto;

          if (!cancelled) {
            setProfileStatus(isComplete ? 'complete' : 'incomplete');
            setHasCompletedProfile(isComplete);
            setCheckedUserId(userId);
          }
        } else {
          if (!cancelled) {
            setProfileStatus('incomplete');
            setHasCompletedProfile(false);
            setCheckedUserId(userId);
          }
        }
      } catch (e) {
        console.error('Error checking profile completion:', e);
        if (!cancelled) {
          setProfileStatus('incomplete');
          setHasCompletedProfile(false);
          setCheckedUserId(userId);
        }
      }
    };

    checkProfileCompletion();
    return () => { cancelled = true; };
  }, [userId, setHasCompletedProfile, checkedUserId]);

  // ROUTING LOGIC: Handle screen transitions based on auth + profile + access status
  useEffect(() => {
    console.log('[Index] routing:', { authLoading, accessLoading, profileStatus, user: !!user, hasAccess, accessStatus, currentScreen });
    // Wait for all checks to complete
    if (authLoading || accessLoading || profileStatus === 'loading') {
      return;
    }

    // Not authenticated → allow direct entry to profile from Start Travelling, otherwise show login
    if (!user) {
      if (currentScreen !== 'profile' && currentScreen !== 'login') {
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

      // If they are on a specific URL (like /swipe) and it's valid, let them stay
      // The getInitialScreen in store handles this for refreshes.
      const screenFromUrl = pathToScreen[location.pathname];
      if (screenFromUrl && screenFromUrl !== 'login' && screenFromUrl !== 'access') {
        // Only stay if profile is complete or if they are going to profile setup
        if (profileStatus === 'complete' || screenFromUrl === 'profile') {
          setScreen(screenFromUrl);
          return;
        }
      }

      // Returning user with complete profile → go to travel screen to confirm details
      if (profileStatus === 'complete') {
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
    const protectedScreens: ScreenType[] = ['travel', 'swipe', 'chat', 'account', 'matches', 'admin'];
    if (!hasAccess && accessStatus !== 'admin' && protectedScreens.includes(currentScreen)) {
      setScreen('access');
    }

    // Block access to core screens if profile incomplete
    const profileRequiredScreens: ScreenType[] = ['travel', 'swipe', 'chat', 'matches', 'account'];
    if (profileStatus !== 'complete' && profileRequiredScreens.includes(currentScreen)) {
      setScreen('profile');
    }
  }, [user, authLoading, accessLoading, hasAccess, accessStatus, currentScreen, profileStatus, setScreen, location.pathname]);

  // Safety timeout to prevent getting stuck on Initializing RoamMate screen
  const [showLoadingSlowly, setShowLoadingSlowly] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading || accessLoading || (user && profileStatus === 'loading')) {
        setShowLoadingSlowly(true);
      }
    }, 8000); // Show "Taking longer than usual" after 8 seconds

    // Another timer to force a fallback if it's REALLY stuck
    const forceFallbackTimer = setTimeout(() => {
      if (authLoading || accessLoading || (user && profileStatus === 'loading')) {
        console.warn('Initialization timed out. Forcing fallback.');
        // If we're stuck, try to force a screen change
        if (!user) {
          if (currentScreen !== 'login') setScreen('login');
        } else {
          // If we have a user but are stuck, try going to account setup as a fallback
          if (currentScreen === 'login') setScreen('account');
        }
      }
    }, 15000); // Force fallback after 15 seconds

    return () => {
      clearTimeout(timer);
      clearTimeout(forceFallbackTimer);
    };
  }, [authLoading, accessLoading, user, profileStatus, currentScreen, setScreen]);

  if (authLoading || accessLoading || (user && profileStatus === 'loading')) {
    return (
      <div className="h-[100dvh] overflow-hidden flex flex-col items-center justify-center relative">
        <div
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80)` }}
        />
        <div className="fixed inset-0 bg-gradient-to-br from-sky-400/40 via-indigo-400/30 to-violet-500/40" />
        <div className="fixed inset-0 backdrop-blur-md" />

        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-xl border border-white/40 flex items-center justify-center shadow-xl">
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white text-sm font-medium drop-shadow-lg animate-pulse">Initializing RoamMate...</p>

          {showLoadingSlowly && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-col gap-3"
            >
              <p className="text-white/80 text-xs">This is taking longer than usual...</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs hover:bg-white/30 transition-all"
              >
                Try Refreshing
              </button>
            </motion.div>
          )}
        </div>
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
      <Suspense fallback={null}>
        {renderScreen()}
      </Suspense>
      <MatchPopup />

    </div>
  );
};

export default Index;
