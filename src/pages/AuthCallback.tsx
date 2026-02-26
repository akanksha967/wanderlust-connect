import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {

    useEffect(() => {

        const handleAuth = async () => {

            const { data, error } = await supabase.auth.getSession();

            if (data?.session) {

                window.location.href = "/";

            } else {

                window.location.href = "/login";

            }

        };

        handleAuth();

    }, []);

    return <div>Logging you in...</div>;

};

export default AuthCallback;