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
    const checkAccess = async () => {
      if (authLoading) return;
      if (!user) {
        setAccessStatus({ hasAccess: false, status: "none" });
        setLoading(false);
        setCheckedUserId(null);
        return;
      }

      setLoading(true);
      setCheckedUserId(user.id); // ✅ MOVE THIS HERE — eliminates the isStale race window

      try {
        // ... rest unchanged
      } catch (error) {
        console.error("Error checking access:", error);
        setAccessStatus({ hasAccess: false, status: "none" });
      } finally {
        setLoading(false);
        // remove setCheckedUserId(user.id) from here
      }
    };
    checkAccess();
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
