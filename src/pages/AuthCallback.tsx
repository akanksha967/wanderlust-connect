import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This page exists as a fallback. The main auth listener in useAuth
    // handles session restoration automatically. Just redirect home.
    navigate("/", { replace: true });
  }, [navigate]);

  return <div className="h-[100dvh] flex items-center justify-center text-muted-foreground">Redirecting...</div>;
};

export default AuthCallback;
