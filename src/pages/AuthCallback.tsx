import { useEffect } from "react";

const AuthCallback = () => {
  useEffect(() => {
    // Session restoration is handled centrally in useAuth via getSession + auth listener.
    window.location.replace("/");
  }, []);

  return <div>Redirecting...</div>;
};

export default AuthCallback;
