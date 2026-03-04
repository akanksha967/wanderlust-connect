import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import MatchPopup from "@/components/MatchPopup";
import LoginScreen from "@/screens/LoginScreen";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControlFromAuth } from "@/hooks/useAccessControl";
import { supabase } from "@/integrations/supabase/client";

// Lazy-load heavy screens
const ProfileScreen = lazy(() => import("@/screens/ProfileScreen"));
const TravelScreen = lazy(() => import("@/screens/TravelScreen"));
const SwipeScreen = lazy(() => import("@/screens/SwipeScreen"));
const ChatScreen = lazy(() => import("@/screens/ChatScreen"));
const AccountScreen = lazy(() => import("@/screens/AccountScreen"));
const MatchesListScreen = lazy(() => import("@/screens/MatchesListScreen"));
const AccessRequestScreen = lazy(() => import("@/screens/AccessRequestScreen"));
const AdminPanelScreen = lazy(() => import("@/screens/AdminPanelScreen"));
const TripsScreen = lazy(() => import("@/screens/TripsScreen"));

import { pathToScreen, screenToPath, ScreenType } from "@/lib/navigation";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScreen = useAppStore((state) => state.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const setHasCompletedProfile = useAppStore((state) => state.setHasCompletedProfile);
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, status: accessStatus, loading: accessLoading } = useAccessControlFromAuth(user, authLoading);

  const [profileStatus, setProfileStatus] = useState<"loading" | "complete" | "incomplete">("loading");
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  const userId = user?.id ?? null;
  // Handle OAuth hash tokens when landing directly on root URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      window.location.replace(`${window.location.origin}/auth/callback${hash}`);
    }
  }, []);
  // Sync screen state → URL (one-way: screen drives URL)
  // ✅ FIXED: don't sync URL while auth is still loading — prevents premature /login redirect
  useEffect(() => {
    if (authLoading || accessLoading || profileStatus === "loading") return;
    const expectedPath = screenToPath[currentScreen];
    if (expectedPath && location.pathname !== expectedPath) {
      navigate({ pathname: expectedPath, search: location.search }, { replace: true });
    }
  }, [currentScreen, navigate, location.pathname, location.search, authLoading, accessLoading, profileStatus]);

  // Check profile completion status and hydrate full data from database
  useEffect(() => {
    let cancelled = false;

    const hydrateUserData = async () => {
      if (!userId) {
        if (!cancelled) {
          setProfileStatus("incomplete");
          setHasCompletedProfile(false);
          setCheckedUserId(null);
        }
        return;
      }

      const { setUserProfile, setTravelDetails } = useAppStore.getState();
      setProfileStatus("loading");

      try {
        // 1. Fetch profile first to get profile_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, age, bio")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile) {
          const p = profile as any;

          // 2. Fetch photos and vibes using profile_id
          const [{ data: photos }, { data: vibes }] = await Promise.all([
            supabase
              .from("photos")
              .select("url, is_primary")
              .eq("profile_id", p.id),
            supabase
              .from("travel_vibes")
              .select("vibe")
              .eq("profile_id", p.id),
          ]);

          const nameTrimmed = (p.name ?? "").trim();
          const hasRealName = nameTrimmed.length > 0 && nameTrimmed !== "Traveler";
          const hasValidAge = typeof p.age === "number" && p.age >= 18;

          const sortedPhotos = (photos || [])
            .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
            .map(p => p.url);

          const hasPhoto = sortedPhotos.length > 0;
          const isComplete = hasRealName && hasValidAge && hasPhoto;

          if (!cancelled) {
            // Update global store with full data
            setUserProfile({
              id: p.id,
              name: p.name || 'Traveler',
              age: p.age || 0,
              bio: p.bio || '',
              photos: sortedPhotos.length ? sortedPhotos : [],
              travelVibes: (vibes || []).map(v => v.vibe)
            });

            setProfileStatus(isComplete ? "complete" : "incomplete");
            setHasCompletedProfile(isComplete);
            setCheckedUserId(userId);

            // 3. Fetch the most recent travel plan
            const { data: travelPlan } = await supabase
              .from("travel_plans")
              .select("destination, start_date, end_date")
              .eq("profile_id", p.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (travelPlan && !cancelled) {
              setTravelDetails({
                destination: travelPlan.destination,
                startDate: travelPlan.start_date,
                endDate: travelPlan.end_date
              });
            }
          }
        } else {
          if (!cancelled) {
            setProfileStatus("incomplete");
            setHasCompletedProfile(false);
            setCheckedUserId(userId);
          }
        }
      } catch (e) {
        console.error("Error hydrating user data:", e);
        if (!cancelled) {
          setProfileStatus("incomplete");
          setHasCompletedProfile(false);
          setCheckedUserId(userId);
        }
      }
    };

    hydrateUserData();
    return () => {
      cancelled = true;
    };
  }, [userId, setHasCompletedProfile]);

  // ROUTING LOGIC: single effect that decides which screen to show
  useEffect(() => {
    if (authLoading || accessLoading || profileStatus === "loading") return;

    if (!user) {
      if (currentScreen !== "login") setScreen("login");
      return;
    }

    if (currentScreen === "login") {
      if (!hasAccess && accessStatus !== "admin") {
        setScreen("access");
      } else if (profileStatus === "complete") {
        setScreen("travel");
      } else {
        setScreen("profile");
      }
      return;
    }

    if (currentScreen === "access") {
      if (hasAccess || accessStatus === "admin") {
        if (profileStatus === "complete") {
          setScreen("travel");
        } else {
          setScreen("profile");
        }
      }
      return;
    }

    const protectedScreens: ScreenType[] = ["travel", "swipe", "chat", "account", "matches", "admin", "trips"];
    if (!hasAccess && accessStatus !== "admin" && protectedScreens.includes(currentScreen)) {
      setScreen("access");
      return;
    }

    const profileRequiredScreens: ScreenType[] = ["travel", "swipe", "chat", "matches", "account", "trips"];
    if (profileStatus !== "complete" && profileRequiredScreens.includes(currentScreen)) {
      setScreen("profile");
      return;
    }

    if (currentScreen === "profile" && profileStatus === "complete") {
      setScreen("travel");
      return;
    }
  }, [user, authLoading, accessLoading, hasAccess, accessStatus, currentScreen, profileStatus, setScreen]);

  // Safety timeout
  const [showLoadingSlowly, setShowLoadingSlowly] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading || accessLoading || (user && profileStatus === "loading")) {
        setShowLoadingSlowly(true);
      }
    }, 8000);

    const forceFallbackTimer = setTimeout(() => {
      if (authLoading || accessLoading || (user && profileStatus === "loading")) {
        console.warn("Initialization timed out. Forcing fallback.");
        if (!user) {
          if (currentScreen !== "login") setScreen("login");
        } else {
          if (currentScreen === "login") setScreen("profile");
        }
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearTimeout(forceFallbackTimer);
    };
  }, [authLoading, accessLoading, user, profileStatus, currentScreen, setScreen]);

  if (authLoading || accessLoading || (user && profileStatus === "loading")) {
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
      case "login":
        return <LoginScreen />;
      case "access":
        return <AccessRequestScreen />;
      case "profile":
        return <ProfileScreen />;
      case "travel":
        return <TravelScreen />;
      case "swipe":
        return <SwipeScreen />;
      case "chat":
        return <ChatScreen />;
      case "account":
        return <AccountScreen />;
      case "matches":
        return <MatchesListScreen />;
      case "admin":
        return <AdminPanelScreen />;
      case "trips":
        return <TripsScreen />;
      default:
        return <LoginScreen />;
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-background">
      <Suspense fallback={null}>{renderScreen()}</Suspense>
      <MatchPopup />
    </div>
  );
};

export default Index;
