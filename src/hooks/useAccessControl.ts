import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AccessStatus {
  hasAccess: boolean;
  status: "loading" | "none" | "pending" | "approved" | "rejected" | "admin";
}

const useAccessControlBase = (user: User | null, authLoading: boolean) => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>({
    hasAccess: false,
    status: "loading",
  });
  const [loading, setLoading] = useState(true);
  // Track which userId we last completed a check for
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      if (authLoading) return;

      if (!user) {
        if (!cancelled) {
          setAccessStatus({ hasAccess: false, status: "none" });
          setLoading(false);
          setCheckedUserId(null);
        }
        return;
      }

      const currentUserId = user.id;
      setLoading(true);
      setCheckedUserId(currentUserId);

      try {
        const { data, error } = await supabase.rpc("check_user_access");
        if (error) throw error;

        const result = (data ?? {}) as { has_access?: boolean; status?: string };
        const status =
          result.status === "approved" ||
          result.status === "pending" ||
          result.status === "rejected" ||
          result.status === "admin"
            ? result.status
            : "none";

        if (!cancelled) {
          setAccessStatus({
            hasAccess: Boolean(result.has_access),
            status,
          });
        }
      } catch (error) {
        console.error("Error checking access:", error);

        // Fallback to direct table lookup if RPC fails
        try {
          const { data } = await supabase
            .from("access_requests")
            .select("status")
            .eq("user_id", currentUserId)
            .maybeSingle();

          const fallbackStatus =
            data?.status === "approved" || data?.status === "pending" || data?.status === "rejected"
              ? data.status
              : "none";

          if (!cancelled) {
            setAccessStatus({
              hasAccess: fallbackStatus === "approved",
              status: fallbackStatus,
            });
          }
        } catch (fallbackError) {
          console.error("Fallback access check failed:", fallbackError);
          if (!cancelled) {
            setAccessStatus({ hasAccess: false, status: "none" });
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);
  // Treat as loading if user changed but check hasn't completed yet
  const isStale = !!user && checkedUserId !== user.id;

  const requestAccess = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("access_requests").insert({
        user_id: user.id,
        email: user.email || user.phone || "unknown",
      });

      if (error) throw error;

      setAccessStatus({ hasAccess: false, status: "pending" });
      return true;
    } catch (error) {
      console.error("Error requesting access:", error);
      return false;
    }
  };

  const useInviteCode = async (code: string) => {
    try {
      const { data, error } = await supabase.rpc("use_invite_code", {
        invite_code: code.toUpperCase().trim(),
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (result.success) {
        setAccessStatus({ hasAccess: true, status: "approved" });
      }

      return result;
    } catch (error: any) {
      console.error("Error using invite code:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    ...accessStatus,
    loading: loading || authLoading || isStale,
    requestAccess,
    useInviteCode,
  };
};

export const useAccessControl = () => {
  const { user, loading: authLoading } = useAuth();
  return useAccessControlBase(user, authLoading);
};

export const useAccessControlFromAuth = (user: User | null, authLoading: boolean) => {
  return useAccessControlBase(user, authLoading);
};
