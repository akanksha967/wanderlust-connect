import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function getParamsFromUrl(): Record<string, string> {
  const params: Record<string, string> = {};
  const url = new URL(window.location.href);
  if (url.hash && url.hash.startsWith("#")) {
    new URLSearchParams(url.hash.slice(1)).forEach((v, k) => { params[k] = v; });
  }
  url.searchParams.forEach((v, k) => { params[k] = v; });
  return params;
}

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const params = getParamsFromUrl();

      if (params.error || params.error_description) {
        setError(params.error_description || params.error || "Sign-in failed");
        if (!cancelled) setTimeout(() => window.location.replace(`${window.location.origin}/login`), 3000);
        return;
      }

      try {
        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
        } else if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError) throw exchangeError;
        } else {
          await supabase.auth.getSession();
        }
      } catch (e) {
        console.error("Auth callback error:", e);
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to sign in");
      }

      if (cancelled) return;

      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          window.history.replaceState(null, "", window.location.pathname);
          window.location.replace(`${window.location.origin}/login`);
          return;
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      window.history.replaceState(null, "", window.location.pathname);
      window.location.replace(`${window.location.origin}/login`);
    };

    run();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-destructive">{error}</p>
        <p className="text-muted-foreground text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex items-center justify-center text-muted-foreground">
      Redirecting...
    </div>
  );
};

export default AuthCallback;
