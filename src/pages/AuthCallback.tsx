import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Let Supabase read the OAuth tokens from the URL hash and set the session.
      // getSession() triggers the client to parse the hash and restore the session.
      await supabase.auth.getSession();
      if (cancelled) return;
      // Redirect to /login so the app loads and can move the user to profile/travel.
      navigate("/login", { replace: true });
    };

    run();
    return () => { cancelled = true; };
  }, [navigate]);

  return <div className="h-[100dvh] flex items-center justify-center text-muted-foreground">Redirecting...</div>;
};

export default AuthCallback;
