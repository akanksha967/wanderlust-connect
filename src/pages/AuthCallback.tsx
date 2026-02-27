import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) {
        navigate("/", { replace: true });
      }
    };

    const restoreSession = async () => {
      try {
        const rawHash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(rawHash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
            setTimeout(() => resolve({ error: new Error("setSession timeout") }), 5000)
          );

          const sessionPromise = supabase.auth
            .setSession({ access_token, refresh_token })
            .catch((error) => ({ error }));

          const result = await Promise.race([sessionPromise, timeoutPromise]);

          if (!result.error) {
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error("Auth callback session restore failed:", result.error);
          }
        }
      } finally {
        finish();
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return <div>Redirecting...</div>;
};

export default AuthCallback;

