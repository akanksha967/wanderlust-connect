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

  // Sync screen state → URL (one-way: screen drives URL)
  // ✅ FIXED: don't sync URL while auth is still loading — prevents premature /login redirect
  useEffect(() => {
    if (authLoading || accessLoading || profileStatus === "loading") return;
    const expectedPath = screenToPath[currentScreen];
    if (expectedPath && location.pathname !== expectedPath) {
      navigate({ pathname: expectedPath, search: location.search }, { replace: true });
    }
  }, [currentScreen, navigate, location.pathname, location.search, authLoading, accessLoading, profileStatus]);

  // Check profile completion status from database
  useEffect(() => {
    let cancelled = false;

    const checkProfileCompletion = async () => {
      if (!userId) {
        if (!cancelled) {
          setProfileStatus("incomplete");
          setHasCompletedProfile(false);
          setCheckedUserId(null);
        }
        return;
      }

      if (checkedUserId === userId) return;

      setProfileStatus("loading");

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, age, photos(id)")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile) {
          const p = profile as any;
          const nameTrimmed = (p.name ?? "").trim();
          const hasRealName = nameTrimmed.length > 0 && nameTrimmed !== "Traveler";
          const hasValidAge = typeof p.age === "number" && p.age >= 18;
          const hasPhoto = (p.photos?.length ?? 0) > 0;
          const isComplete = hasRealName && hasValidAge && hasPhoto;

          if (!cancelled) {
            setProfileStatus(isComplete ? "complete" : "incomplete");
            setHasCompletedProfile(isComplete);
            setCheckedUserId(userId);
          }
        } else {
          if (!cancelled) {
            setProfileStatus("incomplete");
            setHasCompletedProfile(false);
            setCheckedUserId(userId);
          }
        }
      } catch (e) {
        console.error("Error checking profile completion:", e);
        if (!cancelled) {
          setProfileStatus("incomplete");
          setHasCompletedProfile(false);
          setCheckedUserId(userId);
        }
      }
    };

    checkProfileCompletion();
    return () => {
      cancelled = true;
    };
  }, [userId, setHasCompletedProfile, checkedUserId]);

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

    const protectedScreens: ScreenType[] = ["travel", "swipe", "chat", "account", "matches", "admin"];
    if (!hasAccess && accessStatus !== "admin" && protectedScreens.includes(currentScreen)) {
      setScreen("access");
      return;
    }

    const profileRequiredScreens: ScreenType[] = ["travel", "swipe", "chat", "matches", "account"];
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
