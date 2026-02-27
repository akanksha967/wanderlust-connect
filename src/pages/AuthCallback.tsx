import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error(error);
        window.location.href = "/login";
        return;
      }

      window.location.href = "/";
    };

    handleAuth();
  }, []);

  return <div>Logging you in...</div>;
};

export default AuthCallback;
